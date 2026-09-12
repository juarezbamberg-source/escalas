from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import require_funcao, require_usuario_habilitado
from app.db.session import get_db
from app.models import Funcao, Usuario
from app.schemas.auth import UsuarioRead
from app.schemas.usuario import UsuarioCreate, UsuarioListResponse, UsuarioUpdate
from app.services import usuarios as usuarios_service

router = APIRouter(dependencies=[Depends(require_usuario_habilitado)])


@router.get("", response_model=UsuarioListResponse)
def listar_usuarios(
    funcao: Funcao | None = Query(default=None),
    ativo: bool | None = Query(default=None),
    busca: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_funcao(Funcao.ADMIN)),
) -> UsuarioListResponse:
    items, total = usuarios_service.listar_usuarios(db, funcao=funcao, ativo=ativo, busca=busca)
    return UsuarioListResponse(items=items, total=total)


@router.post("", response_model=UsuarioRead, status_code=status.HTTP_201_CREATED)
def criar_usuario(
    payload: UsuarioCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_funcao(Funcao.ADMIN)),
) -> Usuario:
    try:
        return usuarios_service.criar_usuario(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.patch("/{usuario_id}", response_model=UsuarioRead)
def atualizar_usuario(
    usuario_id: int,
    payload: UsuarioUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_funcao(Funcao.ADMIN)),
) -> Usuario:
    try:
        return usuarios_service.atualizar_usuario(db, usuario_id, payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{usuario_id}", response_model=UsuarioRead)
def desativar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_funcao(Funcao.ADMIN)),
) -> Usuario:
    try:
        return usuarios_service.atualizar_usuario(db, usuario_id, UsuarioUpdate(ativo=False))
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
