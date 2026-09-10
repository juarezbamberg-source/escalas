import type { EscalaDrawerRow } from "../components/EscalaActionDrawer";
import type { StatusVisual } from "./api";

/**
 * Tipos compartilhados da workbench da escala.
 * Antes definidos dentro do EscalaPage.tsx; agora em modulo proprio para
 * permitir que WeeklyMatrix, ActionStack e os hooks importem sem ciclo.
 */
export type WorkbenchRow = EscalaDrawerRow & {
  key: string;
  uc_id: number | null;
  uc_codigo: string | null;
  uc_nome: string | null;
};

export type WeekMatrixCell = {
  date: string;
  primaryStatus: StatusVisual;
  total: number;
};

export type GroupedWorkbenchSection = {
  key: string;
  ucLabel: string;
  turmaCodigo: string;
  rows: WorkbenchRow[];
  total: number;
  signalLabels: string[];
};

export type AggregatedDay = {
  date: string;
  primaryStatus: StatusVisual;
  conflictCount: number;
  missingProfessorCount: number;
  substitutionCount: number;
  overrideCount: number;
};
