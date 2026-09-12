from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import gerar_hash_senha
from app.models import Funcao, Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate


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
    for campo, valor in dados.items():
        setattr(usuario, campo, valor)
    if nova_senha is not None:
        usuario.senha_hash = gerar_hash_senha(nova_senha)
        usuario.trocar_senha_no_proximo_acesso = True
    db.commit()
    db.refresh(usuario)
    return usuario
