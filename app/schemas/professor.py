from app.models.enums import Contratacao
from app.schemas.common import BaseSchema


class ProfessorCreate(BaseSchema):
    nome: str
    contratacao: Contratacao


class ProfessorUpdate(BaseSchema):
    """Atualizacao parcial de professor (Onda 4 - PATCH)."""

    nome: str | None = None
    contratacao: Contratacao | None = None


class ProfessorRead(ProfessorCreate):
    id: int
