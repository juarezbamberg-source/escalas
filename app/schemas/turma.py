from app.models.enums import Turno
from app.schemas.common import BaseSchema


class TurmaCreate(BaseSchema):
    codigo: str
    nome: str
    turno_padrao: Turno
    uc_id: int


class TurmaRead(TurmaCreate):
    id: int
