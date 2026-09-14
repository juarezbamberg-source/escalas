from collections import defaultdict
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Alocacao, Turma
from app.schemas.dashboard import AlocacoesPorTurmaItem, DashboardResumoItem


def calcular_resumo_dashboard(
    db: Session, data_inicio: date, data_fim: date
) -> DashboardResumoItem:
    """Resumo operacional para o dashboard da coordenacao (Onda 8, RF-04).

    Conta alocacoes no periodo por turno e por turma, e o total de
    substituicoes (alocacoes com professor_substituto_id preenchido).
    """
    filtros = [
        Alocacao.data >= data_inicio,
        Alocacao.data <= data_fim,
    ]

    por_turno_rows = db.execute(
        select(Alocacao.turno, func.count()).where(*filtros).group_by(Alocacao.turno)
    ).all()
    alocacoes_por_turno = {turno.value: total for turno, total in por_turno_rows}

    por_turma_rows = db.execute(
        select(
            Alocacao.turma_id,
            Turma.codigo,
            Turma.nome,
            func.count().label("total"),
        )
        .join(Turma, Turma.id == Alocacao.turma_id)
        .where(*filtros)
        .group_by(Alocacao.turma_id, Turma.codigo, Turma.nome)
        .order_by(func.count().desc(), Turma.codigo.asc())
    ).all()
    alocacoes_por_turma = [
        AlocacoesPorTurmaItem(
            turma_id=turma_id,
            turma_codigo=codigo,
            turma_nome=nome,
            alocacoes=total,
        )
        for turma_id, codigo, nome, total in por_turma_rows
    ]

    total_substituicoes = db.scalar(
        select(func.count()).where(*filtros, Alocacao.professor_substituto_id.is_not(None))
    )
    total_alocacoes = db.scalar(select(func.count()).where(*filtros))

    return DashboardResumoItem(
        data_inicio=data_inicio,
        data_fim=data_fim,
        alocacoes_por_turno=alocacoes_por_turno,
        alocacoes_por_turma=alocacoes_por_turma,
        total_substituicoes=int(total_substituicoes or 0),
        total_alocacoes=int(total_alocacoes or 0),
    )
