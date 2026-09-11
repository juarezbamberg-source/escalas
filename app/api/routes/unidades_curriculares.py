from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.unidade_curricular import (
    UnidadeCurricularCreate,
    UnidadeCurricularRead,
    UnidadeCurricularUpdate,
)
from app.services import unidades_curriculares as ucs_service

router = APIRouter()


@router.get("", response_model=list[UnidadeCurricularRead])
def listar_ucs(db: Session = Depends(get_db)):
    return ucs_service.listar_ucs(db)


@router.post("", response_model=UnidadeCurricularRead, status_code=status.HTTP_201_CREATED)
def criar_uc(payload: UnidadeCurricularCreate, db: Session = Depends(get_db)):
    return ucs_service.criar_uc(db, payload)


@router.patch("/{uc_id}", response_model=UnidadeCurricularRead)
def atualizar_uc(uc_id: int, payload: UnidadeCurricularUpdate, db: Session = Depends(get_db)):
    """Atualizacao parcial de unidade curricular (Onda 4 - PATCH)."""
    return ucs_service.atualizar_uc(db, uc_id, payload)


@router.delete("/{uc_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_uc(uc_id: int, db: Session = Depends(get_db)):
    ucs_service.excluir_uc(db, uc_id)
