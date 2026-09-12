from pydantic import BaseModel, Field, model_validator

from app.models.enums import Funcao


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    trocar_senha: bool = False


class LoginRequest(BaseModel):
    username: str | None = None
    senha: str | None = None
    # Compatibilidade temporária com o login da Onda 4.
    professor_id: int | None = None

    @model_validator(mode="after")
    def validar_credenciais(self) -> "LoginRequest":
        login_local = self.username is not None and self.senha is not None
        login_onda4 = self.professor_id is not None
        if not login_local and not login_onda4:
            raise ValueError("Informe username e senha.")
        return self


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
