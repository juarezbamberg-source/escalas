from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models import Professor


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def criar_token_acesso(professor_id: int) -> str:
    """Gera um JWT de acesso (Onda 4 - autenticacao)."""
    settings = get_settings()
    expiracao = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(professor_id), "exp": expiracao}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algoritmo_jwt)


def autenticar_professor(db: Session, professor_id: int) -> Professor:
    """Recupera o professor autenticado pelo token."""
    professor = db.get(Professor, professor_id)
    if not professor:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais invalidas.")
    return professor


def get_current_professor(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Professor:
    """Dependencia que valida o JWT e retorna o professor logado."""
    settings = get_settings()
    credenciais_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nao foi possivel validar as credenciais.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algoritmo_jwt])
        professor_id = int(payload.get("sub"))
    except (jwt.PyJWTError, TypeError, ValueError):
        raise credenciais_exception
    return autenticar_professor(db, professor_id)
