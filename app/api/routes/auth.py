from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import criar_token_acesso
from app.db.session import get_db
from app.models import Professor
from app.schemas.auth import LoginRequest, Token

router = APIRouter()


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    """Emite um token de acesso para um professor existente (Onda 4).

    Fluxo simplificado para o contexto academico: o operador informa o id
    do professor. Em producao, substitua por autenticacao por senha/SSO.
    """
    professor = db.get(Professor, payload.professor_id)
    if not professor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Professor nao encontrado.",
        )
    token = criar_token_acesso(professor.id)
    return Token(access_token=token)
