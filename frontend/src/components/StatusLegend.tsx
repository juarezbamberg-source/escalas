import type { StatusVisual } from "../types/api";

const legendItems = [
  { status: "VERDE", description: "Professor alocado sem conflito" },
  { status: "VERMELHO", description: "Professor em conflito de horario" },
  { status: "AMARELO", description: "Turma sem professor no dia" },
  { status: "ROXO", description: "Titular e substituto na mesma turma" },
] as const;

type StatusLegendProps = {
  activeStatuses?: StatusVisual[];
  onToggleStatus?: (status: StatusVisual) => void;
};

export function StatusLegend({ activeStatuses = [], onToggleStatus }: StatusLegendProps) {
  return (
    <div className="legend-grid">
      {legendItems.map((item) => (
        <button
          key={item.status}
          type="button"
          className={`legend-item legend-item--button${activeStatuses.includes(item.status) ? " legend-item--active" : ""}`}
          aria-pressed={activeStatuses.includes(item.status)}
          onClick={() => onToggleStatus?.(item.status)}
        >
          <span className={`legend-swatch legend-swatch--${item.status.toLowerCase()}`} />
          <div>
            <strong>{item.status}</strong>
            <p>{item.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
