import type {
  Alocacao,
  AlocacaoBulkCreateResponse,
  AlocacaoBulkDeleteResponse,
  AlocacaoTurmaPeriodoItem,
  ApiErrorPayload,
  CargaProfessorItem,
  CalendarioItem,
  Professor,
  Turma,
  UnidadeCurricular,
} from "../types/api";
import { getStoredToken } from "./auth";
import type { UsuarioAtual } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function buildApiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorPayload | null;
    throw new ApiError(body?.detail ?? "Nao foi possivel concluir a operacao.", response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function bearer(token: string): RequestInit {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export const api = {
  login: (username: string, senha: string) =>
    request<{ access_token: string; token_type: string; trocar_senha: boolean }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, senha }),
    }),
  me: (token: string) => request<UsuarioAtual>("/auth/me", bearer(token)),
  trocarSenha: (token: string, senhaAtual: string, novaSenha: string) =>
    request<{ usuario: UsuarioAtual }>("/auth/trocar-senha", {
      ...bearer(token),
      method: "POST",
      body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha }),
    }),
  health: () => request<{ status: string }>("/health"),
  listProfessores: () => request<Professor[]>("/professores"),
  createProfessor: (payload: { nome: string; contratacao: string }) =>
    request<Professor>("/professores", { method: "POST", body: JSON.stringify(payload) }),
  listUcs: () => request<UnidadeCurricular[]>("/ucs"),
  createUc: (payload: { codigo: string; nome: string; carga_horaria: number }) =>
    request<UnidadeCurricular>("/ucs", { method: "POST", body: JSON.stringify(payload) }),
  listTurmas: () => request<Turma[]>("/turmas"),
  createTurma: (payload: { codigo: string; nome: string; turno_padrao: string; uc_id: number }) =>
    request<Turma>("/turmas", { method: "POST", body: JSON.stringify(payload) }),
  listAlocacoes: (turno: string) => request<Alocacao[]>(`/alocacoes?turno=${turno}`),
  listCalendario: (turno: string, datas: string[]) =>
    request<CalendarioItem[]>(
      `/alocacoes/calendario?${new URLSearchParams([
        ["turno", turno],
        ...datas.map((data) => ["datas", data]),
      ]).toString()}`,
    ),
  listAlocacoesTurmaPeriodo: (payload: { turma_id: number; data_inicial: string; data_final: string; turno?: string }) =>
    request<AlocacaoTurmaPeriodoItem[]>(
      `/alocacoes/turma-periodo?${new URLSearchParams([
        ["turma_id", String(payload.turma_id)],
        ["data_inicial", payload.data_inicial],
        ["data_final", payload.data_final],
        ...(payload.turno ? [["turno", payload.turno]] : []),
      ]).toString()}`,
    ),
  createAlocacao: (payload: {
    turma_id: number;
    data: string;
    turno: string;
    professor_titular_id: number;
    professor_substituto_id: number | null;
    liberar_fim_de_semana: boolean;
    override: boolean;
    justificativa_override: string | null;
  }) => request<Alocacao>("/alocacoes", { method: "POST", body: JSON.stringify(payload) }),
  createAlocacoesRecorrentes: (payload: {
    turma_id: number;
    data_inicial: string;
    data_final: string;
    turnos: string[];
    dias_da_semana: number[];
    professor_titular_id: number;
    professor_substituto_id: number | null;
    liberar_fim_de_semana?: boolean;
    override: boolean;
    justificativa_override: string | null;
    confirmar: boolean;
  }) => request<AlocacaoBulkCreateResponse>("/alocacoes/recorrente", { method: "POST", body: JSON.stringify(payload) }),
  listCargaProfessores: () => request<CargaProfessorItem[]>("/professores/carga"),
  deleteAlocacoesBulk: (payload: { alocacao_ids: number[]; confirmar: boolean }) =>
    request<AlocacaoBulkDeleteResponse>("/alocacoes/remocao-lote", { method: "POST", body: JSON.stringify(payload) }),
  deleteAlocacao: (alocacaoId: number, confirmar = true) =>
    request<void>(`/alocacoes/${alocacaoId}?confirmar=${confirmar ? "true" : "false"}`, { method: "DELETE" }),
};
