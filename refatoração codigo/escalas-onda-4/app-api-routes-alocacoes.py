from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.alocacao import AlocacaoRead, AlocacaoUpdate
from app.services import alocacoes as alocacoes_service

router = APIRouter()


@router.patch("/{alocacao_id}", response_model=AlocacaoRead)
def atualizar_alocacao(alocacao_id: int, payload: AlocacaoUpdate, db: Session = Depends(get_db)):
    """Atualizacao parcial de alocacao (Onda 4 - PATCH)."""
    return alocacoes_service.atualizar_alocacao(db, alocacao_id, payload)
