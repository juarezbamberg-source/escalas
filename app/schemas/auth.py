from pydantic import BaseModel, Field

from app.models.enums import Funcao


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    trocar_senha: bool = False


class LoginRequest(BaseModel):
    username: str
    senha: str


class UsuarioRead(BaseModel):
    id: int
    nome: str
    username: str
    funcao: Funcao
    ativo: bool
    trocar_senha_no_proximo_acesso: bool
    professor_id: int | None = None

    model_config = {"from_attributes": True}


class TrocarSenhaRequest(BaseModel):
    senha_atual: str = Field(min_length=1)
    nova_senha: str = Field(min_length=8)


class TrocarSenhaResponse(BaseModel):
    mensagem: str
    usuario: UsuarioRead
