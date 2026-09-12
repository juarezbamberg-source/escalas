from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import require_funcao, require_usuario_habilitado
from app.db.session import get_db
from app.models import Funcao, Usuario
from app.schemas.professor import ProfessorCreate, ProfessorRead, ProfessorUpdate
from app.services import professores as professores_service

router = APIRouter(dependencies=[Depends(require_usuario_habilitado)])


@router.get("", response_model=list[ProfessorRead])
def listar_professores(db: Session = Depends(get_db)):
    return professores_service.listar_professores(db)


@router.post("", response_model=ProfessorRead, status_code=status.HTTP_201_CREATED)
def criar_professor(
    payload: ProfessorCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_funcao(Funcao.ADMIN, Funcao.COORDENACAO)),
):
    return professores_service.criar_professor(db, payload)


@router.patch("/{professor_id}", response_model=ProfessorRead)
def atualizar_professor(
    professor_id: int,
    payload: ProfessorUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_funcao(Funcao.ADMIN, Funcao.COORDENACAO)),
):
    """Atualizacao parcial de professor (Onda 4 - PATCH)."""
    return professores_service.atualizar_professor(db, professor_id, payload)


@router.delete("/{professor_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_professor(
    professor_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_funcao(Funcao.ADMIN, Funcao.COORDENACAO)),
):
    professores_service.excluir_professor(db, professor_id)
