import { useEffect, useState } from "react";
import { useAppStatus } from "../../app/AppStatusContext";
import { api } from "../../lib/api";
import { readErrorMessage } from "../../lib/errors";
import type { ActionContext } from "../../lib/actionContext";
import type { Alocacao, Professor, Turma, Turno } from "../../types/api";

const initialForm = {
  turma_id: 0,
  data: "",
  turno: "manha" as Turno,
  professor_titular_id: 0,
  professor_substituto_id: null as number | null,
  liberar_fim_de_semana: false,
  override: false,
  justificativa_override: "",
};

type AlocacaoFormProps = {
  professores: Professor[];
  turmas: Turma[];
  actionContext: ActionContext;
  onSaved?: (alocacao: Alocacao) => Promise<void> | void;
};

/**
 * Formulario de alocacao unitaria. Extraido do CadastrosPage.tsx (Onda 3).
 * Usa null (e nao 0) como sentinela de substituto ausente.
 */
export function AlocacaoForm({ professores, turmas, actionContext, onSaved }: AlocacaoFormProps) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const { showError, showSuccess } = useAppStatus();

  useEffect(() => {
    setForm((current) => ({
      ...current,
      turma_id: actionContext.turmaId ?? current.turma_id ?? turmas[0]?.id ?? 0,
      data: actionContext.data || current.data,
      turno: (actionContext.turno || current.turno || "manha") as Turno,
      professor_titular_id: actionContext.titularId ?? current.professor_titular_id ?? professores[0]?.id ?? 0,
      professor_substituto_id:
        actionContext.action === "substituir"
          ? actionContext.substitutoId ?? current.professor_substituto_id
          : current.professor_substituto_id,
      override: actionContext.action === "override" ? true : current.override,
    }));
  }, [actionContext, professores, turmas]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const created = await api.createAlocacao({
        turma_id: form.turma_id,
        data: form.data,
        turno: form.turno,
        professor_titular_id: form.professor_titular_id,
        professor_substituto_id: form.professor_substituto_id,
        liberar_fim_de_semana: form.liberar_fim_de_semana,
        override: form.override,
        justificativa_override: form.override ? form.justificativa_override : null,
      });
      setForm((current) => ({
        ...initialForm,
        turno: current.turno,
        turma_id: current.turma_id,
        professor_titular_id: current.professor_titular_id,
      }));
      showSuccess("Alocacao salva com sucesso.");
      await onSaved?.(created);
    } catch (error) {
      showError(readErrorMessage(error, "Nao foi possivel salvar a alocacao."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label>
        Data
        <input
          type="date"
          value={form.data}
          onChange={(event) => setForm((current) => ({ ...current, data: event.target.value }))}
          required
        />
      </label>
      <label>
        Turno
        <select
          value={form.turno}
          onChange={(event) => setForm((current) => ({ ...current, turno: event.target.value as Turno }))}
        >
          <option value="manha">manha</option>
          <option value="tarde">tarde</option>
          <option value="noite">noite</option>
        </select>
      </label>
      <label>
        Turma
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
      {form.liberar_fim_de_semana ? null : null}
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.liberar_fim_de_semana}
          onChange={(event) =>
            setForm((current) => ({ ...current, liberar_fim_de_semana: event.target.checked }))
          }
        />
        Liberar data de fim de semana para atividade extracurricular
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
      <button
        type="submit"
        className="primary-button"
        disabled={submitting || professores.length === 0 || turmas.length === 0}
      >
        {submitting ? "Salvando..." : "Salvar alocacao"}
      </button>
    </form>
  );
}
