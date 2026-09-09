from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.turma import TurmaCreate, TurmaRead
from app.services import turmas as turmas_service


router = APIRouter()


@router.get("", response_model=list[TurmaRead])
def list_turmas(db: Session = Depends(get_db)) -> list[TurmaRead]:
    return turmas_service.listar_turmas(db)


@router.post("", response_model=TurmaRead, status_code=status.HTTP_201_CREATED)
def create_turma(payload: TurmaCreate, db: Session = Depends(get_db)) -> TurmaRead:
    return turmas_service.criar_turma(db, payload)


@router.delete("/{turma_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_turma(turma_id: int, db: Session = Depends(get_db)) -> Response:
    turmas_service.excluir_turma(db, turma_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
