import type { Turno } from "../types/api";

export type ActionMode = "alocar" | "substituir" | "override" | "remover";

export type ActionContext = {
  action: ActionMode | null;
  alocacaoId: number | null;
  turmaId: number | null;
  titularId: number | null;
  substitutoId: number | null;
  data: string;
  turno: Turno | "";
};

const ALLOWED_ACTIONS: ActionMode[] = ["alocar", "substituir", "override", "remover"];

export function isTurno(value: string | null): value is Turno {
  return value === "manha" || value === "tarde" || value === "noite";
}

export function parseNumericParam(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Le o contexto de acao vindo da URL (deep link da escala para cadastros).
 * Antes definido dentro do CadastrosPage.tsx; agora fonte unica.
 */
export function readActionContext(searchParams: URLSearchParams): ActionContext {
  const action = searchParams.get("action");
  const turnoParam = searchParams.get("turno");
  return {
    action: ALLOWED_ACTIONS.includes(action as ActionMode) ? (action as ActionMode) : null,
    alocacaoId: parseNumericParam(searchParams.get("alocacaoId")),
    turmaId: parseNumericParam(searchParams.get("turmaId")),
    titularId: parseNumericParam(searchParams.get("titularId")),
    substitutoId: parseNumericParam(searchParams.get("substitutoId")),
    data: searchParams.get("data") ?? "",
    turno: isTurno(turnoParam) ? turnoParam : "",
  };
}
