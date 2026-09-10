import { useState } from "react";
import { useAppStatus } from "../../app/AppStatusContext";
import { api } from "../../lib/api";
import { readErrorMessage } from "../../lib/errors";
import type { AlocacaoBulkCreateResponse, Professor, Turma, Turno } from "../../types/api";

const DIAS_DA_SEMANA = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terca" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sabado" },
];

const initialForm = {
  turma_id: 0,
  data_inicial: "",
  data_final: "",
  turnos: ["manha"] as Turno[],
  dias_da_semana: [] as number[],
  professor_titular_id: 0,
  professor_substituto_id: null as number | null,
  liberar_fim_de_semana: false,
  override: false,
  justificativa_override: "",
};

type BulkRecurringFormProps = {
  professores: Professor[];
  turmas: Turma[];
};

/**
 * Formulario de lote recorrente com preview + confirmacao.
 * Extraido do CadastrosPage.tsx (Onda 3).
 */
export function BulkRecurringForm({ professores, turmas }: BulkRecurringFormProps) {
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState<AlocacaoBulkCreateResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showError, showSuccess } = useAppStatus();

  function toggleDia(dia: number) {
    setForm((current) => ({
      ...current,
      dias_da_semana: current.dias_da_semana.includes(dia)
        ? current.dias_da_semana.filter((item) => item !== dia)
        : [...current.dias_da_semana, dia],
    }));
  }

  function toggleTurno(turno: Turno) {
    setForm((current) => ({
      ...current,
      turnos: current.turnos.includes(turno)
        ? current.turnos.filter((item) => item !== turno)
        : [...current.turnos, turno],
    }));
  }

  async function handlePreview() {
    setSubmitting(true);
    try {
      const result = await api.createAlocacoesRecorrentes({
        turma_id: form.turma_id,
        data_inicial: form.data_inicial,
        data_final: form.data_final,
        turnos: form.turnos,
        dias_da_semana: form.dias_da_semana,
        professor_titular_id: form.professor_titular_id,
        professor_substituto_id: form.professor_substituto_id,
        liberar_fim_de_semana: form.liberar_fim_de_semana,
        override: form.override,
        justificativa_override: form.override ? form.justificativa_override : null,
        confirmar: false,
      });
      setPreview(result);
      showSuccess("Preview do lote recorrente atualizado.");
    } catch (error) {
      showError(readErrorMessage(error, "Nao foi possivel gerar o preview do lote."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const result = await api.createAlocacoesRecorrentes({
        turma_id: form.turma_id,
        data_inicial: form.data_inicial,
        data_final: form.data_final,
        turnos: form.turnos,
        dias_da_semana: form.dias_da_semana,
        professor_titular_id: form.professor_titular_id,
        professor_substituto_id: form.professor_substituto_id,
        liberar_fim_de_semana: form.liberar_fim_de_semana,
        override: form.override,
        justificativa_override: form.override ? form.justificativa_override : null,
        confirmar: true,
      });
      setPreview(result);
      setForm((current) => ({
        ...current,
        data_inicial: "",
        data_final: "",
        dias_da_semana: [],
        justificativa_override: current.override ? current.justificativa_override : "",
      }));
      showSuccess(`${result.total_criados} alocacao(oes) recorrente(s) criada(s) com sucesso.`);
    } catch (error) {
      showError(readErrorMessage(error, "Nao foi possivel confirmar o lote recorrente."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-grid">
      <label>
        Turma do lote
        <select
          value={form.turma_id}
          onChange={(event) => setForm((current) => ({ ...current, turma_id: Number(event.target.value) }))}
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
          value={form.professor_titular_id}
          onChange={(event) =>
            setForm((current) => ({ ...current, professor_titular_id: Number(event.target.value) }))
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
          value={form.professor_substituto_id ?? 0}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              professor_substituto_id: Number(event.target.value) || null,
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
      <label>
        Data inicial do lote
        <input
          type="date"
          value={form.data_inicial}
          onChange={(event) => setForm((current) => ({ ...current, data_inicial: event.target.value }))}
        />
      </label>
      <label>
        Data final do lote
        <input
          type="date"
          value={form.data_final}
          onChange={(event) => setForm((current) => ({ ...current, data_final: event.target.value }))}
        />
      </label>
      <fieldset className="checkbox-group">
        <legend>Turnos</legend>
        {(["manha", "tarde", "noite"] as Turno[]).map((turno) => (
          <label key={turno} className="checkbox-row">
            <input
              type="checkbox"
              checked={form.turnos.includes(turno)}
              onChange={() => toggleTurno(turno)}
            />
            {turno}
          </label>
        ))}
      </fieldset>
      <fieldset className="checkbox-group">
        <legend>Dias da semana</legend>
        {DIAS_DA_SEMANA.map((dia) => (
          <label key={dia.value} className="checkbox-row">
            <input
              type="checkbox"
              checked={form.dias_da_semana.includes(dia.value)}
              onChange={() => toggleDia(dia.value)}
            />
            {dia.label}
          </label>
        ))}
      </fieldset>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.liberar_fim_de_semana}
          onChange={(event) =>
            setForm((current) => ({ ...current, liberar_fim_de_semana: event.target.checked }))
          }
        />
        Liberar fim de semana para atividade extracurricular
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.override}
          onChange={(event) => setForm((current) => ({ ...current, override: event.target.checked }))}
        />
        Registrar override
      </label>
      {form.override ? (
        <label>
          Justificativa do override
          <textarea
            value={form.justificativa_override}
            onChange={(event) =>
              setForm((current) => ({ ...current, justificativa_override: event.target.value }))
            }
          />
        </label>
      ) : null}
      <div className="button-row">
        <button type="button" className="secondary-button" onClick={handlePreview} disabled={submitting}>
          Validar lote
        </button>
        <button type="button" className="primary-button" onClick={handleConfirm} disabled={submitting || !preview}>
          Confirmar gravacao
        </button>
      </div>
      {preview ? (
        <div className="bulk-panel">
          <p className="bulk-panel__eyebrow">Preview recorrente</p>
          <strong>{preview.total_previsto} item(ns) previsto(s)</strong>
          <div className="status-badges">
            <span className="status-badge">Validos: {preview.total_validos}</span>
            <span className="status-badge status-badge--amarelo">Bloqueados: {preview.total_bloqueados}</span>
            <span className="status-badge status-badge--verde">Criados: {preview.total_criados}</span>
          </div>
        </div>
      ) : (
        <p className="state-message">Valide o lote para conferir datas geradas, conflitos e itens prontos para gravar.</p>
      )}
    </div>
  );
}
