from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.security import require_funcao, require_usuario_habilitado
from app.db.session import get_db
from app.models import Funcao, Usuario
from app.schemas.unidade_curricular import (
    UnidadeCurricularCreate,
    UnidadeCurricularRead,
    UnidadeCurricularUpdate,
)
from app.services import unidades_curriculares as ucs_service

router = APIRouter(dependencies=[Depends(require_usuario_habilitado)])


@router.get("", response_model=list[UnidadeCurricularRead])
def listar_ucs(
    incluir_inativos: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    """Onda 7: apenas ativas por padrao; incluir_inativos=true traz todas."""
    return ucs_service.listar_ucs(db, incluir_inativos=incluir_inativos)


@router.post("", response_model=UnidadeCurricularRead, status_code=status.HTTP_201_CREATED)
def criar_uc(
    payload: UnidadeCurricularCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_funcao(Funcao.ADMIN, Funcao.COORDENACAO)),
):
    return ucs_service.criar_uc(db, payload)


@router.patch("/{uc_id}", response_model=UnidadeCurricularRead)
def atualizar_uc(
    uc_id: int,
    payload: UnidadeCurricularUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_funcao(Funcao.ADMIN, Funcao.COORDENACAO)),
):
    """Atualizacao parcial de unidade curricular (Onda 4 - PATCH)."""
    return ucs_service.atualizar_uc(db, uc_id, payload)


@router.delete("/{uc_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_uc(
    uc_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_funcao(Funcao.ADMIN, Funcao.COORDENACAO)),
):
    ucs_service.excluir_uc(db, uc_id)
