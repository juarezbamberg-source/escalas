import { useEffect, useMemo, useState } from "react";

import { useAppStatus } from "../app/AppStatusContext";
import { SectionCard } from "../components/SectionCard";
import { api, ApiError } from "../lib/api";
import { getStoredUser } from "../lib/auth";
import type { CargaPrevistaItem, CargaProfessorItem, DashboardResumo } from "../types/api";

type TipoCarga = "realizada" | "prevista";

export function DashboardPage() {
  const usuario = getStoredUser();
  const ehProfessor = usuario?.funcao === "professor";
  const [tipo, setTipo] = useState<TipoCarga>("realizada");
  const [rowsRealizada, setRowsRealizada] = useState<CargaProfessorItem[]>([]);
  const [rowsPrevista, setRowsPrevista] = useState<CargaPrevistaItem[]>([]);
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const { startLoading, stopLoading, showError, clearMessages } = useAppStatus();

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      clearMessages();
      startLoading();

      try {
        if (tipo === "prevista") {
          const resposta = (await api.listCargaProfessores("prevista")) as CargaPrevistaItem[];
          if (active) {
            setRowsPrevista(
              resposta.sort(
                (left, right) =>
                  right.horas - left.horas || left.professor_nome.localeCompare(right.professor_nome),
              ),
            );
          }
        } else {
          const resposta = (await api.listCargaProfessores("realizada")) as CargaProfessorItem[];
          if (active) {
            setRowsRealizada(
              resposta.sort(
                (left, right) =>
                  right.horas - left.horas || left.professor_nome.localeCompare(right.professor_nome),
              ),
            );
          }
        }
        if (!ehProfessor) {
          const respostaResumo = await api.dashboardResumo();
          if (active) {
            setResumo(respostaResumo);
          }
        }
      } catch (error) {
        if (active) {
          showError(
            error instanceof ApiError
              ? error.message
              : "Nao foi possivel carregar o dashboard de graficos agora. Tente novamente em instantes.",
          );
          setRowsRealizada([]);
          setRowsPrevista([]);
          setResumo(null);
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
  }, [clearMessages, ehProfessor, showError, startLoading, stopLoading, tipo]);

  const rowsPrevistas = tipo === "prevista";
  const rows = rowsPrevistas ? rowsPrevista : rowsRealizada;

  const maxHours = useMemo(() => rows[0]?.horas ?? 0, [rows]);
  const totalHoras = useMemo(() => rows.reduce((sum, row) => sum + row.horas, 0), [rows]);

  return (
    <div className="page-stack">
      <SectionCard
        eyebrow={ehProfessor ? "Meu painel" : "Inteligencia operacional"}
        title={ehProfessor ? "Meu Dashboard" : "Dashboard de graficos"}
      >
        <p>
          {ehProfessor
            ? "Acompanhe a sua carga realizada (alocacoes lancadas) e prevista (atribuicoes vigentes)."
            : "Compare a carga prevista (atribuicoes com vigencia) e a carga realizada (alocacoes lancadas) por professor."}
        </p>
        <div className="turno-tabs" role="tablist" aria-label="Tipo de carga">
          <button
            type="button"
            role="tab"
            aria-selected={tipo === "realizada"}
            className={`turno-tabs__button${tipo === "realizada" ? " turno-tabs__button--active" : ""}`}
            onClick={() => setTipo("realizada")}
          >
            Realizada
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tipo === "prevista"}
            className={`turno-tabs__button${tipo === "prevista" ? " turno-tabs__button--active" : ""}`}
            onClick={() => setTipo("prevista")}
          >
            Prevista
          </button>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Carga por professor"
        title={rowsPrevistas ? "Horas previstas por professor (atribuicoes)" : "Total de horas por professor (alocacoes)"}
      >
        {loading ? (
          <p className="state-message">Carregando carga consolidada por professor...</p>
        ) : null}
        {!loading && rows.length === 0 ? (
          <p className="state-message">
            {rowsPrevistas
              ? "Nenhuma atribuicao vigente encontrada para montar o grafico."
              : "Nenhuma alocacao encontrada para montar o grafico."}
          </p>
        ) : null}
        {!loading && rows.length > 0 ? (
          <div className="dashboard-layout">
            <div className="dashboard-summary">
              <article className="period-summary__card">
                <strong>{rows.length}</strong>
                <p>professor(es) no recorte</p>
              </article>
              <article className="period-summary__card">
                <strong>{totalHoras}h</strong>
                <p>{rowsPrevistas ? "carga prevista total" : "carga realizada total"}</p>
              </article>
              <article className="period-summary__card">
                <strong>{rows[0].professor_nome}</strong>
                <p>lidera com {rows[0].horas}h</p>
              </article>
            </div>

            <div
              className="hours-chart"
              role="img"
              aria-label={rowsPrevistas ? "Grafico de horas previstas por professor" : "Grafico de total de horas por professor"}
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
                    {rowsPrevistas
                      ? `${(row as CargaPrevistaItem).atribuicoes} atribuicao(oes) • ${(row as CargaPrevistaItem).turmas} turma(s)`
                      : `${(row as CargaProfessorItem).alocacoes} alocacao(oes) • Manha ${(row as CargaProfessorItem).manha}h • Tarde ${(row as CargaProfessorItem).tarde}h • Noite ${(row as CargaProfessorItem).noite}h`}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </SectionCard>

      {!ehProfessor && resumo ? (
        <SectionCard eyebrow="Operacao no periodo" title={`Resumo de ${resumo.data_inicio.split("-").reverse().join("/")} a ${resumo.data_fim.split("-").reverse().join("/")}`}>
          <div className="dashboard-summary">
            <article className="period-summary__card">
              <strong>{resumo.total_alocacoes}</strong>
              <p>alocacoes no periodo</p>
            </article>
            <article className="period-summary__card">
              <strong>{resumo.total_substituicoes}</strong>
              <p>substituicoes</p>
            </article>
            <article className="period-summary__card">
              <strong>{resumo.alocacoes_por_turma.length}</strong>
              <p>turmas com alocacao</p>
            </article>
          </div>
          <div className="dashboard-charts">
            <div className="mini-chart">
              <h4>Alocacoes por turno</h4>
              <div
                className="hours-chart"
                role="img"
                aria-label="Grafico de alocacoes por turno"
              >
                {(["manha", "tarde", "noite"] as const).map((turno) => {
                  const total = resumo.alocacoes_por_turno[turno] ?? 0;
                  const max = Math.max(...Object.values(resumo.alocacoes_por_turno), 1);
                  return (
                    <article key={turno} className="hours-chart__row">
                      <div className="hours-chart__header">
                        <strong>{turno}</strong>
                        <span>{total}</span>
                      </div>
                      <div className="hours-chart__bar-track" aria-hidden="true">
                        <div
                          className="hours-chart__bar-fill"
                          style={{ width: `${Math.max((total / max) * 100, 8)}%` }}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
            <div className="mini-chart">
              <h4>Top turmas por alocacoes</h4>
              <div
                className="hours-chart"
                role="img"
                aria-label="Grafico de alocacoes por turma"
              >
                {resumo.alocacoes_por_turma.slice(0, 5).map((turma) => {
                  const max = Math.max(
                    ...resumo.alocacoes_por_turma.map((item) => item.alocacoes),
                    1,
                  );
                  return (
                    <article key={turma.turma_id} className="hours-chart__row">
                      <div className="hours-chart__header">
                        <strong>{turma.turma_codigo}</strong>
                        <span>{turma.alocacoes}</span>
                      </div>
                      <div className="hours-chart__bar-track" aria-hidden="true">
                        <div
                          className="hours-chart__bar-fill"
                          style={{ width: `${Math.max((turma.alocacoes / max) * 100, 8)}%` }}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
