import { useEffect } from "react";
import type { CalendarMode, FilterState, WorkbenchPreset, WorkbenchSource } from "./useEscalaFilters";
import type { Turno } from "../types/api";

const ESCALA_WORKBENCH_STORAGE_KEY = "escala-workbench-state-v1";
const ESCALA_WORKBENCH_PRESETS_KEY = "escala-workbench-presets-v1";

export type PersistedWorkbenchState = {
  turno: Turno;
  calendarMode: CalendarMode;
  compactMode: boolean;
  filters: FilterState;
  source: WorkbenchSource | null;
};

function normalizePersistedTurno(value: unknown): Turno {
  return value === "tarde" || value === "noite" ? value : "manha";
}

function normalizePersistedCalendarMode(value: unknown): CalendarMode {
  return value === "semanal" || value === "mensal" ? value : "agenda";
}

export function readPersistedWorkbenchState(): PersistedWorkbenchState | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(ESCALA_WORKBENCH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedWorkbenchState>;
    const source = parsed.source;
    return {
      turno: normalizePersistedTurno(parsed.turno),
      calendarMode: normalizePersistedCalendarMode(parsed.calendarMode),
      compactMode: Boolean(parsed.compactMode),
      filters: parsed.filters ?? {
        startDate: "",
        endDate: "",
        turma: "",
        titular: "",
        substituto: "",
        query: "",
        operational: [],
        visual: [],
      },
      source:
        source && typeof source.id === "string" && typeof source.label === "string"
          ? source
          : null,
    };
  } catch {
    return null;
  }
}

export function readStoredPresets(): WorkbenchPreset[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(ESCALA_WORKBENCH_PRESETS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as WorkbenchPreset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistStoredPresets(presets: WorkbenchPreset[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(ESCALA_WORKBENCH_PRESETS_KEY, JSON.stringify(presets));
}

/**
 * Persiste o estado da workbench no sessionStorage sempre que ele mudar.
 * Extraido do EscalaPage.tsx.
 */
export function useEscalaPersistence(state: PersistedWorkbenchState) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.sessionStorage.setItem(ESCALA_WORKBENCH_STORAGE_KEY, JSON.stringify(state));
  }, [state]);
}
