import { useEffect, useMemo, useState } from "react";

import { useAppStatus } from "../app/AppStatusContext";
import { SectionCard } from "../components/SectionCard";
import { api, ApiError } from "../lib/api";
import type { Alocacao, Turno } from "../types/api";

type ProfessorHoursRow = {
  professor: string;
  horas: number;
  alocacoes: number;
  manha: number;
  tarde: number;
  noite: number;
};

const TURNOS: Turno[] = ["manha", "tarde", "noite"];
const HORAS_POR_ALOCACAO = 3;

function summarizeHoursByProfessor(alocacoes: Alocacao[]) {
  const grouped = alocacoes.reduce((acc, item) => {
    const key = item.professor_titular_nome;
    const current =
      acc.get(key) ??
      ({
        professor: item.professor_titular_nome,
        horas: 0,
        alocacoes: 0,
        manha: 0,
        tarde: 0,
        noite: 0,
      } satisfies ProfessorHoursRow);

    current.horas += HORAS_POR_ALOCACAO;
    current.alocacoes += 1;
    current[item.turno as Turno] += HORAS_POR_ALOCACAO;
    acc.set(key, current);
    return acc;
  }, new Map<string, ProfessorHoursRow>());

  return Array.from(grouped.values()).sort((left, right) => right.horas - left.horas || left.professor.localeCompare(right.professor));
}

export function DashboardPage() {
  const [rows, setRows] = useState<ProfessorHoursRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { startLoading, stopLoading, showError, clearMessages } = useAppStatus();

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      clearMessages();
      startLoading();

      try {
        const response = await Promise.all(TURNOS.map((turno) => api.listAlocacoes(turno)));
        if (!active) {
          return;
        }

        setRows(summarizeHoursByProfessor(response.flat()));
      } catch (error) {
        if (active) {
          showError(
            error instanceof ApiError
              ? error.message
              : "Nao foi possivel carregar o dashboard de graficos agora. Tente novamente em instantes.",
          );
          setRows([]);
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
  }, [clearMessages, showError, startLoading, stopLoading]);

  const maxHours = useMemo(() => rows[0]?.horas ?? 0, [rows]);
  const totalHoras = useMemo(() => rows.reduce((sum, row) => sum + row.horas, 0), [rows]);

  return (
    <div className="page-stack">
      <SectionCard eyebrow="Inteligencia operacional" title="Dashboard de graficos">
        <p>Comecamos com a leitura de carga por professor para enxergar distribuicao de horas e concentracao por turno.</p>
      </SectionCard>

      <SectionCard eyebrow="Primeiro grafico" title="Total de horas por professor">
        {loading ? <p className="state-message">Carregando horas consolidadas por professor...</p> : null}
        {!loading && rows.length === 0 ? <p className="state-message">Nenhuma alocacao encontrada para montar o grafico.</p> : null}
        {!loading && rows.length > 0 ? (
          <div className="dashboard-layout">
            <div className="dashboard-summary">
              <article className="period-summary__card">
                <strong>{rows.length}</strong>
                <p>professor(es) com horas registradas</p>
              </article>
              <article className="period-summary__card">
                <strong>{totalHoras}h</strong>
                <p>carga total consolidada</p>
              </article>
              <article className="period-summary__card">
                <strong>{rows[0].professor}</strong>
                <p>lidera com {rows[0].horas}h alocadas</p>
              </article>
            </div>

            <div className="hours-chart" role="img" aria-label="Grafico de total de horas por professor">
              {rows.map((row) => (
                <article key={row.professor} className="hours-chart__row">
                  <div className="hours-chart__header">
                    <strong>{row.professor}</strong>
                    <span>{row.horas}h</span>
                  </div>
                  <div className="hours-chart__bar-track" aria-hidden="true">
                    <div
                      className="hours-chart__bar-fill"
                      style={{ width: maxHours > 0 ? `${Math.max((row.horas / maxHours) * 100, 8)}%` : "0%" }}
                    />
                  </div>
                  <p className="hours-chart__meta">
                    {row.alocacoes} alocacao(oes) • Manha {row.manha}h • Tarde {row.tarde}h • Noite {row.noite}h
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
