import type { EscalaDrawerAction } from "../components/EscalaActionDrawer";
import type { WorkbenchRow } from "../types/workbench";

/**
 * Sugere a acao mais provavel para a linha, conforme o estado operacional.
 * Extraido do EscalaPage.tsx.
 */
export function suggestPrimaryAction(row: WorkbenchRow): EscalaDrawerAction {
  if (!row.professor_titular_nome) {
    return "alocar";
  }
  if (row.status_visual === "VERMELHO" && !row.professor_substituto_nome) {
    return "substituir";
  }
  if (row.forcada) {
    return "override";
  }
  return "alocar";
}

/**
 * Monta a URL de deep link para o formulario de cadastros com o contexto da linha.
 * Extraido do EscalaPage.tsx.
 */
export function buildActionSearch(row: WorkbenchRow, action: EscalaDrawerAction | "remover") {
  const params = new URLSearchParams({
    action,
    turno: row.turno,
    data: row.data,
    turmaId: String(row.turma_id),
  });
  return `/cadastros?${params.toString()}`;
}
