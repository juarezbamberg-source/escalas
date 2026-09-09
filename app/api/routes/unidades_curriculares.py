from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.unidade_curricular import UnidadeCurricularCreate, UnidadeCurricularRead
from app.services import unidades_curriculares as ucs_service


router = APIRouter()


@router.get("", response_model=list[UnidadeCurricularRead])
def list_ucs(db: Session = Depends(get_db)) -> list[UnidadeCurricularRead]:
    return ucs_service.listar_ucs(db)


@router.post("", response_model=UnidadeCurricularRead, status_code=status.HTTP_201_CREATED)
def create_uc(payload: UnidadeCurricularCreate, db: Session = Depends(get_db)) -> UnidadeCurricularRead:
    return ucs_service.criar_uc(db, payload)


@router.delete("/{uc_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_uc(uc_id: int, db: Session = Depends(get_db)) -> Response:
    ucs_service.excluir_uc(db, uc_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
