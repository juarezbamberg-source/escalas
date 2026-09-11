from datetime import date

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.alocacao import (
    AlocacaoBulkCreateRequest,
    AlocacaoBulkCreateResponse,
    AlocacaoBulkDeleteRequest,
    AlocacaoBulkDeleteResponse,
    AlocacaoCreate,
    AlocacaoRead,
    AlocacaoTurmaPeriodoItem,
    AlocacaoUpdate,
    CalendarioItem,
)
from app.services import alocacoes as alocacoes_service

router = APIRouter()


@router.get("", response_model=list[AlocacaoRead])
def list_alocacoes(turno: str = Query(...), db: Session = Depends(get_db)) -> list[AlocacaoRead]:
    return alocacoes_service.listar_alocacoes_por_turno(db, turno)


@router.get("/calendario", response_model=list[CalendarioItem])
def list_calendario(
    turno: str = Query(...),
    datas: list[date] = Query(default=[]),
    db: Session = Depends(get_db),
) -> list[CalendarioItem]:
    return alocacoes_service.listar_calendario_por_turno(db, turno, datas)


@router.get("/turma-periodo", response_model=list[AlocacaoTurmaPeriodoItem])
def list_alocacoes_por_turma_e_periodo(
    turma_id: int = Query(...),
    data_inicial: date = Query(...),
    data_final: date = Query(...),
    turno: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[AlocacaoTurmaPeriodoItem]:
    return alocacoes_service.listar_alocacoes_por_turma_e_periodo(
        db,
        turma_id=turma_id,
        data_inicial=data_inicial,
        data_final=data_final,
        turno=turno,
    )


@router.post("", response_model=AlocacaoRead, status_code=status.HTTP_201_CREATED)
def create_alocacao(payload: AlocacaoCreate, db: Session = Depends(get_db)) -> AlocacaoRead:
    return alocacoes_service.criar_alocacao(db, payload)


@router.post("/recorrente", response_model=AlocacaoBulkCreateResponse)
def create_alocacoes_recorrentes(
    payload: AlocacaoBulkCreateRequest,
    db: Session = Depends(get_db),
) -> AlocacaoBulkCreateResponse:
    return alocacoes_service.criar_alocacoes_recorrentes(db, payload)


@router.post("/remocao-lote", response_model=AlocacaoBulkDeleteResponse)
def delete_alocacoes_bulk(
    payload: AlocacaoBulkDeleteRequest,
    db: Session = Depends(get_db),
) -> AlocacaoBulkDeleteResponse:
    return alocacoes_service.excluir_alocacoes_em_lote(db, payload)


@router.patch("/{alocacao_id}", response_model=AlocacaoRead)
def atualizar_alocacao(alocacao_id: int, payload: AlocacaoUpdate, db: Session = Depends(get_db)):
    """Atualizacao parcial de alocacao (Onda 4 - PATCH)."""
    return alocacoes_service.atualizar_alocacao(db, alocacao_id, payload)


@router.delete("/{alocacao_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_alocacao(
    alocacao_id: int,
    confirmar: bool = Query(False),
    db: Session = Depends(get_db),
) -> Response:
    alocacoes_service.excluir_alocacao(db, alocacao_id, confirmar=confirmar)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
