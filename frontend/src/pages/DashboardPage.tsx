import { useEffect, useMemo, useState } from "react";

import { useAppStatus } from "../app/AppStatusContext";
import { SectionCard } from "../components/SectionCard";
import { api, ApiError } from "../lib/api";
import type { CargaProfessorItem } from "../types/api";

export function DashboardPage() {
  const [rows, setRows] = useState<CargaProfessorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { startLoading, stopLoading, showError, clearMessages } = useAppStatus();

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      clearMessages();
      startLoading();

      try {
        const response = await api.listCargaProfessores();
        if (active) {
          setRows(
            response.sort(
              (left, right) =>
                right.horas - left.horas || left.professor_nome.localeCompare(right.professor_nome),
            ),
          );
        }
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
        <p>
          Comecamos com a leitura de carga por professor para enxergar distribuicao de horas e
          concentracao por turno.
        </p>
      </SectionCard>

      <SectionCard eyebrow="Primeiro grafico" title="Total de horas por professor">
        {loading ? (
          <p className="state-message">Carregando horas consolidadas por professor...</p>
        ) : null}
        {!loading && rows.length === 0 ? (
          <p className="state-message">Nenhuma alocacao encontrada para montar o grafico.</p>
        ) : null}
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
                <strong>{rows[0].professor_nome}</strong>
                <p>lidera com {rows[0].horas}h alocadas</p>
              </article>
            </div>

            <div
              className="hours-chart"
              role="img"
              aria-label="Grafico de total de horas por professor"
            >
              {rows.map((row) => (
                <article key={row.professor_id} className="hours-chart__row">
                  <div className="hours-chart__header">
                    <strong>{row.professor_nome}</strong>
                    <span>{row.horas}h</span>
                  </div>
                  <div className="hours-chart__bar-track" aria-hidden="true">
                    <div
                      className="hours-chart__bar-fill"
                      style={{
                        width:
                          maxHours > 0 ? `${Math.max((row.horas / maxHours) * 100, 8)}%` : "0%",
                      }}
                    />
                  </div>
                  <p className="hours-chart__meta">
                    {row.alocacoes} alocacao(oes) • Manha {row.manha}h • Tarde {row.tarde}h • Noite{" "}
                    {row.noite}h
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
