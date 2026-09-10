import { useCallback, useState } from "react";
import type { StatusVisual, Turno } from "../types/api";

export type OperationalFilter =
  | "conflict"
  | "missingProfessor"
  | "missingSubstitute"
  | "override"
  | "standard";
export type CalendarMode = "agenda" | "semanal" | "mensal";

export type FilterState = {
  startDate: string;
  endDate: string;
  turma: string;
  titular: string;
  substituto: string;
  query: string;
  operational: OperationalFilter[];
  visual: StatusVisual[];
};

export type WorkbenchSource = {
  kind: "shortcut" | "preset";
  id: string;
  label: string;
};

export type WorkbenchPreset = {
  id: string;
  name: string;
  turno: Turno;
  calendarMode: CalendarMode;
  compactMode: boolean;
  filters: FilterState;
};

export const defaultFilters: FilterState = {
  startDate: "",
  endDate: "",
  turma: "",
  titular: "",
  substituto: "",
  query: "",
  operational: [],
  visual: [],
};

export function toggleSelection<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function cloneFilters(filters: Partial<FilterState> | undefined): FilterState {
  return {
    ...defaultFilters,
    ...(filters ?? {}),
    operational: Array.isArray(filters?.operational) ? filters.operational : [],
    visual: Array.isArray(filters?.visual) ? filters.visual : [],
  };
}

/**
 * Hook de filtros, presets e atalhos de triagem da escala.
 * Extraido do EscalaPage.tsx.
 */
export function useEscalaFilters(initial?: { filters?: FilterState; calendarMode?: CalendarMode; compactMode?: boolean }) {
  const [filters, setFilters] = useState<FilterState>(() => initial?.filters ?? defaultFilters);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>(() => initial?.calendarMode ?? "agenda");
  const [compactMode, setCompactMode] = useState<boolean>(() => initial?.compactMode ?? false);
  const [workbenchSource, setWorkbenchSource] = useState<WorkbenchSource | null>(null);
  const [presets, setPresets] = useState<WorkbenchPreset[]>([]);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setWorkbenchSource(null);
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setWorkbenchSource(null);
    setFilters(defaultFilters);
    setCalendarMode("agenda");
    setCompactMode(false);
  }, []);

  const applyPreset = useCallback((preset: WorkbenchPreset) => {
    setFilters(cloneFilters(preset.filters));
    setCalendarMode(preset.calendarMode);
    setCompactMode(preset.compactMode);
    setWorkbenchSource({ kind: "preset", id: preset.id, label: preset.name });
  }, []);

  const deletePreset = useCallback((presetId: string) => {
    setPresets((current) => current.filter((item) => item.id !== presetId));
    setWorkbenchSource((source) => (source?.kind === "preset" && source.id === presetId ? null : source));
  }, []);

  return {
    filters,
    calendarMode,
    compactMode,
    workbenchSource,
    presets,
    setFilters,
    setCalendarMode,
    setCompactMode,
    setWorkbenchSource,
    setPresets,
    updateFilter,
    clearAllFilters,
    applyPreset,
    deletePreset,
  };
}
