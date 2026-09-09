from app.schemas.common import BaseSchema


class UnidadeCurricularCreate(BaseSchema):
    codigo: str
    nome: str
    carga_horaria: int


class UnidadeCurricularRead(UnidadeCurricularCreate):
    id: int
