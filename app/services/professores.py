from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Professor
from app.schemas.professor import ProfessorCreate, ProfessorRead
from app.services.errors import ConflitoDeNegocioError, EntidadeNaoEncontradaError


def listar_professores(db: Session) -> list[ProfessorRead]:
    professores = db.query(Professor).order_by(Professor.nome.asc()).all()
    return [ProfessorRead.model_validate(professor) for professor in professores]


def criar_professor(db: Session, payload: ProfessorCreate) -> ProfessorRead:
    professor = Professor(**payload.model_dump())
    db.add(professor)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflitoDeNegocioError("Ja existe um professor com esse nome.") from exc
    db.refresh(professor)
    return ProfessorRead.model_validate(professor)


def excluir_professor(db: Session, professor_id: int) -> None:
    professor = db.get(Professor, professor_id)
    if not professor:
        raise EntidadeNaoEncontradaError("Professor nao encontrado.")
    try:
        db.delete(professor)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflitoDeNegocioError("Nao e possivel excluir professor vinculado a alocacoes existentes.") from exc
