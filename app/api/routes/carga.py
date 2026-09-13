from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import require_usuario_habilitado
from app.db.session import get_db
from app.models import Atribuicao, Usuario
from app.schemas.atribuicao import AtribuicaoRead
from app.schemas.carga import CargaPrevistaItem, CargaProfessorItem
from app.services import carga as carga_service
from app.services import atribuicoes as atribuicoes_service

router = APIRouter(dependencies=[Depends(require_usuario_habilitado)])


@router.get("/professores/carga", response_model=list[CargaProfessorItem] | list[CargaPrevistaItem])
def listar_carga_professores(
    tipo: str = Query(default="realizada", pattern="^(prevista|realizada)$"),
    vigente_em: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[CargaProfessorItem] | list[CargaPrevistaItem]:
    """Carga por professor: realizada (alocacoes, Onda 3) ou prevista (atribuicoes, Onda 6)."""
    if tipo == "prevista":
        return carga_service.calcular_carga_prevista_por_professor(db, vigente_em=vigente_em)
    return carga_service.calcular_carga_por_professor(db)


@router.get("/professores/{professor_id}/atribuicoes", response_model=list[AtribuicaoRead])
def listar_atribuicoes_do_professor(
    professor_id: int,
    vigente_em: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[AtribuicaoRead]:
    """Turmas/UCs atribuidas ao professor na vigencia (Onda 6, RF-04)."""
    items = atribuicoes_service.listar_atribuicoes(
        db, professor_id=professor_id, vigente_em=vigente_em
    )
    return [AtribuicaoRead.de_entidade(item) for item in items]
