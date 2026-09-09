import type { Turno } from "../types/api";

const turnos: Turno[] = ["manha", "tarde", "noite"];

export function TurnoTabs({
  value,
  onChange,
}: {
  value: Turno;
  onChange: (turno: Turno) => void;
}) {
  return (
    <div className="turno-tabs" role="tablist" aria-label="Turnos">
      {turnos.map((turno) => (
        <button
          key={turno}
          type="button"
          role="tab"
          aria-selected={value === turno}
          className={`turno-tabs__button${value === turno ? " turno-tabs__button--active" : ""}`}
          onClick={() => onChange(turno)}
        >
          {turno}
        </button>
      ))}
    </div>
  );
}
