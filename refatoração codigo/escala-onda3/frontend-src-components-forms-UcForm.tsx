import { useState } from "react";
import { useAppStatus } from "../../app/AppStatusContext";
import { api } from "../../lib/api";
import { readErrorMessage } from "../../lib/errors";
import type { UnidadeCurricular } from "../../types/api";

const initialForm = { codigo: "", nome: "", carga_horaria: 60 };

type UcFormProps = {
  onSaved?: (uc: UnidadeCurricular) => Promise<void> | void;
};

/**
 * Formulario de cadastro de unidade curricular. Extraido do CadastrosPage.tsx (Onda 3).
 */
export function UcForm({ onSaved }: UcFormProps) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const { showError, showSuccess } = useAppStatus();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const created = await api.createUc(form);
      setForm(initialForm);
      showSuccess("UC cadastrada com sucesso.");
      await onSaved?.(created);
    } catch (error) {
      showError(readErrorMessage(error, "Nao foi possivel cadastrar a UC."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label>
        Codigo
        <input
          value={form.codigo}
          onChange={(event) => setForm((current) => ({ ...current, codigo: event.target.value }))}
          required
        />
      </label>
      <label>
        Nome
        <input
          value={form.nome}
          onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
          required
        />
      </label>
      <label>
        Carga horaria
        <input
          type="number"
          min={1}
          value={form.carga_horaria}
          onChange={(event) =>
            setForm((current) => ({ ...current, carga_horaria: Number(event.target.value) }))
          }
          required
        />
      </label>
      <button type="submit" className="primary-button" disabled={submitting}>
        {submitting ? "Salvando..." : "Salvar UC"}
      </button>
    </form>
  );
}
