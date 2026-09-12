from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import require_usuario_habilitado
from app.db.session import get_db
from app.models import Usuario
from app.schemas.carga import CargaProfessorItem
from app.services import carga as carga_service

router = APIRouter(dependencies=[Depends(require_usuario_habilitado)])


@router.get("/professores/carga", response_model=list[CargaProfessorItem])
def listar_carga_professores(db: Session = Depends(get_db)) -> list[CargaProfessorItem]:
    """Carga horaria consolidada por professor (Onda 3)."""
    return carga_service.calcular_carga_por_professor(db)
