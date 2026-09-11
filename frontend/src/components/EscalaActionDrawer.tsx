import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAppStatus } from "../app/AppStatusContext";
import { api, ApiError } from "../lib/api";
import type { SignalExplanation } from "../lib/escalaSignals";
import type { Professor, StatusVisual, Turma, Turno } from "../types/api";

export type EscalaDrawerAction = "alocar" | "substituir" | "override";

export type EscalaDrawerRow = {
  id: number | string;
  turma_id: number;
  turma_codigo: string;
  data: string;
  turno: string;
  professor_titular_id: number | null;
  professor_titular_nome: string | null;
  professor_substituto_id: number | null;
  professor_substituto_nome: string | null;
  forcada: boolean;
  justificativa_override: string | null;
  status_visual: StatusVisual;
};

type EscalaActionDrawerProps = {
  action: EscalaDrawerAction;
  fallbackHref: string;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  professores: Professor[];
  row: EscalaDrawerRow;
  rows: EscalaDrawerRow[];
  signalExplanation: SignalExplanation;
  turmas: Turma[];
};

type FormState = {
  data: string;
  turno: Turno;
  turma_id: number;
  professor_titular_id: number;
  professor_substituto_id: number;
  liberar_fim_de_semana: boolean;
  override: boolean;
  justificativa_override: string;
};

function isWeekendDate(value: string) {
  if (!value) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekDay = date.getDay();
  return weekDay === 0 || weekDay === 6;
}

function normalizeTurno(value: string): Turno {
  if (value === "tarde" || value === "noite") {
    return value;
  }
  return "manha";
}

function buildInitialForm(
  action: EscalaDrawerAction,
  row: EscalaDrawerRow,
  professores: Professor[],
  turmas: Turma[],
): FormState {
  return {
    data: row.data,
    turno: normalizeTurno(row.turno),
    turma_id: row.turma_id || turmas[0]?.id || 0,
    professor_titular_id: row.professor_titular_id || professores[0]?.id || 0,
    professor_substituto_id: action === "substituir" ? row.professor_substituto_id || 0 : row.professor_substituto_id || 0,
    liberar_fim_de_semana: false,
    override: action === "override",
    justificativa_override: action === "override" ? row.justificativa_override ?? "" : "",
  };
}

function includesProfessor(row: EscalaDrawerRow, professorId: number) {
  return row.professor_titular_id === professorId || row.professor_substituto_id === professorId;
}

function readErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return "Nao foi possivel concluir a acao contextual agora.";
}

function actionLabel(action: EscalaDrawerAction) {
  if (action === "substituir") {
    return "Substituir";
  }
  if (action === "override") {
    return "Justificar override";
  }
  return "Alocar";
}

