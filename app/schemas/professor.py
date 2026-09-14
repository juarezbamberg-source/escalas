from app.models.enums import Contratacao
from app.schemas.common import BaseSchema


class ProfessorCreate(BaseSchema):
    nome: str
    contratacao: Contratacao


class ProfessorUpdate(BaseSchema):
    """Atualizacao parcial de professor (Onda 4 - PATCH; Onda 7 - ativo)."""

    nome: str | None = None
    contratacao: Contratacao | None = None
    ativo: bool | None = None


class ProfessorRead(ProfessorCreate):
    id: int
    ativo: bool = True
