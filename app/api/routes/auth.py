from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import criar_token_acesso, gerar_hash_senha, get_current_usuario, verificar_senha
from app.db.session import get_db
from app.models import Professor, Usuario
from app.schemas.auth import LoginRequest, Token, TrocarSenhaRequest, TrocarSenhaResponse, UsuarioRead

router = APIRouter()


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    """Emite token para usuário local ativo autenticado por username e senha."""
    if payload.username is not None and payload.senha is not None:
        usuario = db.scalar(select(Usuario).where(Usuario.username == payload.username))
        if usuario is None or not usuario.ativo or not verificar_senha(payload.senha, usuario.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario ou senha invalidos.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token = criar_token_acesso(usuario.id, usuario.funcao.value)
        return Token(access_token=token, trocar_senha=usuario.trocar_senha_no_proximo_acesso)

    # Compatibilidade temporaria com o login simplificado da Onda 4.
    professor = db.get(Professor, payload.professor_id)
    if not professor:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Professor nao encontrado.")
    return Token(access_token=criar_token_acesso(professor.id))


@router.get("/me", response_model=UsuarioRead)
def obter_usuario_atual(usuario: Usuario = Depends(get_current_usuario)) -> Usuario:
    return usuario


@router.post("/trocar-senha", response_model=TrocarSenhaResponse)
def trocar_senha(
    payload: TrocarSenhaRequest,
    usuario: Usuario = Depends(get_current_usuario),
    db: Session = Depends(get_db),
) -> TrocarSenhaResponse:
    if not verificar_senha(payload.senha_atual, usuario.senha_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Senha atual invalida.")
    if payload.senha_atual == payload.nova_senha:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A nova senha deve ser diferente.")

    usuario.senha_hash = gerar_hash_senha(payload.nova_senha)
    usuario.trocar_senha_no_proximo_acesso = False
    db.commit()
    db.refresh(usuario)
    return TrocarSenhaResponse(mensagem="Senha alterada com sucesso.", usuario=usuario)
