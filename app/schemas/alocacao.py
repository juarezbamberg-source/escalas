from datetime import date

from app.schemas.common import BaseSchema


class AlocacaoCreate(BaseSchema):
    turma_id: int
    data: date
    turno: str
    professor_titular_id: int
    professor_substituto_id: int | None = None
    liberar_fim_de_semana: bool = False
    override: bool = False
    justificativa_override: str | None = None


class AlocacaoRead(BaseSchema):
    id: int
    turma_id: int
    turma_codigo: str
    uc_id: int
    uc_codigo: str
    uc_nome: str
    data: date
    turno: str
    professor_titular_id: int
    professor_titular_nome: str
    professor_substituto_id: int | None = None
    professor_substituto_nome: str | None = None
    forcada: bool
    justificativa_override: str | None = None


class AlocacaoBulkDeleteRequest(BaseSchema):
    alocacao_ids: list[int]
    confirmar: bool = False


class AlocacaoBulkDeleteItem(BaseSchema):
    id: int
    turma_codigo: str
    data: date
    turno: str
    professor_titular_nome: str
    professor_substituto_nome: str | None = None


class AlocacaoBulkDeleteResponse(BaseSchema):
    total_solicitado: int
    total_removivel: int
    total_removido: int
    itens_removiveis: list[AlocacaoBulkDeleteItem]
    itens_removidos: list[AlocacaoBulkDeleteItem]
    ids_inexistentes: list[int]
    requer_confirmacao: bool


class AlocacaoBulkCreateRequest(BaseSchema):
    turma_id: int
    data_inicial: date
    data_final: date
    turnos: list[str]
    dias_da_semana: list[int]
    professor_titular_id: int
    professor_substituto_id: int | None = None
    override: bool = False
    justificativa_override: str | None = None
    confirmar: bool = False


class AlocacaoBulkCreateItem(BaseSchema):
    data: date
    turno: str
    turma_id: int
    turma_codigo: str
    uc_id: int
    uc_codigo: str
    uc_nome: str
    professor_titular_nome: str
    professor_substituto_nome: str | None = None
    status: str
    motivo: str | None = None


class AlocacaoBulkCreateResponse(BaseSchema):
    total_previsto: int
    total_validos: int
    total_bloqueados: int
    total_criados: int
    itens_validos: list[AlocacaoBulkCreateItem]
    itens_bloqueados: list[AlocacaoBulkCreateItem]
    itens_criados: list[AlocacaoRead]
    requer_confirmacao: bool


class AlocacaoTurmaPeriodoItem(BaseSchema):
    data: date
    turno: str
    turma_id: int
    turma_codigo: str
    uc_id: int
    uc_codigo: str
    uc_nome: str
    professor_titular_nome: str | None = None
    professor_substituto_nome: str | None = None
    situacao: str


class CalendarioItem(BaseSchema):
    turma_id: int
    turma_codigo: str
    uc_id: int
    uc_codigo: str
    uc_nome: str
    data: date
    turno: str
    professor_titular_nome: str | None = None
    professor_substituto_nome: str | None = None
    status_visual: str
