import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAppStatus } from "../app/AppStatusContext";
import { EscalaActionDrawer, type EscalaDrawerAction, type EscalaDrawerRow } from "../components/EscalaActionDrawer";
import { SectionCard } from "../components/SectionCard";
import { StatusLegend } from "../components/StatusLegend";
import { TurnoTabs } from "../components/TurnoTabs";
import { api, ApiError } from "../lib/api";
import { buildPrimaryActionReason, buildSignalExplanation } from "../lib/escalaSignals";
import { buildDateRangeFromBounds, buildFallbackDates, formatDate } from "../lib/format";
import type {
  Alocacao,
  AlocacaoBulkDeleteResponse,
  AlocacaoTurmaPeriodoItem,
  CalendarioItem,
  Professor,
  StatusVisual,
  Turma,
  Turno,
} from "../types/api";

type OperationalFilter = "conflict" | "missingProfessor" | "missingSubstitute" | "override" | "standard";
type CalendarMode = "agenda" | "semanal" | "mensal";
type TriageShortcutId = "conflictsToday" | "coverageGaps" | "overridesWeek";

type WorkbenchRow = EscalaDrawerRow & {
  key: string;
  uc_id: number | null;
  uc_codigo: string | null;
  uc_nome: string | null;
};

type FilterState = {
  startDate: string;
  endDate: string;
  turma: string;
  titular: string;
  substituto: string;
  query: string;
  operational: OperationalFilter[];
  visual: StatusVisual[];
};

type ActiveFilterChip = {
  id: string;
  label: string;
  clearable: boolean;
  clear: () => void;
};

type AggregatedDay = {
  date: string;
  rows: WorkbenchRow[];
  total: number;
  conflictCount: number;
  missingProfessorCount: number;
  substitutionCount: number;
  overrideCount: number;
  statusCounts: Record<StatusVisual, number>;
  primaryStatus: StatusVisual;
};

type DrawerState = {
  action: EscalaDrawerAction;
  row: WorkbenchRow;
};

type WeekMatrixCell = {
  date: string;
  primaryStatus: StatusVisual;
  total: number;
};

type GroupedWorkbenchSection = {
  key: string;
  ucLabel: string;
  turmaCodigo: string;
  rows: WorkbenchRow[];
  total: number;
  signalLabels: string[];
};

type WorkbenchSource = {
  kind: "shortcut" | "preset";
  id: string;
  label: string;
};

type PersistedWorkbenchState = {
  calendarMode: CalendarMode;
  compactMode: boolean;
  filters: FilterState;
  turno: Turno;
  source: WorkbenchSource | null;
};

type WorkbenchPreset = {
  id: string;
  name: string;
  turno: Turno;
  calendarMode: CalendarMode;
  compactMode: boolean;
  filters: FilterState;
};

type BulkRemovalState = {
  loading: boolean;
  submitting: boolean;
  preview: AlocacaoBulkDeleteResponse | null;
  confirmed: boolean;
};

type TurmaPeriodoQueryState = {
  turmaId: string;
  dataInicial: string;
  dataFinal: string;
  turno: "" | Turno;
  exibirSubstituicoes: boolean;
};

type TurmaPeriodoQueryResultState = {
  loading: boolean;
  rows: AlocacaoTurmaPeriodoItem[];
  submitted: boolean;
};

const ESCALA_WORKBENCH_STORAGE_KEY = "escala-workbench-state-v1";
const ESCALA_WORKBENCH_PRESETS_KEY = "escala-workbench-presets-v1";

const defaultTurmaPeriodoQuery: TurmaPeriodoQueryState = {
  turmaId: "",
  dataInicial: "",
  dataFinal: "",
  turno: "",
  exibirSubstituicoes: true,
};

const operationalFilterLabels: Record<OperationalFilter, string> = {
  conflict: "Com conflito",
  missingProfessor: "Sem professor",
  missingSubstitute: "Sem substituto",
  override: "Overrides",
  standard: "Padrao",
};

const defaultFilters: FilterState = {
  startDate: "",
  endDate: "",
  turma: "",
  titular: "",
  substituto: "",
  query: "",
  operational: [],
  visual: [],
};

const triageShortcuts: Array<{
  id: TriageShortcutId;
  label: string;
  description: string;
  buildState: () => Pick<PersistedWorkbenchState, "calendarMode" | "compactMode" | "filters">;
}> = [
  {
    id: "conflictsToday",
    label: "Conflitos de hoje",
    description: "Abre o recorte do dia ja focado em conflito vermelho.",
    buildState: () => ({
      calendarMode: "agenda",
      compactMode: false,
      filters: {
        ...defaultFilters,
        ...getTodayRange(),
        operational: ["conflict"],
        visual: ["VERMELHO"],
      },
    }),
  },
  {
    id: "coverageGaps",
    label: "Lacunas de cobertura",
    description: "Mostra faltas de titular ou substituto para triagem rapida.",
    buildState: () => ({
      calendarMode: "agenda",
      compactMode: false,
      filters: {
        ...defaultFilters,
        operational: ["missingProfessor", "missingSubstitute"],
      },
    }),
  },
  {
    id: "overridesWeek",
    label: "Overrides da semana",
    description: "Agrupa overrides da semana na leitura semanal compacta.",
    buildState: () => ({
      calendarMode: "semanal",
      compactMode: true,
      filters: {
        ...defaultFilters,
        ...getCurrentWeekRange(),
        operational: ["override"],
        visual: ["ROXO", "VERMELHO"],
      },
    }),
  },
];

function buildRowKey(item: Pick<WorkbenchRow, "turma_codigo" | "data" | "turno" | "turma_id" | "uc_id">) {
  const turmaKey = item.turma_id > 0 ? `turma-${item.turma_id}` : `turma-${item.turma_codigo}-uc-${item.uc_id ?? "sem-uc"}`;
  return `${turmaKey}-${item.data}-${item.turno}`;
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatCalendarDay(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(parseIsoDate(value));
}

function isWeekend(value: string) {
  const day = parseIsoDate(value).getDay();
  return day === 0 || day === 6;
}

function formatMonthLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(parseIsoDate(value));
}

function getWeekStart(value: string) {
  const date = parseIsoDate(value);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  return formatIsoDate(monday);
}

function formatWeekLabel(weekStart: string) {
  const start = parseIsoDate(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `Semana de ${formatDate(weekStart)} a ${formatDate(formatIsoDate(end))}`;
}

function getTodayRange() {
  const today = formatIsoDate(new Date());
  return { startDate: today, endDate: today };
}

function getCurrentWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { startDate: formatIsoDate(start), endDate: formatIsoDate(end) };
}

function inferVisualStatus(row: Partial<WorkbenchRow>): StatusVisual {
  if (!row.professor_titular_nome) {
    return "AMARELO";
  }
  if (row.professor_substituto_nome || row.forcada) {
    return "ROXO";
  }
  return "VERDE";
}

function normalizePersistedTurno(value: unknown): Turno {
  return value === "tarde" || value === "noite" ? value : "manha";
}

function normalizePersistedCalendarMode(value: unknown): CalendarMode {
  return value === "semanal" || value === "mensal" ? value : "agenda";
}

function cloneFilters(filters: Partial<FilterState> | undefined): FilterState {
  return {
    ...defaultFilters,
    ...(filters ?? {}),
    operational: Array.isArray(filters?.operational) ? filters.operational : [],
    visual: Array.isArray(filters?.visual) ? filters.visual : [],
  };
}

function readPersistedWorkbenchState(): PersistedWorkbenchState | null {
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
      filters: cloneFilters(parsed.filters),
      source:
        source && typeof source.id === "string" && typeof source.label === "string" && (source.kind === "shortcut" || source.kind === "preset")
          ? source
          : null,
    };
  } catch {
    return null;
  }
}

