import { useState } from "react";
import { useAppStatus } from "../../app/AppStatusContext";
import { api } from "../../lib/api";
import { readErrorMessage } from "../../lib/errors";
import type { Contratacao, Professor } from "../../types/api";

const initialForm = { nome: "", contratacao: "CLT" as Contratacao };

type ProfessorFormProps = {
  onSaved?: (professor: Professor) => Promise<void> | void;
};

/**
 * Formulario de cadastro de professor. Extraido do CadastrosPage.tsx (Onda 3).
 */
export function ProfessorForm({ onSaved }: ProfessorFormProps) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const { showError, showSuccess } = useAppStatus();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const created = await api.createProfessor(form);
      setForm(initialForm);
      showSuccess("Professor cadastrado com sucesso.");
      await onSaved?.(created);
    } catch (error) {
      showError(readErrorMessage(error, "Nao foi possivel cadastrar o professor."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label>
        Nome
        <input
          value={form.nome}
          onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
          required
        />
      </label>
      <label>
        Contratacao
        <select
          value={form.contratacao}
          onChange={(event) =>
            setForm((current) => ({ ...current, contratacao: event.target.value as Contratacao }))
          }
        >
          <option value="PF">PF</option>
          <option value="CLT">CLT</option>
          <option value="PJ">PJ</option>
        </select>
      </label>
      <button type="submit" className="primary-button" disabled={submitting}>
        {submitting ? "Salvando..." : "Salvar professor"}
      </button>
    </form>
  );
}
