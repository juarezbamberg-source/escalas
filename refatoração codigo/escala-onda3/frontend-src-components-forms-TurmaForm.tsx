import { useState } from "react";
import { useAppStatus } from "../../app/AppStatusContext";
import { api } from "../../lib/api";
import { readErrorMessage } from "../../lib/errors";
import type { Turma, Turno, UnidadeCurricular } from "../../types/api";

const initialForm = { codigo: "", nome: "", turno_padrao: "manha" as Turno, uc_id: 0 };

type TurmaFormProps = {
  ucs: UnidadeCurricular[];
  onSaved?: (turma: Turma) => Promise<void> | void;
};

/**
 * Formulario de cadastro de turma. Extraido do CadastrosPage.tsx (Onda 3).
 */
export function TurmaForm({ ucs, onSaved }: TurmaFormProps) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const { showError, showSuccess } = useAppStatus();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const created = await api.createTurma({ ...form, uc_id: form.uc_id || ucs[0]?.id || 0 });
      setForm((current) => ({ ...initialForm, uc_id: current.uc_id || ucs[0]?.id || 0 }));
      showSuccess("Turma cadastrada com sucesso.");
      await onSaved?.(created);
    } catch (error) {
      showError(readErrorMessage(error, "Nao foi possivel cadastrar a turma."));
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
        Turno padrao
        <select
          value={form.turno_padrao}
          onChange={(event) =>
            setForm((current) => ({ ...current, turno_padrao: event.target.value as Turno }))
          }
        >
          <option value="manha">manha</option>
          <option value="tarde">tarde</option>
          <option value="noite">noite</option>
        </select>
      </label>
      <label>
        UC vinculada
        <select
          value={form.uc_id || ucs[0]?.id || 0}
          onChange={(event) => setForm((current) => ({ ...current, uc_id: Number(event.target.value) }))}
        >
          {ucs.map((uc) => (
            <option key={uc.id} value={uc.id}>
              {uc.codigo}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="primary-button" disabled={submitting || ucs.length === 0}>
        {submitting ? "Salvando..." : "Salvar turma"}
      </button>
    </form>
  );
}