function readStoredPresets(): WorkbenchPreset[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ESCALA_WORKBENCH_PRESETS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Array<Partial<WorkbenchPreset>>;
    return parsed
      .filter((preset): preset is Partial<WorkbenchPreset> & { id: string; name: string } => Boolean(preset?.id && preset?.name))
      .map((preset) => ({
        id: preset.id,
        name: preset.name,
        turno: normalizePersistedTurno(preset.turno),
        calendarMode: normalizePersistedCalendarMode(preset.calendarMode),
        compactMode: Boolean(preset.compactMode),
        filters: cloneFilters(preset.filters),
      }));
  } catch {
    return [];
  }
}

function persistStoredPresets(presets: WorkbenchPreset[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ESCALA_WORKBENCH_PRESETS_KEY, JSON.stringify(presets));
}

function buildWorkbenchRows(alocacoes: Alocacao[], calendario: CalendarioItem[], turno: Turno) {
  const alocacaoByKey = new Map(alocacoes.map((item) => [buildRowKey(item as WorkbenchRow), item]));
  const calendarioByKey = new Map(calendario.map((item) => [buildRowKey(item as WorkbenchRow), item]));
  const weekendCalendarKeys = Array.from(calendarioByKey.entries())
    .filter(([, item]) => isWeekend(item.data))
    .map(([key]) => key);
  const keys = Array.from(new Set([...alocacaoByKey.keys(), ...weekendCalendarKeys]));

  return keys
    .map((key) => {
      const alocacao = alocacaoByKey.get(key);
      const itemCalendario = calendarioByKey.get(key);
      const row: WorkbenchRow = {
        key,
        id: alocacao?.id ?? key,
        turma_id: alocacao?.turma_id ?? itemCalendario?.turma_id ?? 0,
        turma_codigo: alocacao?.turma_codigo ?? itemCalendario?.turma_codigo ?? "-",
        uc_id: alocacao?.uc_id ?? itemCalendario?.uc_id ?? null,
        uc_codigo: alocacao?.uc_codigo ?? itemCalendario?.uc_codigo ?? null,
        uc_nome: alocacao?.uc_nome ?? itemCalendario?.uc_nome ?? null,
        data: alocacao?.data ?? itemCalendario?.data ?? "",
        turno: alocacao?.turno ?? itemCalendario?.turno ?? turno,
        professor_titular_id: alocacao?.professor_titular_id ?? null,
        professor_titular_nome: alocacao?.professor_titular_nome ?? itemCalendario?.professor_titular_nome ?? null,
        professor_substituto_id: alocacao?.professor_substituto_id ?? null,
        professor_substituto_nome: alocacao?.professor_substituto_nome ?? itemCalendario?.professor_substituto_nome ?? null,
        forcada: alocacao?.forcada ?? false,
        justificativa_override: alocacao?.justificativa_override ?? null,
        status_visual: itemCalendario?.status_visual ?? inferVisualStatus(alocacao ?? itemCalendario ?? {}),
      };

      return row;
    })
    .sort((left, right) => left.data.localeCompare(right.data) || left.turma_codigo.localeCompare(right.turma_codigo));
}

