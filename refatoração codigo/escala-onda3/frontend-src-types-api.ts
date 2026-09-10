export type Turno = "manha" | "tarde" | "noite";
export type Contratacao = "PF" | "CLT" | "PJ";
export type StatusVisual = "VERDE" | "VERMELHO" | "AMARELO" | "ROXO";

export type Professor = {
  id: number;
  nome: string;
  contratacao: Contratacao;
};

export type UnidadeCurricular = {
  id: number;
  codigo: string;
  nome: string;
  carga_horaria: number;
};

export type Turma = {
  id: number;
  codigo: string;
  nome: string;
  turno_padrao: Turno;
  uc_id: number;
};

export type Alocacao = {
  id: number;
  turma_id: number;
  turma_codigo: string;
  uc_id: number;
  uc_codigo: string;
  uc_nome: string;
  data: string;
  turno: Turno;
  professor_titular_id: number;
  professor_titular_nome: string;
  professor_substituto_id: number | null;
  professor_substituto_nome: string | null;
  forcada: boolean;
  justificativa_override: string | null;
};

export type AlocacaoBulkDeleteItem = {
  id: number;
  turma_codigo: string;
  data: string;
  turno: Turno;
  professor_titular_nome: string;
  professor_substituto_nome: string | null;
};

export type AlocacaoBulkDeleteResponse = {
  total_solicitado: number;
  total_removivel: number;
  total_removido: number;
  itens_removiveis: AlocacaoBulkDeleteItem[];
  itens_removidos: AlocacaoBulkDeleteItem[];
  ids_inexistentes: number[];
  requer_confirmacao: boolean;
};

export type AlocacaoBulkCreateItem = {
  data: string;
  turno: Turno;
  turma_id: number;
  turma_codigo: string;
  uc_id: number;
  uc_codigo: string;
  uc_nome: string;
  professor_titular_nome: string;
  professor_substituto_nome: string | null;
  status: "valido" | "bloqueado";
  motivo: string | null;
};

export type AlocacaoBulkCreateResponse = {
  total_previsto: number;
  total_validos: number;
  total_bloqueados: number;
  total_criados: number;
  itens_validos: AlocacaoBulkCreateItem[];
  itens_bloqueados: AlocacaoBulkCreateItem[];
  itens_criados: Alocacao[];
  requer_confirmacao: boolean;
};

export type AlocacaoTurmaPeriodoItem = {
  data: string;
  turno: Turno;
  turma_id: number;
  turma_codigo: string;
  uc_id: number;
  uc_codigo: string;
  uc_nome: string;
  professor_titular_nome: string | null;
  professor_substituto_nome: string | null;
  situacao: string;
};

export type CalendarioItem = {
  turma_id: number;
  turma_codigo: string;
  uc_id: number;
  uc_codigo: string;
  uc_nome: string;
  data: string;
  turno: Turno;
  professor_titular_nome: string | null;
  professor_substituto_nome: string | null;
  status_visual: StatusVisual;
};

/**
 * Carga consolidada de um professor. Consumido pelo DashboardPage
 * via GET /professores/carga (Onda 3) em vez de agregar no cliente.
 */
export type CargaProfessorItem = {
  professor_id: number;
  professor_nome: string;
  horas: number;
  alocacoes: number;
  manha: number;
  tarde: number;
  noite: number;
};

export type ApiErrorPayload = {
  detail?: string;
};
