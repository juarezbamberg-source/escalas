from collections.abc import Callable

import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models import Funcao, Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def criar_token_acesso(subject_id: int, funcao: str) -> str:
    """Gera JWT para o usuário informado."""
    settings = get_settings()
    expiracao = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(subject_id), "exp": expiracao, "funcao": funcao}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algoritmo_jwt)


def get_current_usuario(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    """Decodifica o token e retorna o usuário local autenticado."""
    settings = get_settings()
    credenciais_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nao foi possivel validar as credenciais.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algoritmo_jwt])
        subject: str | None = payload.get("sub")
        if subject is None:
            raise credenciais_exception
        usuario = db.get(Usuario, int(subject))
    except (jwt.PyJWTError, ValueError):
        raise credenciais_exception
    if usuario is None or not usuario.ativo:
        raise credenciais_exception
    return usuario


def require_usuario_habilitado(usuario: Usuario = Depends(get_current_usuario)) -> Usuario:
    """Exige autenticação completa, sem troca de senha pendente."""
    if usuario.trocar_senha_no_proximo_acesso:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Troca de senha obrigatoria antes de acessar esta funcionalidade.",
        )
    return usuario


def require_funcao(*funcoes: Funcao | str) -> Callable:
    """Cria dependência que permite apenas as funções informadas."""
    permitidas = {funcao.value if isinstance(funcao, Funcao) else funcao for funcao in funcoes}

    def verificar_funcao(usuario: Usuario = Depends(get_current_usuario)) -> Usuario:
        if usuario.funcao.value not in permitidas:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario sem permissao para esta acao.",
            )
        return usuario

    return verificar_funcao


def bloquear_professor(usuario: Usuario = Depends(get_current_usuario)) -> Usuario:
    """Onda 8 (ADR-008): bloqueia acesso da função professor a rotas operacionais.

    Usada em leituras de escala e cadastros: o professor consulta suas
    informações via /atribuicoes e carga própria, não pela visão completa.
    """
    if usuario.funcao == Funcao.PROFESSOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario sem permissao para esta acao.",
        )
    return usuario


def gerar_hash_senha(senha: str) -> str:
    """Gera hash bcrypt para uma senha em texto puro."""
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_senha(senha: str, senha_hash: str) -> bool:
    """Verifica uma senha contra um hash bcrypt."""
    try:
        return bcrypt.checkpw(senha.encode("utf-8"), senha_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False
