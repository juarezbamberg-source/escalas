import { formatDate } from "../lib/format";
import type { WorkbenchRow } from "../types/workbench";

type WeeklyMatrixProps = {
  compactMode: boolean;
  onSelectDay: (date: string) => void;
  rows: WorkbenchRow[];
  selectedDay: string | null;
  weekLabel: string;
};

/**
 * Matriz semanal de dias. Componente extraido do EscalaPage.tsx.
 */
export function WeeklyMatrix({ compactMode, onSelectDay, rows, selectedDay, weekLabel }: WeeklyMatrixProps) {
  const dates = Array.from(new Set(rows.map((row) => row.data))).sort((left, right) =>
    left.localeCompare(right),
  );

  return (
    <section className="weekly-matrix" aria-label={weekLabel}>
      <header className="weekly-matrix__header">
        <strong>{weekLabel}</strong>
        <span>{dates.length} dia(s)</span>
      </header>
      <div className={`calendar-grid${compactMode ? " calendar-grid--compact" : ""}`}>
        {dates.map((date) => {
          const total = rows.filter((row) => row.data === date).length;
          return (
            <button
              key={date}
              type="button"
              className={`calendar-day-card${selectedDay === date ? " calendar-day-card--selected" : ""}`}
              aria-pressed={selectedDay === date}
              onClick={() => onSelectDay(date)}
            >
              <strong>{formatDate(date)}</strong>
              <span>{total} alocacao(oes)</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
