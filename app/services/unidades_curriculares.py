from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import UnidadeCurricular
from app.schemas.unidade_curricular import (
    UnidadeCurricularCreate,
    UnidadeCurricularRead,
    UnidadeCurricularUpdate,
)
from app.services.errors import ConflitoDeNegocioError, EntidadeNaoEncontradaError


def listar_ucs(db: Session, incluir_inativos: bool = False) -> list[UnidadeCurricularRead]:
    """Onda 7: retorna apenas ativas por padrao; incluir_inativos=true traz todas."""
    query = db.query(UnidadeCurricular).order_by(UnidadeCurricular.codigo.asc())
    if not incluir_inativos:
        query = query.filter(UnidadeCurricular.ativo.is_(True))
    ucs = query.all()
    return [UnidadeCurricularRead.model_validate(uc) for uc in ucs]


def criar_uc(db: Session, payload: UnidadeCurricularCreate) -> UnidadeCurricularRead:
    uc = UnidadeCurricular(**payload.model_dump())
    db.add(uc)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflitoDeNegocioError("Ja existe uma unidade curricular com esse codigo.") from exc
    db.refresh(uc)
    return UnidadeCurricularRead.model_validate(uc)


def atualizar_uc(db: Session, uc_id: int, payload: UnidadeCurricularUpdate) -> UnidadeCurricularRead:
    """Atualizacao parcial de unidade curricular (Onda 4 - PATCH)."""
    uc = db.get(UnidadeCurricular, uc_id)
    if not uc:
        raise EntidadeNaoEncontradaError("Unidade curricular nao encontrada.")
    dados = payload.model_dump(exclude_unset=True)
    for campo, valor in dados.items():
        setattr(uc, campo, valor)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflitoDeNegocioError("Ja existe uma unidade curricular com esse codigo.") from exc
    db.refresh(uc)
    return UnidadeCurricularRead.model_validate(uc)


def excluir_uc(db: Session, uc_id: int) -> None:
    uc = db.get(UnidadeCurricular, uc_id)
    if not uc:
        raise EntidadeNaoEncontradaError("Unidade curricular nao encontrada.")
    try:
        db.delete(uc)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflitoDeNegocioError("Nao e possivel excluir unidade curricular vinculada a turmas.") from exc
