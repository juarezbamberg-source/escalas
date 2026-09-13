from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.security import require_funcao, require_usuario_habilitado
from app.db.session import get_db
from app.models import Funcao, Usuario
from app.schemas.atribuicao import AtribuicaoCreate, AtribuicaoRead, AtribuicaoUpdate
from app.services import atribuicoes as atribuicoes_service
from app.services.errors import ConflitoDeNegocioError, EntidadeNaoEncontradaError

router = APIRouter(dependencies=[Depends(require_usuario_habilitado)])


@router.get("", response_model=list[AtribuicaoRead])
def listar_atribuicoes(
    professor_id: int | None = Query(default=None),
    turma_id: int | None = Query(default=None),
    vigente_em: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[AtribuicaoRead]:
    items = atribuicoes_service.listar_atribuicoes(
        db, professor_id=professor_id, turma_id=turma_id, vigente_em=vigente_em
    )
    return [AtribuicaoRead.de_entidade(item) for item in items]


@router.post("", response_model=AtribuicaoRead, status_code=status.HTTP_201_CREATED)
def criar_atribuicao(
    payload: AtribuicaoCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_funcao(Funcao.ADMIN, Funcao.COORDENACAO)),
) -> AtribuicaoRead:
    try:
        atribuicao = atribuicoes_service.criar_atribuicao(db, payload)
    except ConflitoDeNegocioError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return AtribuicaoRead.de_entidade(atribuicao)


@router.patch("/{atribuicao_id}", response_model=AtribuicaoRead)
def atualizar_atribuicao(
    atribuicao_id: int,
    payload: AtribuicaoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_funcao(Funcao.ADMIN, Funcao.COORDENACAO)),
) -> AtribuicaoRead:
    try:
        atribuicao = atribuicoes_service.atualizar_atribuicao(db, atribuicao_id, payload)
    except EntidadeNaoEncontradaError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ConflitoDeNegocioError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return AtribuicaoRead.de_entidade(atribuicao)


@router.delete("/{atribuicao_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def excluir_atribuicao(
    atribuicao_id: int,
    confirmar: bool = Query(False),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_funcao(Funcao.ADMIN, Funcao.COORDENACAO)),
) -> Response:
    try:
        atribuicoes_service.excluir_atribuicao(db, atribuicao_id, confirmar=confirmar)
    except EntidadeNaoEncontradaError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ConflitoDeNegocioError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
