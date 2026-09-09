from app.schemas.common import BaseSchema


class TurmaCreate(BaseSchema):
    codigo: str
    nome: str
    turno_padrao: str
    uc_id: int


class TurmaRead(TurmaCreate):
    id: int