function buildGroupedWorkbenchRows(rows: WorkbenchRow[]): GroupedWorkbenchSection[] {
  return Array.from(
    rows.reduce((groups, row) => {
      const groupKey = `${row.uc_codigo ?? "sem-uc"}::${row.turma_codigo}`;
      const current = groups.get(groupKey) ?? [];
      current.push(row);
      groups.set(groupKey, current);
      return groups;
    }, new Map<string, WorkbenchRow[]>()),
  )
    .map(([key, groupedRows]) => {
      const signals = new Set<string>();
      groupedRows.forEach((row) => {
        buildSignalExplanation(row).badges.forEach((badge) => signals.add(badge.label));
      });

      const firstRow = groupedRows[0];
      return {
        key,
        ucLabel: firstRow.uc_codigo && firstRow.uc_nome ? `${firstRow.uc_codigo} • ${firstRow.uc_nome}` : firstRow.uc_codigo ?? "UC nao identificada",
        turmaCodigo: firstRow.turma_codigo,
        rows: groupedRows.sort((left, right) => left.data.localeCompare(right.data)),
        total: groupedRows.length,
        signalLabels: Array.from(signals),
      };
    })
    .sort((left, right) => left.ucLabel.localeCompare(right.ucLabel) || left.turmaCodigo.localeCompare(right.turmaCodigo));
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function toggleSelection<T>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function matchesOperationalStatus(row: WorkbenchRow, filter: OperationalFilter) {
  switch (filter) {
    case "conflict":
      return row.status_visual === "VERMELHO";
    case "missingProfessor":
      return !row.professor_titular_nome;
    case "missingSubstitute":
      return !row.professor_substituto_nome;
    case "override":
      return row.forcada;
    case "standard":
      return row.status_visual === "VERDE" && !row.forcada && !row.professor_substituto_nome && Boolean(row.professor_titular_nome);
    default:
      return true;
  }
}

function pickPrimaryStatus(day: Omit<AggregatedDay, "primaryStatus">): StatusVisual {
  if (day.conflictCount > 0) {
    return "VERMELHO";
  }
  if (day.missingProfessorCount > 0) {
    return "AMARELO";
  }
  if (day.substitutionCount > 0 || day.overrideCount > 0) {
    return "ROXO";
  }
  return "VERDE";
}

function aggregateCalendarDays(rows: WorkbenchRow[]) {
  return Array.from(
    rows.reduce((groups, row) => {
      const current = groups.get(row.data) ?? [];
      current.push(row);
      groups.set(row.data, current);
      return groups;
    }, new Map<string, WorkbenchRow[]>()),
  )
    .map(([date, groupedRows]) => {
      const statusCounts: Record<StatusVisual, number> = { VERDE: 0, VERMELHO: 0, AMARELO: 0, ROXO: 0 };
      groupedRows.forEach((row) => {
        statusCounts[row.status_visual] += 1;
      });

      const baseDay = {
        date,
        rows: groupedRows.sort((left, right) => left.turma_codigo.localeCompare(right.turma_codigo)),
        total: groupedRows.length,
        conflictCount: groupedRows.filter((row) => row.status_visual === "VERMELHO").length,
        missingProfessorCount: groupedRows.filter((row) => !row.professor_titular_nome).length,
        substitutionCount: groupedRows.filter((row) => Boolean(row.professor_substituto_nome)).length,
        overrideCount: groupedRows.filter((row) => row.forcada).length,
        statusCounts,
      };

      return {
        ...baseDay,
        primaryStatus: pickPrimaryStatus(baseDay),
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));
}

function buildActionSearch(
  row: WorkbenchRow,
  action: "alocar" | "substituir" | "override" | "remover",
) {
  const params = new URLSearchParams({
    action,
    turno: row.turno,
    data: row.data,
    turmaId: String(row.turma_id),
  });

  if (typeof row.id === "number") {
    params.set("alocacaoId", String(row.id));
  }
  if (row.professor_titular_id) {
    params.set("titularId", String(row.professor_titular_id));
  }
  if (row.professor_substituto_id) {
    params.set("substitutoId", String(row.professor_substituto_id));
  }

  return `/cadastros?${params.toString()}`;
}

function suggestPrimaryAction(row: WorkbenchRow): EscalaDrawerAction {
  if (!row.professor_titular_nome) {
    return "alocar";
  }
  if (row.status_visual === "ROXO" || row.forcada) {
    return "override";
  }
  return "substituir";
}

function buildPresetId() {
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function PeriodSummary({ rows }: { rows: WorkbenchRow[] }) {
  const summary = {
    total: rows.length,
    conflicts: rows.filter((row) => row.status_visual === "VERMELHO").length,
    gaps: rows.filter((row) => !row.professor_titular_nome).length,
    substitutions: rows.filter((row) => Boolean(row.professor_substituto_nome)).length,
    overrides: rows.filter((row) => row.forcada).length,
  };

  return (
    <div className="period-summary">
      <article className="period-summary__card">
        <p>Periodo selecionado</p>
        <strong>{summary.total} ocorrencia(s)</strong>
      </article>
      <article className="period-summary__card">
        <p>Conflitos</p>
        <strong>{summary.conflicts}</strong>
      </article>
      <article className="period-summary__card">
        <p>Lacunas</p>
        <strong>{summary.gaps}</strong>
      </article>
      <article className="period-summary__card">
        <p>Substituicoes</p>
        <strong>{summary.substitutions}</strong>
      </article>
      <article className="period-summary__card">
        <p>Overrides</p>
        <strong>{summary.overrides}</strong>
      </article>
    </div>
  );
}

function WeeklyMatrix({
  compactMode,
  onSelectDay,
  rows,
  selectedDay,
  weekLabel,
}: {
  compactMode: boolean;
  onSelectDay: (date: string) => void;
  rows: WorkbenchRow[];
  selectedDay: string | null;
  weekLabel: string;
}) {
  const dates = Array.from(new Set(rows.map((row) => row.data))).sort((left, right) => left.localeCompare(right));
  const turmaCodes = Array.from(new Set(rows.map((row) => row.turma_codigo))).sort((left, right) => left.localeCompare(right));
  const cellMap = new Map<string, WeekMatrixCell>();

  for (const turmaCodigo of turmaCodes) {
    for (const date of dates) {
      const cellRows = rows.filter((row) => row.turma_codigo === turmaCodigo && row.data === date);
      if (cellRows.length === 0) {
        continue;
      }

      cellMap.set(`${turmaCodigo}-${date}`, {
        date,
        primaryStatus: aggregateCalendarDays(cellRows)[0].primaryStatus,
        total: cellRows.length,
      });
    }
  }

  return (
    <section className="calendar-group-block">
      <header className="calendar-group-block__header">
        <strong>{weekLabel}</strong>
        <span>Matriz por turma</span>
      </header>
      <div className={`weekly-matrix${compactMode ? " weekly-matrix--compact" : ""}`}>
        <table className={compactMode ? "table--compact" : undefined}>
          <thead>
            <tr>
              <th>Turma</th>
              {dates.map((date) => (
                <th key={date} className={isWeekend(date) ? "calendar-weekend" : undefined}>
                  {formatCalendarDay(date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {turmaCodes.map((turmaCodigo) => (
              <tr key={turmaCodigo}>
                <td>
                  <strong>{turmaCodigo}</strong>
                </td>
                {dates.map((date) => {
                  const cell = cellMap.get(`${turmaCodigo}-${date}`);
                  return (
                    <td key={`${turmaCodigo}-${date}`}>
                      {cell ? (
                        <button
                          type="button"
                          className={`weekly-cell weekly-cell--${cell.primaryStatus.toLowerCase()}${
                            isWeekend(cell.date) ? " weekly-cell--weekend" : ""
                          }${
                            selectedDay === cell.date ? " weekly-cell--active" : ""
                          }`}
                          onClick={() => onSelectDay(cell.date)}
                        >
                          <strong>{cell.primaryStatus.slice(0, 1)}</strong>
                          <span>{cell.total}</span>
                        </button>
                      ) : (
                        <span className="weekly-cell weekly-cell--empty">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ActionStack({
  onOpen,
  row,
}: {
  onOpen: (row: WorkbenchRow, action: EscalaDrawerAction) => void;
  row: WorkbenchRow;
}) {
  const primaryAction = suggestPrimaryAction(row);
  const secondaryActions = (["alocar", "substituir", "override"] as EscalaDrawerAction[]).filter((action) => action !== primaryAction);
  const actionReason = buildPrimaryActionReason(row);

  return (
    <div className="action-stack">
      <button type="button" className="action-main" onClick={() => onOpen(row, primaryAction)}>
        {primaryAction === "alocar" ? "Alocar" : primaryAction === "substituir" ? "Substituir" : "Override"}
      </button>
      <p className="action-stack__hint">Prioridade por: {actionReason}</p>
      <details className="action-overflow">
        <summary>Mais acoes</summary>
        <div className="action-overflow__menu">
          {secondaryActions.map((action) => (
            <button key={action} type="button" className="action-secondary" onClick={() => onOpen(row, action)}>
              {action === "alocar" ? "Alocar" : action === "substituir" ? "Substituir" : "Override"}
            </button>
          ))}
          <Link to={buildActionSearch(row, "remover")} className="action-secondary action-secondary--danger">
            Remover
          </Link>
        </div>
      </details>
    </div>
  );
}

export function EscalaPage() {
  const persistedState = readPersistedWorkbenchState();
  const [turno, setTurno] = useState<Turno>(() => persistedState?.turno ?? "manha");
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
  const [calendario, setCalendario] = useState<CalendarioItem[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>(() => persistedState?.calendarMode ?? "agenda");
  const [compactMode, setCompactMode] = useState<boolean>(() => persistedState?.compactMode ?? false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [drawerState, setDrawerState] = useState<DrawerState | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>(() => persistedState?.filters ?? defaultFilters);
  const [workbenchSource, setWorkbenchSource] = useState<WorkbenchSource | null>(() => persistedState?.source ?? null);
  const [presets, setPresets] = useState<WorkbenchPreset[]>(() => readStoredPresets());
  const [presetName, setPresetName] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<string[]>([]);
  const [bulkRemoval, setBulkRemoval] = useState<BulkRemovalState>({
    loading: false,
    submitting: false,
    preview: null,
    confirmed: false,
  });
  const [turmaPeriodoQuery, setTurmaPeriodoQuery] = useState<TurmaPeriodoQueryState>(defaultTurmaPeriodoQuery);
  const [turmaPeriodoResult, setTurmaPeriodoResult] = useState<TurmaPeriodoQueryResultState>({
    loading: false,
    rows: [],
    submitted: false,
  });
  const { startLoading, stopLoading, showError, showSuccess, clearMessages } = useAppStatus();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      ESCALA_WORKBENCH_STORAGE_KEY,
      JSON.stringify({
        turno,
        calendarMode,
        compactMode,
        filters,
        source: workbenchSource,
      } satisfies PersistedWorkbenchState),
    );
  }, [calendarMode, compactMode, filters, turno, workbenchSource]);

  useEffect(() => {
    persistStoredPresets(presets);
  }, [presets]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      clearMessages();
      startLoading();
      try {
        const grade = await api.listAlocacoes(turno);
        const orderedDates = Array.from(new Set(grade.map((item) => item.data))).sort((left, right) => left.localeCompare(right));
        const dates =
          orderedDates.length > 0
            ? buildDateRangeFromBounds(orderedDates[0], orderedDates[orderedDates.length - 1])
            : buildFallbackDates();
        const calendarioResponse = await api.listCalendario(turno, dates);
        const refs = await Promise.allSettled([api.listProfessores(), api.listTurmas()]);

        if (!active) {
          return;
        }

        setAlocacoes(grade);
        setCalendario(calendarioResponse);
        setProfessores(refs[0].status === "fulfilled" ? refs[0].value : []);
        setTurmas(refs[1].status === "fulfilled" ? refs[1].value : []);

        if (refs[0].status === "rejected" || refs[1].status === "rejected") {
          showError("A escala foi carregada, mas as referencias das acoes contextuais ainda nao ficaram disponiveis.");
        }
      } catch (error) {
        if (active) {
          const message =
            error instanceof ApiError
              ? error.message
              : "Nao foi possivel carregar a escala agora. Tente novamente em instantes.";
          showError(message);
          setAlocacoes([]);
          setCalendario([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
        stopLoading();
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [clearMessages, reloadKey, showError, startLoading, stopLoading, turno]);

  const workbenchRows = buildWorkbenchRows(alocacoes, calendario, turno);
  const turmaOptions = Array.from(new Set(workbenchRows.map((row) => row.turma_codigo))).sort((left, right) => left.localeCompare(right));
  const titularOptions = Array.from(
    new Set(workbenchRows.map((row) => row.professor_titular_nome).filter((value): value is string => Boolean(value))),
  ).sort((left, right) => left.localeCompare(right));
  const substitutoOptions = Array.from(
    new Set(workbenchRows.map((row) => row.professor_substituto_nome).filter((value): value is string => Boolean(value))),
  ).sort((left, right) => left.localeCompare(right));

  const filteredRows = workbenchRows.filter((row) => {
    const signalExplanation = buildSignalExplanation(row);
    const query = normalizeText(filters.query);
    const searchBase = [
      row.turma_codigo,
      row.professor_titular_nome ?? "",
      row.professor_substituto_nome ?? "",
      formatDate(row.data),
      row.status_visual,
      ...signalExplanation.labels,
      ...signalExplanation.reasons,
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!filters.startDate || row.data >= filters.startDate) &&
      (!filters.endDate || row.data <= filters.endDate) &&
      (!filters.turma || row.turma_codigo === filters.turma) &&
      (!filters.titular || row.professor_titular_nome === filters.titular) &&
      (!filters.substituto || row.professor_substituto_nome === filters.substituto) &&
      (filters.operational.length === 0 || filters.operational.some((filter) => matchesOperationalStatus(row, filter))) &&
      (filters.visual.length === 0 || filters.visual.includes(row.status_visual)) &&
      (!query || searchBase.includes(query))
    );
  });

  const aggregatedDays = aggregateCalendarDays(filteredRows);
  const groupedRows = buildGroupedWorkbenchRows(filteredRows);
  const weekGroups = Array.from(
    aggregatedDays.reduce((groups, day) => {
      const weekStart = getWeekStart(day.date);
      const current = groups.get(weekStart) ?? [];
      current.push(day);
      groups.set(weekStart, current);
      return groups;
    }, new Map<string, AggregatedDay[]>()),
  );
  const monthGroups = Array.from(
    aggregatedDays.reduce((groups, day) => {
      const monthKey = day.date.slice(0, 7);
      const current = groups.get(monthKey) ?? [];
      current.push(day);
      groups.set(monthKey, current);
      return groups;
    }, new Map<string, AggregatedDay[]>()),
  );
  const selectedDayDetail = aggregatedDays.find((day) => day.date === selectedDay) ?? aggregatedDays[0] ?? null;
  const selectableRows = filteredRows.filter((row): row is WorkbenchRow & { id: number } => typeof row.id === "number");
  const selectableRowIds = selectableRows.map((row) => row.id);
  const allVisibleSelected = selectableRowIds.length > 0 && selectableRowIds.every((id) => selectedRowIds.includes(id));

  useEffect(() => {
    if (aggregatedDays.length === 0) {
      setSelectedDay(null);
      return;
    }

    if (!selectedDay || !aggregatedDays.some((day) => day.date === selectedDay)) {
      setSelectedDay(aggregatedDays[0].date);
    }
  }, [aggregatedDays, selectedDay]);

  useEffect(() => {
    setSelectedRowIds((current) => current.filter((id) => selectableRowIds.includes(id)));
  }, [reloadKey, turno, selectableRowIds.join(",")]);

  useEffect(() => {
    setBulkRemoval((current) => ({ ...current, preview: null, confirmed: false }));
  }, [selectedRowIds.join(",")]);

  useEffect(() => {
    setExpandedGroupKeys((current) => {
      const next = current.filter((key) => groupedRows.some((group) => group.key === key));
      return next.length === current.length && next.every((key, index) => key === current[index]) ? current : next;
    });
  }, [groupedRows.map((group) => group.key).join(",")]);

  useEffect(() => {
    setTurmaPeriodoQuery((current) => {
      if (current.turmaId || turmas.length === 0) {
        return current;
      }

      return {
        ...current,
        turmaId: String(turmas[0].id),
      };
    });
  }, [turmas]);

  function clearWorkbenchSource() {
    setWorkbenchSource(null);
  }

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    clearWorkbenchSource();
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function handleTurnoChange(nextTurno: Turno) {
    clearWorkbenchSource();
    setTurno(nextTurno);
  }

  function handleCalendarModeChange(mode: CalendarMode) {
    clearWorkbenchSource();
    setCalendarMode(mode);
  }

  function handleCompactModeToggle(nextState?: boolean) {
    clearWorkbenchSource();
    setCompactMode((current) => (typeof nextState === "boolean" ? nextState : !current));
  }

  function applyShortcut(shortcutId: TriageShortcutId) {
    const shortcut = triageShortcuts.find((item) => item.id === shortcutId);
    if (!shortcut) {
      return;
    }

    const nextState = shortcut.buildState();
    setFilters(cloneFilters(nextState.filters));
    setCalendarMode(nextState.calendarMode);
    setCompactMode(nextState.compactMode);
    setWorkbenchSource({ kind: "shortcut", id: shortcut.id, label: shortcut.label });
  }

  function clearAllFilters() {
    clearWorkbenchSource();
    setFilters(defaultFilters);
    setCalendarMode("agenda");
    setCompactMode(false);
  }

  function openDrawer(row: WorkbenchRow, action: EscalaDrawerAction) {
    setDrawerState({ row, action });
  }

  async function handleSaved() {
    setReloadKey((current) => current + 1);
  }

  function handleSavePreset() {
    const name = presetName.trim();
    if (!name) {
      showError("Informe um nome para salvar o preset do operador.");
      return;
    }

    const preset: WorkbenchPreset = {
      id: buildPresetId(),
      name,
      turno,
      calendarMode,
      compactMode,
      filters: cloneFilters(filters),
    };

    setPresets((current) => [preset, ...current.filter((item) => item.name.toLowerCase() !== name.toLowerCase())]);
    setPresetName("");
    setWorkbenchSource({ kind: "preset", id: preset.id, label: preset.name });
    showSuccess(`Preset "${preset.name}" salvo neste navegador.`);
  }

  function applyPreset(preset: WorkbenchPreset) {
    setTurno(preset.turno);
    setCalendarMode(preset.calendarMode);
    setCompactMode(preset.compactMode);
    setFilters(cloneFilters(preset.filters));
    setWorkbenchSource({ kind: "preset", id: preset.id, label: preset.name });
  }

  function deletePreset(presetId: string) {
    const preset = presets.find((item) => item.id === presetId);
    setPresets((current) => current.filter((item) => item.id !== presetId));
    if (workbenchSource?.kind === "preset" && workbenchSource.id === presetId) {
      setWorkbenchSource(null);
    }
    if (preset) {
      showSuccess(`Preset "${preset.name}" removido do navegador.`);
    }
  }

  function toggleRowSelection(rowId: number) {
    setSelectedRowIds((current) => toggleSelection(current, rowId));
  }

  function toggleGroupExpansion(groupKey: string) {
    setExpandedGroupKeys((current) => toggleSelection(current, groupKey));
  }

  function toggleSelectVisibleRows() {
    setSelectedRowIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !selectableRowIds.includes(id));
      }
      return Array.from(new Set([...current, ...selectableRowIds]));
    });
  }

  async function prepareBulkRemoval() {
    if (selectedRowIds.length === 0) {
      showError("Selecione pelo menos uma alocacao antes de preparar a remocao em lote.");
      return;
    }

    setBulkRemoval((current) => ({ ...current, loading: true, preview: null, confirmed: false }));
    try {
      const preview = await api.deleteAlocacoesBulk({ alocacao_ids: selectedRowIds, confirmar: false });
      setBulkRemoval((current) => ({ ...current, loading: false, preview }));
    } catch (error) {
      setBulkRemoval((current) => ({ ...current, loading: false }));
      showError(error instanceof ApiError ? error.message : "Nao foi possivel preparar a remocao em lote.");
    }
  }

  async function confirmBulkRemoval() {
    if (!bulkRemoval.preview) {
      return;
    }

    setBulkRemoval((current) => ({ ...current, submitting: true }));
    try {
      const result = await api.deleteAlocacoesBulk({ alocacao_ids: selectedRowIds, confirmar: true });
      showSuccess(`${result.total_removido} alocacao(oes) removida(s) em lote com seguranca.`);
      setSelectedRowIds([]);
      setBulkRemoval({ loading: false, submitting: false, preview: result, confirmed: false });
      await handleSaved();
    } catch (error) {
      setBulkRemoval((current) => ({ ...current, submitting: false }));
      showError(error instanceof ApiError ? error.message : "Nao foi possivel concluir a remocao em lote.");
    }
  }

  function updateTurmaPeriodoQuery<K extends keyof TurmaPeriodoQueryState>(key: K, value: TurmaPeriodoQueryState[K]) {
    setTurmaPeriodoQuery((current) => ({ ...current, [key]: value }));
  }

  async function handleTurmaPeriodoSubmit() {
    if (!turmaPeriodoQuery.turmaId) {
      showError("Selecione uma turma para consultar o professor da turma.");
      return;
    }
    if (!turmaPeriodoQuery.dataInicial || !turmaPeriodoQuery.dataFinal) {
      showError("Informe a data inicial e a data final da consulta por turma.");
      return;
    }

    setTurmaPeriodoResult({ loading: true, rows: [], submitted: true });
    try {
      const rows = await api.listAlocacoesTurmaPeriodo({
        turma_id: Number(turmaPeriodoQuery.turmaId),
        data_inicial: turmaPeriodoQuery.dataInicial,
        data_final: turmaPeriodoQuery.dataFinal,
        turno: turmaPeriodoQuery.turno || undefined,
      });
      setTurmaPeriodoResult({ loading: false, rows, submitted: true });
    } catch (error) {
      setTurmaPeriodoResult({ loading: false, rows: [], submitted: true });
      showError(error instanceof ApiError ? error.message : "Nao foi possivel consultar o professor da turma.");
    }
  }

  const activeFilterChips: ActiveFilterChip[] = [];

  if (workbenchSource) {
    activeFilterChips.push({
      id: `${workbenchSource.kind}-${workbenchSource.id}`,
      label: `${workbenchSource.kind === "shortcut" ? "Atalho" : "Preset"}: ${workbenchSource.label}`,
      clearable: true,
      clear: () => setWorkbenchSource(null),
    });
  }

  activeFilterChips.push({
    id: `turno-${turno}`,
    label: `Turno: ${turno}`,
    clearable: false,
    clear: () => undefined,
  });

  if (calendarMode !== "agenda") {
    activeFilterChips.push({
      id: `calendar-${calendarMode}`,
      label: `Calendario: ${calendarMode}`,
      clearable: true,
      clear: () => handleCalendarModeChange("agenda"),
    });
  }
  if (compactMode) {
    activeFilterChips.push({
      id: "compact-on",
      label: "Leitura: compacta",
      clearable: true,
      clear: () => handleCompactModeToggle(false),
    });
  }
  if (filters.startDate) {
    activeFilterChips.push({
      id: `start-${filters.startDate}`,
      label: `De: ${formatDate(filters.startDate)}`,
      clearable: true,
      clear: () => updateFilter("startDate", ""),
    });
  }
  if (filters.endDate) {
    activeFilterChips.push({
      id: `end-${filters.endDate}`,
      label: `Ate: ${formatDate(filters.endDate)}`,
      clearable: true,
      clear: () => updateFilter("endDate", ""),
    });
  }
  if (filters.turma) {
    activeFilterChips.push({
      id: `turma-${filters.turma}`,
      label: `Turma: ${filters.turma}`,
      clearable: true,
      clear: () => updateFilter("turma", ""),
    });
  }
  if (filters.titular) {
    activeFilterChips.push({
      id: `titular-${filters.titular}`,
      label: `Titular: ${filters.titular}`,
      clearable: true,
      clear: () => updateFilter("titular", ""),
    });
  }
  if (filters.substituto) {
    activeFilterChips.push({
      id: `substituto-${filters.substituto}`,
      label: `Substituto: ${filters.substituto}`,
      clearable: true,
      clear: () => updateFilter("substituto", ""),
    });
  }
  if (filters.query) {
    activeFilterChips.push({
      id: `query-${filters.query}`,
      label: `Busca: ${filters.query}`,
      clearable: true,
      clear: () => updateFilter("query", ""),
    });
  }
  filters.operational.forEach((filter) => {
    activeFilterChips.push({
      id: `operational-${filter}`,
      label: `Status: ${operationalFilterLabels[filter]}`,
      clearable: true,
      clear: () => updateFilter("operational", filters.operational.filter((item) => item !== filter)),
    });
  });
  filters.visual.forEach((status) => {
    activeFilterChips.push({
      id: `visual-${status}`,
      label: `Semaforo: ${status}`,
      clearable: true,
      clear: () => updateFilter("visual", filters.visual.filter((item) => item !== status)),
    });
  });

  const hasActiveFilters = activeFilterChips.some((chip) => chip.clearable);

  function renderDayButton(day: AggregatedDay, compact = false) {
    return (
      <button
        key={day.date}
        type="button"
        className={`calendar-day-card calendar-day-card--${day.primaryStatus.toLowerCase()}${
          isWeekend(day.date) ? " calendar-day-card--weekend" : ""
        }${
          selectedDayDetail?.date === day.date ? " calendar-day-card--active" : ""
        }${compact ? " calendar-day-card--compact" : ""}`}
        onClick={() => setSelectedDay(day.date)}
        aria-pressed={selectedDayDetail?.date === day.date}
        aria-label={`Abrir detalhe de ${formatDate(day.date)}`}
      >
        <div className="calendar-day-card__header">
          <strong>{formatCalendarDay(day.date)}</strong>
          <span>
            {day.total} {day.total === 1 ? "escala" : "escalas"}
          </span>
        </div>
        <div className="calendar-mini-counters">
          <span className="mini-counter mini-counter--vermelho">R:{day.statusCounts.VERMELHO}</span>
          <span className="mini-counter mini-counter--amarelo">A:{day.statusCounts.AMARELO}</span>
          <span className="mini-counter mini-counter--roxo">O:{day.statusCounts.ROXO}</span>
          <span className="mini-counter mini-counter--verde">V:{day.statusCounts.VERDE}</span>
        </div>
        {!compact ? (
          <div className="calendar-day-card__stats">
            <span>{day.conflictCount} conflito(s)</span>
            <span>{day.missingProfessorCount} lacuna(s)</span>
            <span>{day.substitutionCount} substituicao(oes)</span>
            <span>{day.overrideCount} override(s)</span>
          </div>
        ) : null}
        <p>{day.rows.map((row) => row.turma_codigo).join(" • ")}</p>
      </button>
    );
  }

  return (
    <>
      <div className="page-stack">
        <SectionCard eyebrow="Consulta operacional" title="Escala por turno">
          <p>Selecione um turno e combine filtros para encontrar conflitos, lacunas, substituicoes e overrides com mais rapidez.</p>
          <TurnoTabs value={turno} onChange={handleTurnoChange} />
        </SectionCard>

        <SectionCard eyebrow="Recorte inteligente" title="Filtros avancados">
          <div className="filter-shell">
            <div className="filters-layout">
              <fieldset className="filter-group">
                <legend>Contexto</legend>
                <label>
                  Data inicial
                  <input type="date" value={filters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} />
                </label>
                <label>
                  Data final
                  <input type="date" value={filters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} />
                </label>
                <label>
                  Turma
                  <select value={filters.turma} onChange={(event) => updateFilter("turma", event.target.value)}>
                    <option value="">Todas as turmas</option>
                    {turmaOptions.map((turmaOption) => (
                      <option key={turmaOption} value={turmaOption}>
                        {turmaOption}
                      </option>
                    ))}
                  </select>
                </label>
              </fieldset>

              <fieldset className="filter-group">
                <legend>Status operacional</legend>
                <div className="chip-row">
                  {(
                    [
                      ["conflict", "Com conflito"],
                      ["missingProfessor", "Sem professor"],
                      ["missingSubstitute", "Sem substituto"],
                      ["override", "Overrides"],
                      ["standard", "Padrao"],
                    ] as Array<[OperationalFilter, string]>
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={`filter-chip${filters.operational.includes(value) ? " filter-chip--active" : ""}`}
                      aria-pressed={filters.operational.includes(value)}
                      onClick={() => updateFilter("operational", toggleSelection(filters.operational, value))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="filter-group">
                <legend>Busca direta</legend>
                <label>
                  Professor titular
                  <select value={filters.titular} onChange={(event) => updateFilter("titular", event.target.value)}>
                    <option value="">Todos os titulares</option>
                    {titularOptions.map((titularOption) => (
                      <option key={titularOption} value={titularOption}>
                        {titularOption}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Professor substituto
                  <select value={filters.substituto} onChange={(event) => updateFilter("substituto", event.target.value)}>
                    <option value="">Todos os substitutos</option>
                    {substitutoOptions.map((substitutoOption) => (
                      <option key={substitutoOption} value={substitutoOption}>
                        {substitutoOption}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="filter-group__wide">
                  Busca livre
                  <input
                    type="search"
                    placeholder="Turma, professor, data ou sinal operacional"
                    value={filters.query}
                    onChange={(event) => updateFilter("query", event.target.value)}
                  />
                </label>
              </fieldset>
            </div>

            <div className="filters-toolbar">
              <div className="filters-toolbar__block">
                <strong>Atalhos de triagem</strong>
                <div className="shortcut-grid">
                  {triageShortcuts.map((shortcut) => (
                    <button
                      key={shortcut.id}
                      type="button"
                      className={`shortcut-card${workbenchSource?.kind === "shortcut" && workbenchSource.id === shortcut.id ? " shortcut-card--active" : ""}`}
                      onClick={() => applyShortcut(shortcut.id)}
                    >
                      <span>{shortcut.label}</span>
                      <small>{shortcut.description}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="filters-toolbar__block">
                <strong>Presets do operador</strong>
                <div className="preset-save">
                  <label className="filter-group__wide">
                    Nome do preset
                    <input
                      type="text"
                      placeholder="Ex.: conflitos de segunda"
                      value={presetName}
                      onChange={(event) => setPresetName(event.target.value)}
                    />
                  </label>
                  <button type="button" className="action-main" onClick={handleSavePreset}>
                    Salvar preset atual
                  </button>
                </div>
                {presets.length > 0 ? (
                  <div className="preset-list">
                    {presets.map((preset) => (
                      <article key={preset.id} className={`preset-card${workbenchSource?.kind === "preset" && workbenchSource.id === preset.id ? " preset-card--active" : ""}`}>
                        <div>
                          <strong>{preset.name}</strong>
                          <p>
                            {preset.turno} • {preset.calendarMode} • {preset.compactMode ? "compacto" : "padrao"}
                          </p>
                        </div>
                        <div className="preset-card__actions">
                          <button type="button" className="action-secondary" onClick={() => applyPreset(preset)}>
                            Aplicar
                          </button>
                          <button type="button" className="action-secondary action-secondary--danger" onClick={() => deletePreset(preset.id)}>
                            Excluir
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="state-message">Salve presets do navegador para reaplicar recortes operacionais com um clique.</p>
                )}
              </div>

              <div className="active-filters">
                <div className="active-filters__header">
                  <strong>Combinacao visivel</strong>
                  {hasActiveFilters ? (
                    <button type="button" className="ghost-button" onClick={clearAllFilters}>
                      Limpar filtros
                    </button>
                  ) : null}
                </div>
                <div className="active-filters__chips">
                  {activeFilterChips.map((chip) => (
                    <span key={chip.id} className={`active-filter-chip${chip.clearable ? " active-filter-chip--clearable" : ""}`}>
                      {chip.label}
                      {chip.clearable ? (
                        <button type="button" aria-label={`Remover filtro ${chip.label}`} onClick={chip.clear}>
                          x
                        </button>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Consulta dirigida" title="Consulta por turma e periodo">
          <div className="guided-query">
            <div className="guided-query__intro">
              <p>Informe a turma e o intervalo de datas para visualizar os professores alocados em cada dia e turno.</p>
            </div>

            <div className="guided-query__layout">
              <div className="guided-query__form">
                <label>
                  Turma
                  <select value={turmaPeriodoQuery.turmaId} onChange={(event) => updateTurmaPeriodoQuery("turmaId", event.target.value)}>
                    <option value="">Selecione uma turma</option>
                    {turmas.map((turmaOption) => (
                      <option key={turmaOption.id} value={turmaOption.id}>
                        {turmaOption.codigo}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Data inicial
                  <input
                    type="date"
                    value={turmaPeriodoQuery.dataInicial}
                    onChange={(event) => updateTurmaPeriodoQuery("dataInicial", event.target.value)}
                  />
                </label>
                <label>
                  Data final
                  <input
                    type="date"
                    value={turmaPeriodoQuery.dataFinal}
                    onChange={(event) => updateTurmaPeriodoQuery("dataFinal", event.target.value)}
                  />
                </label>
                <label>
                  Turno
                  <select value={turmaPeriodoQuery.turno} onChange={(event) => updateTurmaPeriodoQuery("turno", event.target.value as "" | Turno)}>
                    <option value="">Usar turno padrao da turma</option>
                    <option value="manha">Manha</option>
                    <option value="tarde">Tarde</option>
                    <option value="noite">Noite</option>
                  </select>
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={turmaPeriodoQuery.exibirSubstituicoes}
                    onChange={(event) => updateTurmaPeriodoQuery("exibirSubstituicoes", event.target.checked)}
                  />
                  Exibir substituicoes
                </label>
                <button type="button" className="action-main" onClick={() => void handleTurmaPeriodoSubmit()} disabled={turmaPeriodoResult.loading}>
                  {turmaPeriodoResult.loading ? "Consultando..." : "Consultar professor da turma"}
                </button>
              </div>

              <div className="guided-query__result">
                {turmaPeriodoResult.loading ? <p className="state-message">Consultando alocacoes da turma no periodo...</p> : null}
                {!turmaPeriodoResult.loading && !turmaPeriodoResult.submitted ? (
                  <p className="state-message">A consulta dirigida vai listar data, turno, turma, titular, substituto e situacao do periodo.</p>
                ) : null}
                {!turmaPeriodoResult.loading && turmaPeriodoResult.submitted && turmaPeriodoResult.rows.length === 0 ? (
                  <p className="state-message">Nenhum item retornado para a turma e periodo informados.</p>
                ) : null}
                {!turmaPeriodoResult.loading && turmaPeriodoResult.rows.length > 0 ? (
                  <div className="table-wrap">
                    <table aria-label="Resultado da consulta por turma e periodo">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Turno</th>
                          <th>Turma</th>
                          <th>Professor titular</th>
                          {turmaPeriodoQuery.exibirSubstituicoes ? <th>Substituto</th> : null}
                          <th>Situacao</th>
                        </tr>
                      </thead>
                      <tbody>
                        {turmaPeriodoResult.rows.map((row) => (
                          <tr key={`turma-periodo-${row.turma_codigo}-${row.turno}-${row.data}`}>
                            <td>{formatDate(row.data)}</td>
                            <td>{row.turno}</td>
                            <td>
                              <strong>{row.turma_codigo}</strong>
                            </td>
                            <td>{row.professor_titular_nome ?? "Sem professor definido"}</td>
                            {turmaPeriodoQuery.exibirSubstituicoes ? <td>{row.professor_substituto_nome ?? "Sem substituto"}</td> : null}
                            <td>{row.situacao}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="view-controls">
          <button
            type="button"
            className={`filter-chip${compactMode ? " filter-chip--active" : ""}`}
            aria-pressed={compactMode}
            onClick={() => handleCompactModeToggle()}
          >
            Modo compacto
          </button>
          <p>O recorte atual fica salvo na sessao; os presets ficam salvos neste navegador.</p>
        </div>

        <div className="page-stack">
          <SectionCard eyebrow="Grade da escala" title="Alocacoes do turno">
            {selectedRowIds.length > 0 || bulkRemoval.preview ? (
              <div className="bulk-panel">
                <div className="bulk-panel__header">
                  <div>
                    <p className="bulk-panel__eyebrow">Acoes em lote</p>
                    <strong>{selectedRowIds.length} item(ns) selecionado(s)</strong>
                  </div>
                  <div className="bulk-panel__actions">
                    <button type="button" className="ghost-button" onClick={() => setSelectedRowIds([])}>
                      Limpar selecao
                    </button>
                    <button type="button" className="action-main" onClick={prepareBulkRemoval} disabled={bulkRemoval.loading}>
                      {bulkRemoval.loading ? "Preparando..." : "Preparar remocao em lote"}
                    </button>
                  </div>
                </div>

                {bulkRemoval.preview ? (
                  <div className="warning-panel">
                    <strong>Resumo antes de confirmar</strong>
                    <p>
                      {bulkRemoval.preview.total_removivel} item(ns) podem ser removidos agora.
                      {bulkRemoval.preview.ids_inexistentes.length > 0
                        ? ` IDs nao encontrados: ${bulkRemoval.preview.ids_inexistentes.join(", ")}.`
                        : " Nenhum bloqueio estrutural encontrado."}
                    </p>
                    <div className="status-badges">
                      <span className="status-badge">Solicitado: {bulkRemoval.preview.total_solicitado}</span>
                      <span className="status-badge">Removivel: {bulkRemoval.preview.total_removivel}</span>
                      <span className="status-badge">Inexistente: {bulkRemoval.preview.ids_inexistentes.length}</span>
                    </div>
                    <div className="bulk-preview-list">
                      {bulkRemoval.preview.itens_removiveis.map((item) => (
                        <span key={`bulk-${item.id}`} className="status-badge">
                          #{item.id} • {item.turma_codigo} • {formatDate(item.data)}
                        </span>
                      ))}
                    </div>
                    <label className="bulk-panel__confirm">
                      <input
                        type="checkbox"
                        checked={bulkRemoval.confirmed}
                        onChange={(event) => setBulkRemoval((current) => ({ ...current, confirmed: event.target.checked }))}
                      />
                      Confirmo a remocao em lote dos itens listados acima.
                    </label>
                    <button
                      type="button"
                      className="action-main"
                      onClick={() => void confirmBulkRemoval()}
                      disabled={!bulkRemoval.confirmed || bulkRemoval.submitting}
                    >
                      {bulkRemoval.submitting ? "Removendo..." : `Confirmar remocao de ${bulkRemoval.preview.total_removivel} item(ns)`}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {loading ? <p className="state-message">Carregando a grade da escala...</p> : null}
            {!loading && workbenchRows.length === 0 ? (
              <p className="state-message">Nenhuma alocacao encontrada para o turno selecionado.</p>
            ) : null}
            {!loading && workbenchRows.length > 0 && filteredRows.length === 0 ? (
              <p className="state-message">
                Nenhum item atende ao recorte ativo. Ajuste a combinacao de filtros para voltar a ver a grade deste turno.
              </p>
            ) : null}
            {!loading && filteredRows.length > 0 ? (
              <>
                <div className="grouped-grade-toolbar">
                  <label className="table-checkbox">
                    <input
                      type="checkbox"
                      aria-label="Selecionar todas as alocacoes visiveis"
                      checked={allVisibleSelected}
                      onChange={toggleSelectVisibleRows}
                      disabled={selectableRowIds.length === 0}
                    />
                    <span>Selecionar lote visivel</span>
                  </label>
                  <p>{groupedRows.length} grupo(s) por UC e turma no recorte atual.</p>
                </div>

                <div className="grouped-grade-list">
                  {groupedRows.map((group) => {
                    const expanded = expandedGroupKeys.includes(group.key);

                    return (
                      <section key={group.key} className={`grouped-grade-card${expanded ? " grouped-grade-card--expanded" : ""}`}>
                        <button
                          type="button"
                          className="grouped-grade-card__summary"
                          aria-expanded={expanded}
                          onClick={() => toggleGroupExpansion(group.key)}
                        >
                          <div>
                            <span className="person-role__label">UC</span>
                            <strong>{group.ucLabel}</strong>
                            <p>
                              Turma {group.turmaCodigo} • {group.total} ocorrencia(s)
                            </p>
                          </div>
                          <div className="grouped-grade-card__meta">
                            <div className="status-badges">
                              {group.signalLabels.slice(0, 3).map((label) => (
                                <span key={`${group.key}-${label}`} className="status-badge">
                                  {label}
                                </span>
                              ))}
                            </div>
                            <span className="grouped-grade-card__toggle">{expanded ? "Recolher" : "Expandir"}</span>
                          </div>
                        </button>

                        {expanded ? (
                          <div className={`table-wrap${compactMode ? " table-wrap--compact" : ""}`}>
                            <table className={compactMode ? "table--compact" : undefined} aria-label={`Grupo ${group.turmaCodigo}`}>
                              <thead>
                                <tr>
                                  <th>Lote</th>
                                  <th>Data</th>
                                  <th>Turma</th>
                                  <th>Professores</th>
                                  <th>Sinais</th>
                                  <th>Acoes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.rows.map((row) => {
                                  const signalExplanation = buildSignalExplanation(row);
                                  const isSelectable = typeof row.id === "number";
                                  const selectableId = isSelectable ? (row.id as number) : null;
                                  const isSelected = selectableId !== null && selectedRowIds.includes(selectableId);

                                  return (
                                    <tr
                                      key={row.key}
                                      className={[
                                        isSelected ? "table-row--selected" : "",
                                        isWeekend(row.data) ? "table-row--weekend" : "",
                                      ]
                                        .filter(Boolean)
                                        .join(" ") || undefined}
                                    >
                                      <td>
                                        {isSelectable ? (
                                          <label className="table-checkbox">
                                            <input
                                              type="checkbox"
                                              aria-label={`Selecionar alocacao da turma ${row.turma_codigo} em ${formatDate(row.data)}`}
                                              checked={isSelected}
                                              onChange={() => toggleRowSelection(selectableId!)}
                                            />
                                            <span>Selecionar</span>
                                          </label>
                                        ) : (
                                          <span className="table-inline-note">Sem lote</span>
                                        )}
                                      </td>
                                      <td>{formatDate(row.data)}</td>
                                      <td>
                                        <strong>{row.turma_codigo}</strong>
                                      </td>
                                      <td>
                                        <div className="stack-cell">
                                          <div className="person-role">
                                            <span className="person-role__label">Titular</span>
                                            <strong>{row.professor_titular_nome ?? "Sem titular definido"}</strong>
                                          </div>
                                          <div className="person-role">
                                            <span className="person-role__label">Substituto</span>
                                            <span>{row.professor_substituto_nome ?? "Sem substituto"}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td>
                                        <div className="signal-stack">
                                          <div className="status-badges">
                                            {signalExplanation.badges.map((signal) => (
                                              <span key={`${row.key}-${signal.label}`} className={`status-badge status-badge--${signal.tone}`}>
                                                {signal.label}
                                              </span>
                                            ))}
                                          </div>
                                          <details className="signal-explainer">
                                            <summary>{signalExplanation.summary}</summary>
                                            <ul className="signal-explainer__list">
                                              {signalExplanation.reasons.map((reason) => (
                                                <li key={`${row.key}-${reason}`}>{reason}</li>
                                              ))}
                                            </ul>
                                          </details>
                                        </div>
                                      </td>
                                      <td>
                                        <ActionStack onOpen={openDrawer} row={row} />
                                        {isWeekend(row.data) ? (
                                          <p className="table-inline-note">
                                            Fim de semana: abra a acao e marque a liberacao para atividade extracurricular.
                                          </p>
                                        ) : null}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : null}
                      </section>
                    );
                  })}
                </div>
              </>
            ) : null}
          </SectionCard>

          <SectionCard eyebrow="Semaforo visual" title="Calendario sintetico">
            <StatusLegend
              activeStatuses={filters.visual}
              onToggleStatus={(status) => updateFilter("visual", toggleSelection(filters.visual, status))}
            />
            <div className="calendar-toolbar">
              <div className="calendar-toolbar__tabs" role="tablist" aria-label="Modos de calendario">
                {(["agenda", "semanal", "mensal"] as CalendarMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={calendarMode === mode}
                    className={`calendar-tab${calendarMode === mode ? " calendar-tab--active" : ""}`}
                    onClick={() => handleCalendarModeChange(mode)}
                  >
                    {mode[0].toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              <p className="calendar-toolbar__summary">
                {aggregatedDays.length > 0
                  ? `${aggregatedDays.length} dia(s) com ocorrencias no recorte atual.`
                  : "Sem dias visiveis para o recorte atual."}
              </p>
            </div>

            <PeriodSummary rows={filteredRows} />

            {loading ? <p className="state-message">Atualizando calendario...</p> : null}
            {!loading && workbenchRows.length === 0 ? (
              <p className="state-message">Ainda nao ha eventos para montar o calendario deste turno.</p>
            ) : null}
            {!loading && workbenchRows.length > 0 && aggregatedDays.length === 0 ? (
              <p className="state-message">Nenhum evento do calendario combina com o recorte ativo.</p>
            ) : null}
            {!loading && aggregatedDays.length > 0 ? (
              <div className="calendar-workbench">
                <div className="calendar-workbench__main">
                  {calendarMode === "agenda" ? (
                    <div className={`calendar-grid${compactMode ? " calendar-grid--compact" : ""}`}>
                      {aggregatedDays.map((day) => renderDayButton(day, compactMode))}
                    </div>
                  ) : null}

                  {calendarMode === "semanal" ? (
                    <div className="calendar-groups">
                      {weekGroups.map(([weekStart, days]) => (
                        <WeeklyMatrix
                          key={weekStart}
                          compactMode={compactMode}
                          weekLabel={formatWeekLabel(weekStart)}
                          rows={days.flatMap((day) => day.rows)}
                          selectedDay={selectedDay}
                          onSelectDay={setSelectedDay}
                        />
                      ))}
                    </div>
                  ) : null}

                  {calendarMode === "mensal" ? (
                    <div className="calendar-groups">
                      {monthGroups.map(([monthKey, days]) => (
                        <section key={monthKey} className="calendar-group-block">
                          <header className="calendar-group-block__header">
                            <strong>{formatMonthLabel(`${monthKey}-01`)}</strong>
                            <span>{days.length} dia(s)</span>
                          </header>
                          <div className="calendar-grid calendar-grid--compact">{days.map((day) => renderDayButton(day, true))}</div>
                        </section>
                      ))}
                    </div>
                  ) : null}
                </div>

                {selectedDayDetail ? (
                  <aside className="calendar-detail">
                    <div className="calendar-detail__summary">
                      <p className="calendar-detail__eyebrow">Resumo do dia</p>
                      <h3>{formatDate(selectedDayDetail.date)}</h3>
                      <div className="status-badges">
                        <span className={`status-badge status-badge--${selectedDayDetail.primaryStatus.toLowerCase()}`}>
                          {selectedDayDetail.primaryStatus}
                        </span>
                        <span className="status-badge status-badge--vermelho">{selectedDayDetail.conflictCount} conflito(s)</span>
                        <span className="status-badge status-badge--amarelo">{selectedDayDetail.missingProfessorCount} lacuna(s)</span>
                        <span className="status-badge status-badge--roxo">{selectedDayDetail.substitutionCount} substituicao(oes)</span>
                        <span className="status-badge status-badge--accent">{selectedDayDetail.overrideCount} override(s)</span>
                      </div>
                    </div>

                    <div className="calendar-detail__occurrences">
                      <div className="calendar-detail__section-head">
                        <strong>Ocorrencias acionaveis</strong>
                        <span>{selectedDayDetail.rows.length} item(ns)</span>
                      </div>
                      <div className="calendar-detail__list">
                        {selectedDayDetail.rows.map((row) => {
                          const signalExplanation = buildSignalExplanation(row);

                          return (
                            <article key={row.key} className="calendar-card">
                              <header>
                                <strong>{row.turma_codigo}</strong>
                                <span>{row.status_visual}</span>
                              </header>
                              <div className="stack-cell">
                                <div className="person-role">
                                  <span className="person-role__label">Titular</span>
                                  <strong>{row.professor_titular_nome ?? "Sem titular definido"}</strong>
                                </div>
                                <div className="person-role">
                                  <span className="person-role__label">Substituto</span>
                                  <span>{row.professor_substituto_nome ?? "Sem substituto"}</span>
                                </div>
                              </div>
                              <div className="signal-stack">
                                <div className="status-badges">
                                  {signalExplanation.badges.map((signal) => (
                                    <span key={`${row.key}-detail-${signal.label}`} className={`status-badge status-badge--${signal.tone}`}>
                                      {signal.label}
                                    </span>
                                  ))}
                                </div>
                                <details className="signal-explainer">
                                  <summary>{signalExplanation.summary}</summary>
                                  <ul className="signal-explainer__list">
                                    {signalExplanation.reasons.map((reason) => (
                                      <li key={`${row.key}-detail-${reason}`}>{reason}</li>
                                    ))}
                                  </ul>
                                </details>
                              </div>
                              <ActionStack onOpen={openDrawer} row={row} />
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  </aside>
                ) : null}
              </div>
            ) : null}
          </SectionCard>
        </div>
      </div>

      {drawerState ? (
        <EscalaActionDrawer
          action={drawerState.action}
          fallbackHref={buildActionSearch(drawerState.row, drawerState.action)}
          onClose={() => setDrawerState(null)}
          onSaved={handleSaved}
          professores={professores}
          row={drawerState.row}
          rows={workbenchRows}
          signalExplanation={buildSignalExplanation(drawerState.row)}
          turmas={turmas}
        />
      ) : null}
    </>
  );
}
