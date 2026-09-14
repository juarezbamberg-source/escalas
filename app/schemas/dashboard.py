from datetime import date, timedelta

from pydantic import BaseModel, Field


class DashboardResumoItem(BaseModel):
    """Resumo operacional do dashboard (Onda 8, RF-04)."""

    data_inicio: date
    data_fim: date
    alocacoes_por_turno: dict[str, int]
    alocacoes_por_turma: list["AlocacoesPorTurmaItem"]
    total_substituicoes: int
    total_alocacoes: int


class AlocacoesPorTurmaItem(BaseModel):
    turma_id: int
    turma_codigo: str
    turma_nome: str
    alocacoes: int
