from pydantic import BaseModel, Field

from app.models.enums import Funcao
from app.schemas.auth import UsuarioRead


class UsuarioCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=255)
    username: str = Field(min_length=3, max_length=80)
    funcao: Funcao
    senha_temporaria: str = Field(min_length=8)
    professor_id: int | None = None


class UsuarioUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=255)
    funcao: Funcao | None = None
    ativo: bool | None = None
    professor_id: int | None = None
    nova_senha_temporaria: str | None = Field(default=None, min_length=8)


class UsuarioListResponse(BaseModel):
    items: list[UsuarioRead]
    total: int
