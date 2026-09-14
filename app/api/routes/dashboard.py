from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import bloquear_professor, require_usuario_habilitado
from app.db.session import get_db
from app.models import Usuario
from app.schemas.dashboard import DashboardResumoItem
from app.services import dashboard as dashboard_service

router = APIRouter(dependencies=[Depends(require_usuario_habilitado), Depends(bloquear_professor)])


@router.get("/dashboard/resumo", response_model=DashboardResumoItem)
def obter_resumo_dashboard(
    data_inicio: date | None = Query(default=None),
    data_fim: date | None = Query(default=None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(bloquear_professor),
) -> DashboardResumoItem:
    """Resumo operacional do dashboard (Onda 8, RF-04).

    Padrao: mes corrente. Professor nao acessa (403, ADR-008).
    """
    hoje = date.today()
    inicio = data_inicio or hoje.replace(day=1)
    fim = data_fim or hoje
    if fim < inicio:
        fim = inicio + timedelta(days=30)
    return dashboard_service.calcular_resumo_dashboard(db, inicio, fim)
