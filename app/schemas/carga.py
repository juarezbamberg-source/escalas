from app.schemas.common import BaseSchema


class CargaProfessorItem(BaseSchema):
    """Carga consolidada de um professor (Onda 3).

    Consumido pelo DashboardPage via GET /professores/carga, substituindo a
    agregacao que antes era feita no cliente.
    """

    professor_id: int
    professor_nome: str
    horas: int
    alocacoes: int
    manha: int
    tarde: int
    noite: int


class CargaPrevistaItem(BaseSchema):
    """Carga prevista de um professor (Onda 6, RF-05).

    Soma da carga cheia das UCs atribuidas na vigencia, sem rateio.
    Pagamento em R$ permanece fora do sistema.
    """

    professor_id: int
    professor_nome: str
    horas: int
    atribuicoes: int
    turmas: int
