from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_usuario, require_usuario_habilitado
from app.db.session import get_db
from app.models import Atribuicao, Funcao, Usuario
from app.schemas.atribuicao import AtribuicaoRead
from app.schemas.carga import CargaPrevistaItem, CargaProfessorItem
from app.services import carga as carga_service
from app.services import atribuicoes as atribuicoes_service

router = APIRouter(dependencies=[Depends(require_usuario_habilitado)])


@router.get("/professores/carga", response_model=list[CargaProfessorItem] | list[CargaPrevistaItem])
def listar_carga_professores(
    tipo: str = Query(default="realizada", pattern="^(prevista|realizada)$"),
    vigente_em: date | None = Query(default=None),
    data_inicio: date | None = Query(default=None),
    data_fim: date | None = Query(default=None),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
) -> list[CargaProfessorItem] | list[CargaPrevistaItem]:
    """Carga por professor: realizada (alocacoes, Onda 3) ou prevista (atribuicoes, Onda 6).

    Onda 8 (ADR-008): professor autenticado recebe somente a propria carga;
    coordenação e admin recebem a visão completa.

    Onda 11 (RF-01): data_inicio/data_fim filtram a carga realizada por
    periodo; sem os parametros, historico completo (retrocompativel).
    """
    if tipo == "prevista":
        itens = carga_service.calcular_carga_prevista_por_professor(db, vigente_em=vigente_em)
    else:
        itens = carga_service.calcular_carga_por_professor(
            db, data_inicio=data_inicio, data_fim=data_fim
        )
    if usuario.funcao == Funcao.PROFESSOR:
        if usuario.professor_id is None:
            return []
        itens = [item for item in itens if item.professor_id == usuario.professor_id]
    return itens


@router.get("/professores/{professor_id}/atribuicoes", response_model=list[AtribuicaoRead])
def listar_atribuicoes_do_professor(
    professor_id: int,
    vigente_em: date | None = Query(default=None),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
) -> list[AtribuicaoRead]:
    """Turmas/UCs atribuidas ao professor na vigencia (Onda 6, RF-04).

    Onda 8 (ADR-008): professor só consulta o próprio id.
    """
    if usuario.funcao == Funcao.PROFESSOR and professor_id != usuario.professor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario sem permissao para esta acao.",
        )
    items = atribuicoes_service.listar_atribuicoes(
        db, professor_id=professor_id, vigente_em=vigente_em
    )
    return [AtribuicaoRead.de_entidade(item) for item in items]
