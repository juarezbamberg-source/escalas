from app.schemas.common import BaseSchema


class UnidadeCurricularCreate(BaseSchema):
    codigo: str
    nome: str
    carga_horaria: int


class UnidadeCurricularUpdate(BaseSchema):
    """Atualizacao parcial de unidade curricular (Onda 4 - PATCH; Onda 7 - ativo)."""

    codigo: str | None = None
    nome: str | None = None
    carga_horaria: int | None = None
    ativo: bool | None = None


class UnidadeCurricularRead(UnidadeCurricularCreate):
    id: int
    ativo: bool = True
