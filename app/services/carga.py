from collections import defaultdict

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import Alocacao, Professor
from app.schemas.carga import CargaProfessorItem

HORAS_POR_ALOCACAO = 3


def calcular_carga_por_professor(db: Session) -> list[CargaProfessorItem]:
    """Consolida a carga horaria de todos os professores (Onda 3).

    Substitui a agregacao que o DashboardPage fazia no cliente carregando
    todas as alocacoes dos tres turnos. Aqui a consulta e feita no banco.
    """
    professores = db.scalars(select(Professor).order_by(Professor.nome.asc())).all()
    if not professores:
        return []

    ids = [professor.id for professor in professores]
    alocacoes = db.scalars(
        select(Alocacao).where(
            or_(
                Alocacao.professor_titular_id.in_(ids),
                Alocacao.professor_substituto_id.in_(ids),
            )
        )
    ).all()

    por_professor: dict[int, list[Alocacao]] = defaultdict(list)
    for alocacao in alocacoes:
        if alocacao.professor_titular_id in ids:
            por_professor[alocacao.professor_titular_id].append(alocacao)
        if (
            alocacao.professor_substituto_id is not None
            and alocacao.professor_substituto_id in ids
        ):
            por_professor[alocacao.professor_substituto_id].append(alocacao)

    itens: list[CargaProfessorItem] = []
    for professor in professores:
        alocacoes_do_professor = por_professor.get(professor.id, [])
        total = len(alocacoes_do_professor)
        itens.append(
            CargaProfessorItem(
                professor_id=professor.id,
                professor_nome=professor.nome,
                horas=total * HORAS_POR_ALOCACAO,
                alocacoes=total,
                manha=sum(1 for a in alocacoes_do_professor if a.turno.value == "manha") * HORAS_POR_ALOCACAO,
                tarde=sum(1 for a in alocacoes_do_professor if a.turno.value == "tarde") * HORAS_POR_ALOCACAO,
                noite=sum(1 for a in alocacoes_do_professor if a.turno.value == "noite") * HORAS_POR_ALOCACAO,
            )
        )
    return itens
