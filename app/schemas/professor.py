from app.models.enums import Contratacao
from app.schemas.common import BaseSchema


class ProfessorCreate(BaseSchema):
    nome: str
    contratacao: Contratacao


class ProfessorRead(ProfessorCreate):
    id: int
