from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Turma
from app.schemas.turma import TurmaCreate, TurmaRead
from app.services.alocacoes import validar_turno
from app.services.errors import ConflitoDeNegocioError, EntidadeNaoEncontradaError


def listar_turmas(db: Session) -> list[TurmaRead]:
    turmas = db.query(Turma).order_by(Turma.codigo.asc()).all()
    return [TurmaRead.model_validate(turma) for turma in turmas]


def criar_turma(db: Session, payload: TurmaCreate) -> TurmaRead:
    db.get_bind()
    turma = Turma(
        codigo=payload.codigo,
        nome=payload.nome,
        turno_padrao=validar_turno(payload.turno_padrao),
        uc_id=payload.uc_id,
    )
    db.add(turma)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflitoDeNegocioError("Nao foi possivel criar a turma por violacao de integridade.") from exc
    db.refresh(turma)
    return TurmaRead(
        id=turma.id,
        codigo=turma.codigo,
        nome=turma.nome,
        turno_padrao=turma.turno_padrao.value,
        uc_id=turma.uc_id,
    )


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
