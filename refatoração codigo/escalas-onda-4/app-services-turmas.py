from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Turma
from app.schemas.turma import TurmaCreate, TurmaRead, TurmaUpdate
from app.services.errors import ConflitoDeNegocioError, EntidadeNaoEncontradaError


def listar_turmas(db: Session) -> list[TurmaRead]:
    turmas = db.query(Turma).order_by(Turma.codigo.asc()).all()
    return [TurmaRead.model_validate(turma) for turma in turmas]


def criar_turma(db: Session, payload: TurmaCreate) -> TurmaRead:
    turma = Turma(**payload.model_dump())
    db.add(turma)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflitoDeNegocioError("Ja existe uma turma com esse codigo.") from exc
    db.refresh(turma)
    return TurmaRead.model_validate(turma)


def atualizar_turma(db: Session, turma_id: int, payload: TurmaUpdate) -> TurmaRead:
    """Atualizacao parcial de turma (Onda 4 - PATCH)."""
    turma = db.get(Turma, turma_id)
    if not turma:
        raise EntidadeNaoEncontradaError("Turma nao encontrada.")
    dados = payload.model_dump(exclude_unset=True)
    for campo, valor in dados.items():
        setattr(turma, campo, valor)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflitoDeNegocioError("Ja existe uma turma com esse codigo.") from exc
    db.refresh(turma)
    return TurmaRead.model_validate(turma)


def excluir_turma(db: Session, turma_id: int) -> None:
    turma = db.get(Turma, turma_id)
    if not turma:
        raise EntidadeNaoEncontradaError("Turma nao encontrada.")
    try:
        db.delete(turma)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflitoDeNegocioError("Nao e possivel excluir turma vinculada a alocacoes existentes.") from exc
