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