export function EscalaActionDrawer({
  action,
  fallbackHref,
  onClose,
  onSaved,
  professores,
  row,
  rows,
  signalExplanation,
  turmas,
}: EscalaActionDrawerProps) {
  const [currentAction, setCurrentAction] = useState<EscalaDrawerAction>(action);
  const [formState, setFormState] = useState<FormState>(() => buildInitialForm(action, row, professores, turmas));
  const [submitting, setSubmitting] = useState(false);
  const { showError, showSuccess } = useAppStatus();

  useEffect(() => {
    setCurrentAction(action);
    setFormState(buildInitialForm(action, row, professores, turmas));
  }, [action, professores, row, turmas]);

  const sameSlotRows = rows.filter(
    (candidate) => candidate.data === formState.data && candidate.turno === formState.turno && candidate.id !== row.id,
  );
  const duplicateTurma = sameSlotRows.find((candidate) => candidate.turma_id === formState.turma_id);
  const titularConflict = sameSlotRows.find((candidate) =>
    formState.professor_titular_id ? includesProfessor(candidate, formState.professor_titular_id) : false,
  );
  const substituteConflict = sameSlotRows.find((candidate) =>
    formState.professor_substituto_id ? includesProfessor(candidate, formState.professor_substituto_id) : false,
  );
  const weekendDate = isWeekendDate(formState.data);

  const preventiveWarnings: string[] = [];
  if (weekendDate && !formState.liberar_fim_de_semana) {
    preventiveWarnings.push("Marque a liberacao de fim de semana para registrar atividade extracurricular neste dia.");
  }
  if (currentAction === "substituir" && !formState.professor_substituto_id) {
    preventiveWarnings.push("Informe um substituto para concluir a acao de substituicao.");
  }
  if (
    formState.professor_substituto_id > 0 &&
    formState.professor_substituto_id === formState.professor_titular_id
  ) {
    preventiveWarnings.push("O professor substituto deve ser diferente do professor titular.");
  }
  if (duplicateTurma && !formState.override) {
    preventiveWarnings.push(`Ja existe alocacao para a turma ${duplicateTurma.turma_codigo} neste turno e data. Use override se precisar insistir.`);
  }
  if (titularConflict && !formState.override) {
    preventiveWarnings.push(`O professor titular ja aparece em conflito com a turma ${titularConflict.turma_codigo} neste turno e data.`);
  }
  if (substituteConflict && !formState.override) {
    preventiveWarnings.push(`O professor substituto ja aparece em conflito com a turma ${substituteConflict.turma_codigo} neste turno e data.`);
  }
  if (formState.override && formState.justificativa_override.trim().length < 10) {
    preventiveWarnings.push("Informe uma justificativa com pelo menos 10 caracteres para concluir o override.");
  }

  const isSubmitDisabled =
    submitting ||
    !formState.data ||
    !formState.turma_id ||
    !formState.professor_titular_id ||
    (weekendDate && !formState.liberar_fim_de_semana) ||
    (currentAction === "substituir" && !formState.professor_substituto_id) ||
    (formState.override && formState.justificativa_override.trim().length < 10) ||
    (formState.professor_substituto_id > 0 && formState.professor_substituto_id === formState.professor_titular_id);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.createAlocacao({
        turma_id: formState.turma_id,
        data: formState.data,
        turno: formState.turno,
        professor_titular_id: formState.professor_titular_id,
        professor_substituto_id: formState.professor_substituto_id || null,
        liberar_fim_de_semana: formState.liberar_fim_de_semana,
        override: formState.override,
        justificativa_override: formState.override ? formState.justificativa_override : null,
      });
      showSuccess(`${actionLabel(currentAction)} concluido com sucesso.`);
      await onSaved();
      onClose();
    } catch (error) {
      showError(readErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="drawer-shell" role="dialog" aria-modal="true" aria-labelledby="escala-drawer-title">
      <button type="button" className="drawer-backdrop" aria-label="Fechar painel contextual" onClick={onClose} />
      <aside className="drawer-panel">
        <div className="drawer-panel__header">
          <div>
            <p className="drawer-panel__eyebrow">Acao contextual</p>
            <h3 id="escala-drawer-title">{actionLabel(currentAction)} sem sair da escala</h3>
            <p>
              {row.turma_codigo} • {row.data} • {row.turno}
            </p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div className="drawer-mode-tabs" role="tablist" aria-label="Tipos de acao contextual">
          {(["alocar", "substituir", "override"] as EscalaDrawerAction[]).map((drawerAction) => (
            <button
              key={drawerAction}
              type="button"
              role="tab"
              aria-selected={currentAction === drawerAction}
              className={`drawer-mode-tab${currentAction === drawerAction ? " drawer-mode-tab--active" : ""}`}
              onClick={() => {
                setCurrentAction(drawerAction);
                setFormState(buildInitialForm(drawerAction, row, professores, turmas));
              }}
            >
              {actionLabel(drawerAction)}
            </button>
          ))}
        </div>

        <div className="guided-note">
          <strong>Contexto pre-preenchido</strong>
          <p>Turno, data, turma e titular ja vieram do item selecionado. Ajuste apenas o necessario antes de salvar.</p>
        </div>

        <div className="guided-note">
          <strong>Leitura operacional do item</strong>
          <div className="status-badges">
            {signalExplanation.badges.map((badge) => (
              <span key={`drawer-${badge.label}`} className={`status-badge status-badge--${badge.tone}`}>
                {badge.label}
              </span>
            ))}
          </div>
          <p>{signalExplanation.summary}</p>
          <ul className="warning-list">
            {signalExplanation.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>

        <div className="drawer-summary">
          <span className="status-badge">Turno: {formState.turno}</span>
          <span className="status-badge">Data: {formState.data}</span>
          <span className="status-badge">Turma: {turmas.find((turma) => turma.id === formState.turma_id)?.codigo ?? row.turma_codigo}</span>
          <span className="status-badge">Titular: {professores.find((professor) => professor.id === formState.professor_titular_id)?.nome ?? row.professor_titular_nome ?? "A definir"}</span>
        </div>

        <div className="form-grid">
          <label>
            Data
            <input
              type="date"
              value={formState.data}
              onChange={(event) => setFormState((current) => ({ ...current, data: event.target.value }))}
            />
          </label>
          <label>
            Turno
            <select
              value={formState.turno}
              onChange={(event) => setFormState((current) => ({ ...current, turno: normalizeTurno(event.target.value) }))}
            >
              <option value="manha">manha</option>
              <option value="tarde">tarde</option>
              <option value="noite">noite</option>
            </select>
          </label>
          <label>
            Turma
            <select
              value={formState.turma_id}
              onChange={(event) => setFormState((current) => ({ ...current, turma_id: Number(event.target.value) }))}
            >
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.codigo}
                </option>
              ))}
            </select>
          </label>
          <label>
            Professor titular
            <select
              value={formState.professor_titular_id}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  professor_titular_id: Number(event.target.value),
                }))
              }
            >
              {professores.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Professor substituto
            <select
              value={formState.professor_substituto_id}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  professor_substituto_id: Number(event.target.value),
                }))
              }
            >
              <option value={0}>Sem substituto</option>
              {professores.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.nome}
                </option>
              ))}
            </select>
          </label>
          {weekendDate ? (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={formState.liberar_fim_de_semana}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    liberar_fim_de_semana: event.target.checked,
                  }))
                }
              />
              Liberar data de fim de semana para atividade extracurricular
            </label>
          ) : null}
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={formState.override}
              disabled={currentAction === "override"}
              onChange={(event) => setFormState((current) => ({ ...current, override: event.target.checked }))}
            />
            Registrar override
          </label>
          {formState.override ? (
            <label>
              Justificativa do override
              <textarea
                value={formState.justificativa_override}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    justificativa_override: event.target.value,
                  }))
                }
              />
            </label>
          ) : null}
        </div>

        <div className="warning-panel">
          <strong>Validacoes preventivas</strong>
          {preventiveWarnings.length > 0 ? (
            <ul className="warning-list">
              {preventiveWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : (
            <p>Nenhum alerta preventivo no contexto atual.</p>
          )}
        </div>

        <div className="drawer-panel__footer">
          <Link to={fallbackHref} className="secondary-link">
            Abrir formulario completo
          </Link>
          <button type="button" className="primary-button" disabled={isSubmitDisabled} onClick={handleSubmit}>
            {submitting ? "Salvando..." : actionLabel(currentAction)}
          </button>
        </div>
      </aside>
    </div>
  );
}
