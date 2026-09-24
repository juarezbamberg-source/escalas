import { useMemo } from "react";

export type Periodo = { inicio: string; fim: string };

export type PresetPeriodo = {
  id: string;
  label: string;
  calcular: () => Periodo;
};

function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function inicioDoMes(offsetMeses = 0): Date {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth() + offsetMeses, 1);
}

function fimDoMes(offsetMeses = 0): Date {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth() + offsetMeses + 1, 0);
}

export const PRESETS_PADRAO: PresetPeriodo[] = [
  {
    id: "mes-corrente",
    label: "Mês corrente",
    calcular: () => ({ inicio: paraISO(inicioDoMes()), fim: paraISO(new Date()) }),
  },
  {
    id: "mes-anterior",
    label: "Mês anterior",
    calcular: () => ({ inicio: paraISO(inicioDoMes(-1)), fim: paraISO(fimDoMes(-1)) }),
  },
  {
    id: "ultimos-30",
    label: "Últimos 30 dias",
    calcular: () => {
      const fim = new Date();
      const inicio = new Date();
      inicio.setDate(inicio.getDate() - 29);
      return { inicio: paraISO(inicio), fim: paraISO(fim) };
    },
  },
  {
    id: "trimestre",
    label: "Trimestre",
    calcular: () => {
      const hoje = new Date();
      const mesInicial = Math.floor(hoje.getMonth() / 3) * 3;
      return {
        inicio: paraISO(new Date(hoje.getFullYear(), mesInicial, 1)),
        fim: paraISO(hoje),
      };
    },
  },
];

type Props = {
  value: Periodo;
  onChange: (periodo: Periodo) => void;
};

export function PeriodoSelector({ value, onChange }: Props) {
  const presetAtivo = useMemo(
    () =>
      PRESETS_PADRAO.find(
        (preset) => preset.calcular().inicio === value.inicio && preset.calcular().fim === value.fim,
      )?.id ?? "personalizado",
    [value.inicio, value.fim],
  );

  return (
    <div className="periodo-selector" role="group" aria-label="Período dos relatórios">
      <div className="turno-tabs" role="tablist" aria-label="Períodos predefinidos">
        {PRESETS_PADRAO.map((preset) => (
          <button
            key={preset.id}
            type="button"
            role="tab"
            aria-selected={presetAtivo === preset.id}
            className={`turno-tabs__button${presetAtivo === preset.id ? " turno-tabs__button--active" : ""}`}
            onClick={() => onChange(preset.calcular())}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="periodo-selector__datas">
        <label>
          De{" "}
          <input
            type="date"
            value={value.inicio}
            max={value.fim}
            onChange={(event) => {
              if (event.target.value) onChange({ ...value, inicio: event.target.value });
            }}
            aria-label="Data inicial"
          />
        </label>
        <label>
          até{" "}
          <input
            type="date"
            value={value.fim}
            min={value.inicio}
            onChange={(event) => {
              if (event.target.value) onChange({ ...value, fim: event.target.value });
            }}
            aria-label="Data final"
          />
        </label>
      </div>
    </div>
  );
}
