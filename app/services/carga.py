from collections import defaultdict

from datetime import date

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.models import Alocacao, Atribuicao, Professor
from app.schemas.carga import CargaPrevistaItem, CargaProfessorItem

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


def calcular_carga_prevista_por_professor(
    db: Session, vigente_em: date | None = None
) -> list[CargaPrevistaItem]:
    """Carga prevista por professor (Onda 6, RF-05).

    Soma da carga cheia das UCs das atribuicoes na vigencia, sem rateio.
    Por padrao considera a data de hoje; informe vigente_em para simular
    outra data de recorte.
    """
    recorte = vigente_em or date.today()
    professores = db.scalars(select(Professor).order_by(Professor.nome.asc())).all()
    if not professores:
        return []

    atribuicoes = db.scalars(
        select(Atribuicao)
        .options(joinedload(Atribuicao.unidade_curricular))
        .where(
            Atribuicao.professor_id.in_([professor.id for professor in professores]),
            Atribuicao.data_inicio <= recorte,
            Atribuicao.data_fim >= recorte,
        )
    ).all()

    por_professor: dict[int, list[Atribuicao]] = defaultdict(list)
    for atribuicao in atribuicoes:
        por_professor[atribuicao.professor_id].append(atribuicao)

    itens: list[CargaPrevistaItem] = []
    for professor in professores:
        atribuicoes_do_professor = por_professor.get(professor.id, [])
        horas = sum(
            atribuicao.unidade_curricular.carga_horaria
            for atribuicao in atribuicoes_do_professor
        )
        itens.append(
            CargaPrevistaItem(
                professor_id=professor.id,
                professor_nome=professor.nome,
                horas=horas,
                atribuicoes=len(atribuicoes_do_professor),
                turmas=len({atribuicao.turma_id for atribuicao in atribuicoes_do_professor}),
            )
        )
    return itens
