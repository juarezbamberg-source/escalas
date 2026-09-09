from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.professor import ProfessorCreate, ProfessorRead
from app.services import professores as professores_service


router = APIRouter()


@router.get("", response_model=list[ProfessorRead])
def list_professores(db: Session = Depends(get_db)) -> list[ProfessorRead]:
    return professores_service.listar_professores(db)


@router.post("", response_model=ProfessorRead, status_code=status.HTTP_201_CREATED)
def create_professor(payload: ProfessorCreate, db: Session = Depends(get_db)) -> ProfessorRead:
    return professores_service.criar_professor(db, payload)


@router.delete("/{professor_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_professor(professor_id: int, db: Session = Depends(get_db)) -> Response:
    professores_service.excluir_professor(db, professor_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
