from app.models.enums import Turno
from app.schemas.common import BaseSchema


class TurmaCreate(BaseSchema):
    codigo: str
    nome: str
    turno_padrao: Turno
    uc_id: int


class TurmaUpdate(BaseSchema):
    """Atualizacao parcial de turma (Onda 4 - PATCH; Onda 7 - ativo)."""

    codigo: str | None = None
    nome: str | None = None
    turno_padrao: Turno | None = None
    uc_id: int | None = None
    ativo: bool | None = None


class TurmaRead(TurmaCreate):
    id: int
    ativo: bool = True
