from datetime import date

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models import Atribuicao, Professor, Turma, UnidadeCurricular
from app.schemas.atribuicao import AtribuicaoCreate, AtribuicaoUpdate
from app.services.errors import ConflitoDeNegocioError, EntidadeNaoEncontradaError


def _carregar(db: Session, atribuicao_id: int) -> Atribuicao:
    atribuicao = db.scalar(
        select(Atribuicao)
        .where(Atribuicao.id == atribuicao_id)
        .options(
            joinedload(Atribuicao.professor),
            joinedload(Atribuicao.turma),
            joinedload(Atribuicao.unidade_curricular),
            joinedload(Atribuicao.professor_substituto),
        )
    )
    if atribuicao is None:
        raise EntidadeNaoEncontradaError("Atribuicao nao encontrada.")
    return atribuicao


def _validar_referencias(db: Session, payload: AtribuicaoCreate) -> None:
    if db.get(Professor, payload.professor_id) is None:
        raise ConflitoDeNegocioError("Professor titular nao encontrado.")
    if db.get(Turma, payload.turma_id) is None:
        raise ConflitoDeNegocioError("Turma nao encontrada.")
    if db.get(UnidadeCurricular, payload.uc_id) is None:
        raise ConflitoDeNegocioError("Unidade curricular nao encontrada.")
    if payload.professor_substituto_id is not None:
        if payload.professor_substituto_id == payload.professor_id:
            raise ConflitoDeNegocioError("Substituto deve ser diferente do titular.")
        if db.get(Professor, payload.professor_substituto_id) is None:
            raise ConflitoDeNegocioError("Professor substituto nao encontrado.")


def listar_atribuicoes(
    db: Session,
    professor_id: int | None = None,
    turma_id: int | None = None,
    vigente_em: date | None = None,
) -> list[Atribuicao]:
    query = (
        select(Atribuicao)
        .options(
            joinedload(Atribuicao.professor),
            joinedload(Atribuicao.turma),
            joinedload(Atribuicao.unidade_curricular),
            joinedload(Atribuicao.professor_substituto),
        )
        .order_by(Atribuicao.data_inicio, Atribuicao.id)
    )
    if professor_id is not None:
        query = query.where(Atribuicao.professor_id == professor_id)
    if turma_id is not None:
        query = query.where(Atribuicao.turma_id == turma_id)
    if vigente_em is not None:
        query = query.where(
            Atribuicao.data_inicio <= vigente_em, Atribuicao.data_fim >= vigente_em
        )
    return list(db.scalars(query).all())


def criar_atribuicao(db: Session, payload: AtribuicaoCreate) -> Atribuicao:
    _validar_referencias(db, payload)
    if payload.data_inicio < date.today() and not payload.justificativa_retroativa:
        raise ConflitoDeNegocioError(
            "Atribuicao retroativa exige justificativa_retroativa."
        )
    atribuicao = Atribuicao(**payload.model_dump())
    db.add(atribuicao)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflitoDeNegocioError("Atribuicao invalida ou conflitante.") from exc
    db.refresh(atribuicao)
    return atribuicao


def atualizar_atribuicao(db: Session, atribuicao_id: int, payload: AtribuicaoUpdate) -> Atribuicao:
    atribuicao = _carregar(db, atribuicao_id)
    dados = payload.model_dump(exclude_unset=True)
    for campo, valor in dados.items():
        setattr(atribuicao, campo, valor)
    if atribuicao.data_fim < atribuicao.data_inicio:
        raise ConflitoDeNegocioError("data_fim deve ser maior ou igual a data_inicio.")
    db.commit()
    db.refresh(atribuicao)
    return atribuicao


def excluir_atribuicao(db: Session, atribuicao_id: int, confirmar: bool = False) -> None:
    if not confirmar:
        raise ConflitoDeNegocioError("Confirmacao obrigatoria para excluir atribuicao.")
    atribuicao = _carregar(db, atribuicao_id)
    db.delete(atribuicao)
    db.commit()
