from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.turma import TurmaCreate, TurmaRead, TurmaUpdate
from app.services import turmas as turmas_service

router = APIRouter()


@router.get("", response_model=list[TurmaRead])
def listar_turmas(db: Session = Depends(get_db)):
    return turmas_service.listar_turmas(db)


@router.post("", response_model=TurmaRead, status_code=status.HTTP_201_CREATED)
def criar_turma(payload: TurmaCreate, db: Session = Depends(get_db)):
    return turmas_service.criar_turma(db, payload)


@router.patch("/{turma_id}", response_model=TurmaRead)
def atualizar_turma(turma_id: int, payload: TurmaUpdate, db: Session = Depends(get_db)):
    """Atualizacao parcial de turma (Onda 4 - PATCH)."""
    return turmas_service.atualizar_turma(db, turma_id, payload)


@router.delete("/{turma_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_turma(turma_id: int, db: Session = Depends(get_db)):
    turmas_service.excluir_turma(db, turma_id)
