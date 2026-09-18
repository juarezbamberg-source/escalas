from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import gerar_hash_senha
from app.models import Alocacao, Atribuicao, Funcao, Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate


class RegraDeNegocioUsuarioError(Exception):
    """Violação de regra de negócio no ciclo de vida de usuários (Onda 9)."""

    def __init__(self, mensagem: str) -> None:
        super().__init__(mensagem)
        self.mensagem = mensagem


def listar_usuarios(
    db: Session,
    funcao: Funcao | None = None,
    ativo: bool | None = None,
    busca: str | None = None,
) -> tuple[list[Usuario], int]:
    query = select(Usuario).order_by(Usuario.username)
    if funcao is not None:
        query = query.where(Usuario.funcao == funcao)
    if ativo is not None:
        query = query.where(Usuario.ativo == ativo)
    if busca:
        query = query.where(Usuario.username.ilike(f"%{busca}%"))
    items = list(db.scalars(query).all())
    return items, len(items)


def _contar_admins_ativos(db: Session) -> int:
    return int(
        db.scalar(
            select(func.count()).where(Usuario.funcao == Funcao.ADMIN, Usuario.ativo == True)  # noqa: E712
        )
        or 0
    )


def _alocacoes_futuras_do_professor(db: Session, professor_id: int) -> list[Alocacao]:
    hoje = datetime.now(timezone.utc).date()
    return list(
        db.scalars(
            select(Alocacao)
            .where(
                Alocacao.data >= hoje,
                (Alocacao.professor_titular_id == professor_id)
                | (Alocacao.professor_substituto_id == professor_id),
            )
            .order_by(Alocacao.data)
        ).all()
    )


def _validar_desativacao(db: Session, usuario: Usuario) -> None:
    """Travas da desativação (Onda 9, RF-02 e RF-04)."""
    if usuario.funcao == Funcao.ADMIN and _contar_admins_ativos(db) <= 1:
        raise RegraDeNegocioUsuarioError(
            "Nao e possivel desativar o unico admin ativo do sistema."
        )
    if usuario.professor_id is not None:
        futuras = _alocacoes_futuras_do_professor(db, usuario.professor_id)
        if futuras:
            datas = ", ".join(alocacao.data.isoformat() for alocacao in futuras[:10])
            raise RegraDeNegocioUsuarioError(
                f"Professor vinculado tem {len(futuras)} alocacao(oes) futura(s): {datas}. "
                "Resolva as alocacoes antes de desativar."
            )


def criar_usuario(db: Session, payload: UsuarioCreate) -> Usuario:
    usuario = Usuario(
        nome=payload.nome,
        username=payload.username,
        senha_hash=gerar_hash_senha(payload.senha_temporaria),
        funcao=payload.funcao,
        ativo=True,
        trocar_senha_no_proximo_acesso=True,
        professor_id=payload.professor_id,
    )
    db.add(usuario)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError("Username ja cadastrado.") from exc
    db.refresh(usuario)
    return usuario


def atualizar_usuario(db: Session, usuario_id: int, payload: UsuarioUpdate) -> Usuario:
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise LookupError("Usuario nao encontrado.")
    dados = payload.model_dump(exclude_unset=True)
    nova_senha = dados.pop("nova_senha_temporaria", None)

    desativando = dados.get("ativo") is False and usuario.ativo
    reativando = dados.get("ativo") is True and not usuario.ativo

    if desativando:
        _validar_desativacao(db, usuario)

    for campo, valor in dados.items():
        setattr(usuario, campo, valor)
    if desativando:
        usuario.desativado_em = datetime.now(timezone.utc)
    if reativando:
        usuario.motivo_desativacao = None
        usuario.desativado_em = None
    if nova_senha is not None:
        usuario.senha_hash = gerar_hash_senha(nova_senha)
        usuario.trocar_senha_no_proximo_acesso = True
    db.commit()
    db.refresh(usuario)
    return usuario


def excluir_usuario(db: Session, usuario_id: int) -> None:
    """Exclusão física criteriosa (Onda 9, RF-01 e RF-02)."""
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise LookupError("Usuario nao encontrado.")

    if usuario.funcao == Funcao.ADMIN and _contar_admins_ativos(db) <= 1:
        raise RegraDeNegocioUsuarioError(
            "Nao e possivel excluir o unico admin ativo do sistema."
        )

    if usuario.professor_id is not None:
        hoje = datetime.now(timezone.utc).date()
        total_alocacoes = int(
            db.scalar(
                select(func.count()).where(
                    (Alocacao.professor_titular_id == usuario.professor_id)
                    | (Alocacao.professor_substituto_id == usuario.professor_id)
                )
            )
            or 0
        )
        if total_alocacoes:
            raise RegraDeNegocioUsuarioError(
                f"Professor vinculado tem {total_alocacoes} alocacao(oes) registradas. "
                "Exclusao permitida apenas sem historico de alocacoes."
            )
        atribuicoes_vigentes = int(
            db.scalar(
                select(func.count()).where(
                    Atribuicao.professor_id == usuario.professor_id,
                    Atribuicao.data_inicio <= hoje,
                    Atribuicao.data_fim >= hoje,
                )
            )
            or 0
        )
        if atribuicoes_vigentes:
            raise RegraDeNegocioUsuarioError(
                f"Professor vinculado tem {atribuicoes_vigentes} atribuicao(oes) vigente(s). "
                "Exclusao permitida apenas sem atribuicoes ativas."
            )

    db.delete(usuario)
    db.commit()
