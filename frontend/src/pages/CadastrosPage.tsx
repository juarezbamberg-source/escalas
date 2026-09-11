import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { useAppStatus } from "../app/AppStatusContext";
import { SectionCard } from "../components/SectionCard";
import { api } from "../lib/api";
import { readActionContext, type ActionContext, type ActionMode } from "../lib/actionContext";
import { readErrorMessage } from "../lib/errors";
import { formatDate } from "../lib/format";
import type {
  Alocacao,
  AlocacaoBulkCreateResponse,
  Contratacao,
  Professor,
  Turma,
  Turno,
  UnidadeCurricular,
} from "../types/api";

type ReferenceData = {
  professores: Professor[];
  ucs: UnidadeCurricular[];
  turmas: Turma[];
};

type BulkRecurringForm = {
  turma_id: number;
  data_inicial: string;
  data_final: string;
  turnos: Turno[];
  dias_da_semana: number[];
  professor_titular_id: number;
  professor_substituto_id: number;
  liberar_fim_de_semana: boolean;
  override: boolean;
  justificativa_override: string;
};

const initialProfessor = { nome: "", contratacao: "CLT" as Contratacao };
const initialUc = { codigo: "", nome: "", carga_horaria: 60 };
const initialTurma = { codigo: "", nome: "", turno_padrao: "manha" as Turno, uc_id: 0 };
const initialAlocacao = {
  turma_id: 0,
  data: "",
  turno: "manha" as Turno,
  professor_titular_id: 0,
  professor_substituto_id: 0,
  liberar_fim_de_semana: false,
  override: false,
  justificativa_override: "",
};
const initialBulkRecurring: BulkRecurringForm = {
  turma_id: 0,
  data_inicial: "",
  data_final: "",
  turnos: ["manha"],
  dias_da_semana: [],
  professor_titular_id: 0,
  professor_substituto_id: 0,
  liberar_fim_de_semana: false,
  override: false,
  justificativa_override: "",
};
const weekdays = [
  { value: 0, label: "Seg" },
  { value: 1, label: "Ter" },
  { value: 2, label: "Qua" },
  { value: 3, label: "Qui" },
  { value: 4, label: "Sex" },
  { value: 5, label: "Sab" },
  { value: 6, label: "Dom" },
];
const turnosDisponiveis: Turno[] = ["manha", "tarde", "noite"];

function isWeekendDate(value: string) {
  if (!value) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekDay = date.getDay();
  return weekDay === 0 || weekDay === 6;
}

export function CadastrosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    professores: [],
    ucs: [],
    turmas: [],
  });
  const [recentAllocation, setRecentAllocation] = useState<Alocacao | null>(null);
  const [recentBulkPreview, setRecentBulkPreview] = useState<AlocacaoBulkCreateResponse | null>(
    null,
  );
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [professorForm, setProfessorForm] = useState(initialProfessor);
  const [ucForm, setUcForm] = useState(initialUc);
  const [turmaForm, setTurmaForm] = useState(initialTurma);
  const [alocacaoForm, setAlocacaoForm] = useState(initialAlocacao);
  const [bulkForm, setBulkForm] = useState<BulkRecurringForm>(initialBulkRecurring);
  const [appliedPreset, setAppliedPreset] = useState("");
  const { startLoading, stopLoading, showError, showSuccess } = useAppStatus();

  const actionContext = readActionContext(searchParams);

  useEffect(() => {
    void refreshReferences();
  }, []);

  useEffect(() => {
    const presetKey = searchParams.toString();

    if (!presetKey || presetKey === appliedPreset) {
      return;
    }

    if (referenceData.turmas.length === 0 || referenceData.professores.length === 0) {
      return;
    }

    setAlocacaoForm((current) => {
      const turmaId = actionContext.turmaId ?? current.turma_id ?? referenceData.turmas[0]?.id ?? 0;
      const titularId =
        actionContext.titularId ??
        current.professor_titular_id ??
        referenceData.professores[0]?.id ??
        0;
      const substitutoId =
        actionContext.action === "substituir"
          ? (actionContext.substitutoId ?? 0)
          : current.professor_substituto_id;

      return {
        ...current,
        turma_id: turmaId,
        data: actionContext.data || current.data,
        turno: (actionContext.turno || current.turno || "manha") as Turno,
        professor_titular_id: titularId,
        professor_substituto_id: substitutoId,
        override: actionContext.action === "override" ? true : current.override,
        justificativa_override: current.justificativa_override,
      };
    });

    setBulkForm((current) => ({
      ...current,
      turma_id: actionContext.turmaId ?? current.turma_id ?? referenceData.turmas[0]?.id ?? 0,
      professor_titular_id:
        actionContext.titularId ??
        current.professor_titular_id ??
        referenceData.professores[0]?.id ??
        0,
      professor_substituto_id: actionContext.substitutoId ?? current.professor_substituto_id,
    }));

    setAppliedPreset(presetKey);
  }, [actionContext, appliedPreset, referenceData.professores, referenceData.turmas, searchParams]);

  async function refreshReferences() {
    startLoading();
    try {
      const [professores, ucs, turmas] = await Promise.all([
        api.listProfessores(),
        api.listUcs(),
        api.listTurmas(),
      ]);
      setReferenceData({ professores, ucs, turmas });
      setTurmaForm((current) => ({ ...current, uc_id: current.uc_id || ucs[0]?.id || 0 }));
      setAlocacaoForm((current) => ({
        ...current,
        turma_id: current.turma_id || turmas[0]?.id || 0,
        professor_titular_id: current.professor_titular_id || professores[0]?.id || 0,
      }));
      setBulkForm((current) => ({
        ...current,
        turma_id: current.turma_id || turmas[0]?.id || 0,
        professor_titular_id: current.professor_titular_id || professores[0]?.id || 0,
      }));
    } catch (error) {
      showError(readErrorMessage(error));
    } finally {
      stopLoading();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>, action: () => Promise<void>) {
    event.preventDefault();
    startLoading();
    try {
      await action();
    } catch (error) {
      showError(readErrorMessage(error));
    } finally {
      stopLoading();
    }
  }

  async function handleDeleteAllocation() {
    if (!actionContext.alocacaoId) {
      return;
    }

    startLoading();
    try {
      await api.deleteAlocacao(actionContext.alocacaoId, true);
      setRecentAllocation(null);
      showSuccess("Alocacao removida com sucesso.");
      setSearchParams(new URLSearchParams());
    } catch (error) {
      showError(readErrorMessage(error));
    } finally {
      stopLoading();
    }
  }

  async function handlePreviewRecurring() {
    setBulkSubmitting(true);
    try {
      const preview = await api.createAlocacoesRecorrentes({
        turma_id: bulkForm.turma_id,
        data_inicial: bulkForm.data_inicial,
        data_final: bulkForm.data_final,
        turnos: bulkForm.turnos,
        dias_da_semana: bulkForm.dias_da_semana,
        professor_titular_id: bulkForm.professor_titular_id,
        professor_substituto_id: bulkForm.professor_substituto_id || null,
        liberar_fim_de_semana: bulkForm.liberar_fim_de_semana,
        override: bulkForm.override,
        justificativa_override: bulkForm.override ? bulkForm.justificativa_override : null,
        confirmar: false,
      });
      setRecentBulkPreview(preview);
      showSuccess("Preview do lote recorrente atualizado.");
    } catch (error) {
      showError(readErrorMessage(error));
    } finally {
      setBulkSubmitting(false);
    }
  }

  async function handleConfirmRecurring() {
    setBulkSubmitting(true);
    try {
      const result = await api.createAlocacoesRecorrentes({
        turma_id: bulkForm.turma_id,
        data_inicial: bulkForm.data_inicial,
        data_final: bulkForm.data_final,
        turnos: bulkForm.turnos,
        dias_da_semana: bulkForm.dias_da_semana,
        professor_titular_id: bulkForm.professor_titular_id,
        professor_substituto_id: bulkForm.professor_substituto_id || null,
        liberar_fim_de_semana: bulkForm.liberar_fim_de_semana,
        override: bulkForm.override,
        justificativa_override: bulkForm.override ? bulkForm.justificativa_override : null,
        confirmar: true,
      });
      setRecentBulkPreview(result);
      setBulkForm((current) => ({
        ...current,
        data_inicial: "",
        data_final: "",
        dias_da_semana: [],
        justificativa_override: current.override ? current.justificativa_override : "",
      }));
      showSuccess(`${result.total_criados} alocacao(oes) recorrente(s) criada(s) com sucesso.`);
    } catch (error) {
      showError(readErrorMessage(error));
    } finally {
      setBulkSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <SectionCard eyebrow="Base da operacao" title="Cadastros iniciais">
        <p>
          Cadastre professores, unidades curriculares, turmas, alocacoes isoladas e lancamentos
          recorrentes sem sair da aplicacao.
        </p>
      </SectionCard>

      {actionContext.action ? (
        <SectionCard eyebrow="Fluxo assistido" title="Acao contextual da escala">
          <div className="guided-panel">
            <div className="guided-panel__content">
              <strong>{actionTitle(actionContext.action)}</strong>
              <p>{actionDescription(actionContext)}</p>
              <div className="status-badges">
                {actionContext.turno ? (
                  <span className="status-badge">Turno: {actionContext.turno}</span>
                ) : null}
                {actionContext.data ? (
                  <span className="status-badge">Data: {actionContext.data}</span>
                ) : null}
                {actionContext.turmaId ? (
                  <span className="status-badge">
                    Turma: {findTurmaCode(referenceData, actionContext.turmaId)}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="guided-panel__actions">
              <Link to="/escala" className="ghost-button">
                Voltar para escala
              </Link>
              {actionContext.action === "remover" ? (
                <button type="button" className="primary-button" onClick={handleDeleteAllocation}>
                  Confirmar remocao
                </button>
              ) : null}
            </div>
          </div>
        </SectionCard>
      ) : null}

      <div className="two-column-grid">
        <SectionCard eyebrow="Professores" title="Cadastro de docentes">
          <form
            className="form-grid"
            onSubmit={(event) =>
              handleSubmit(event, async () => {
                await api.createProfessor(professorForm);
                setProfessorForm(initialProfessor);
                await refreshReferences();
                showSuccess("Professor cadastrado com sucesso.");
              })
            }
          >
            <label>
              Nome
              <input
                value={professorForm.nome}
                onChange={(event) =>
                  setProfessorForm((current) => ({ ...current, nome: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Contratacao
              <select
                value={professorForm.contratacao}
                onChange={(event) =>
                  setProfessorForm((current) => ({
                    ...current,
                    contratacao: event.target.value as Contratacao,
                  }))
                }
              >
                <option value="PF">PF</option>
                <option value="CLT">CLT</option>
                <option value="PJ">PJ</option>
              </select>
            </label>
            <button type="submit" className="primary-button">
              Salvar professor
            </button>
          </form>
          <ul className="data-list">
            {referenceData.professores.map((professor) => (
              <li key={professor.id}>
                <strong>{professor.nome}</strong>
                <span>{professor.contratacao}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard eyebrow="Unidades curriculares" title="Cadastro de UCs">
          <form
            className="form-grid"
            onSubmit={(event) =>
              handleSubmit(event, async () => {
                await api.createUc(ucForm);
                setUcForm(initialUc);
                await refreshReferences();
                showSuccess("UC cadastrada com sucesso.");
              })
            }
          >
            <label>
              Codigo
              <input
                value={ucForm.codigo}
                onChange={(event) =>
                  setUcForm((current) => ({ ...current, codigo: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Nome
              <input
                value={ucForm.nome}
                onChange={(event) =>
                  setUcForm((current) => ({ ...current, nome: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Carga horaria
              <input
                type="number"
                min={1}
                value={ucForm.carga_horaria}
                onChange={(event) =>
                  setUcForm((current) => ({
                    ...current,
                    carga_horaria: Number(event.target.value),
                  }))
                }
                required
              />
            </label>
            <button type="submit" className="primary-button">
              Salvar UC
            </button>
          </form>
          <ul className="data-list">
            {referenceData.ucs.map((uc) => (
              <li key={uc.id}>
                <strong>{uc.codigo}</strong>
                <span>{uc.nome}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="two-column-grid">
        <SectionCard eyebrow="Turmas" title="Cadastro de turmas">
          <form
            className="form-grid"
            onSubmit={(event) =>
              handleSubmit(event, async () => {
                await api.createTurma(turmaForm);
                setTurmaForm((current) => ({
                  ...initialTurma,
                  uc_id: current.uc_id,
                }));
                await refreshReferences();
                showSuccess("Turma cadastrada com sucesso.");
              })
            }
          >
            <label>
              Codigo
              <input
                value={turmaForm.codigo}
                onChange={(event) =>
                  setTurmaForm((current) => ({ ...current, codigo: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Nome
              <input
                value={turmaForm.nome}
                onChange={(event) =>
                  setTurmaForm((current) => ({ ...current, nome: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Turno padrao
              <select
                value={turmaForm.turno_padrao}
                onChange={(event) =>
                  setTurmaForm((current) => ({
                    ...current,
                    turno_padrao: event.target.value as Turno,
                  }))
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
                value={turmaForm.uc_id}
                onChange={(event) =>
                  setTurmaForm((current) => ({ ...current, uc_id: Number(event.target.value) }))
                }
              >
                {referenceData.ucs.map((uc) => (
                  <option key={uc.id} value={uc.id}>
                    {uc.codigo}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="primary-button"
              disabled={referenceData.ucs.length === 0}
            >
              Salvar turma
            </button>
          </form>
          <ul className="data-list">
            {referenceData.turmas.map((turma) => (
              <li key={turma.id}>
                <strong>{turma.codigo}</strong>
                <span>{turma.turno_padrao}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard eyebrow="Alocacoes" title="Registrar nova alocacao">
          {actionContext.action === "alocar" ||
          actionContext.action === "substituir" ||
          actionContext.action === "override" ? (
            <div className="guided-note">
              <strong>Formulario guiado pelo contexto</strong>
              <p>{formGuidance(actionContext.action)}</p>
            </div>
          ) : null}
          <form
            className="form-grid"
            onSubmit={(event) =>
              handleSubmit(event, async () => {
                const created = await api.createAlocacao({
                  turma_id: alocacaoForm.turma_id,
                  data: alocacaoForm.data,
                  turno: alocacaoForm.turno,
                  professor_titular_id: alocacaoForm.professor_titular_id,
                  professor_substituto_id: alocacaoForm.professor_substituto_id || null,
                  liberar_fim_de_semana: alocacaoForm.liberar_fim_de_semana,
                  override: alocacaoForm.override,
                  justificativa_override: alocacaoForm.override
                    ? alocacaoForm.justificativa_override
                    : null,
                });
                setRecentAllocation(buildRecentAllocation(created, alocacaoForm, referenceData));
                setAlocacaoForm((current) => ({
                  ...initialAlocacao,
                  turno: current.turno,
                  turma_id: current.turma_id,
                  professor_titular_id: current.professor_titular_id,
                }));
                showSuccess("Alocacao salva com sucesso.");
              })
            }
          >
            <label>
              Data
              <input
                type="date"
                value={alocacaoForm.data}
                onChange={(event) =>
                  setAlocacaoForm((current) => ({ ...current, data: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Turno
              <select
                value={alocacaoForm.turno}
                onChange={(event) =>
                  setAlocacaoForm((current) => ({ ...current, turno: event.target.value as Turno }))
                }
              >
                <option value="manha">manha</option>
                <option value="tarde">tarde</option>
                <option value="noite">noite</option>
              </select>
            </label>
            <label>
              Turma
              <select
                value={alocacaoForm.turma_id}
                onChange={(event) =>
                  setAlocacaoForm((current) => ({
                    ...current,
                    turma_id: Number(event.target.value),
                  }))
                }
              >
                {referenceData.turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.codigo}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Professor titular
              <select
                value={alocacaoForm.professor_titular_id}
                onChange={(event) =>
                  setAlocacaoForm((current) => ({
                    ...current,
                    professor_titular_id: Number(event.target.value),
                  }))
                }
              >
                {referenceData.professores.map((professor) => (
                  <option key={professor.id} value={professor.id}>
                    {professor.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Professor substituto
              <select
                value={alocacaoForm.professor_substituto_id}
                onChange={(event) =>
                  setAlocacaoForm((current) => ({
                    ...current,
                    professor_substituto_id: Number(event.target.value),
                  }))
                }
              >
                <option value={0}>Sem substituto</option>
                {referenceData.professores.map((professor) => (
                  <option key={professor.id} value={professor.id}>
                    {professor.nome}
                  </option>
                ))}
              </select>
            </label>
            {isWeekendDate(alocacaoForm.data) ? (
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={alocacaoForm.liberar_fim_de_semana}
                  onChange={(event) =>
                    setAlocacaoForm((current) => ({
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
                checked={alocacaoForm.override}
                onChange={(event) =>
                  setAlocacaoForm((current) => ({ ...current, override: event.target.checked }))
                }
              />
              Registrar override
            </label>
            {alocacaoForm.override ? (
              <label>
                Justificativa do override
                <textarea
                  value={alocacaoForm.justificativa_override}
                  onChange={(event) =>
                    setAlocacaoForm((current) => ({
                      ...current,
                      justificativa_override: event.target.value,
                    }))
                  }
                  required
                />
              </label>
            ) : null}
            <button
              type="submit"
              className="primary-button"
              disabled={referenceData.professores.length === 0 || referenceData.turmas.length === 0}
            >
              Salvar alocacao
            </button>
          </form>

          {recentAllocation ? (
            <div className="recent-allocation">
              <strong>Ultima alocacao registrada</strong>
              <p>
                {recentAllocation.turma_codigo} • {recentAllocation.professor_titular_nome}
              </p>
            </div>
          ) : (
            <p className="state-message">Assim que voce salvar uma alocacao, ela aparecera aqui.</p>
          )}
        </SectionCard>
      </div>

      <SectionCard eyebrow="Cadastro em lote" title="Lancamento recorrente por dias da semana">
        <div className="guided-note">
          <strong>Fluxo para nova UC em operacao</strong>
          <p>
            Escolha turma, professor, periodo, dias da semana e turnos para gerar o cronograma
            recorrente com preview antes de gravar.
          </p>
        </div>

        <div className="form-grid">
          <label>
            Turma do lote
            <select
              value={bulkForm.turma_id}
              onChange={(event) =>
                setBulkForm((current) => ({ ...current, turma_id: Number(event.target.value) }))
              }
            >
              {referenceData.turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.codigo}
                </option>
              ))}
            </select>
          </label>
          <label>
            Professor titular do lote
            <select
              value={bulkForm.professor_titular_id}
              onChange={(event) =>
                setBulkForm((current) => ({
                  ...current,
                  professor_titular_id: Number(event.target.value),
                }))
              }
            >
              {referenceData.professores.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Professor substituto do lote
            <select
              value={bulkForm.professor_substituto_id}
              onChange={(event) =>
                setBulkForm((current) => ({
                  ...current,
                  professor_substituto_id: Number(event.target.value),
                }))
              }
            >
              <option value={0}>Sem substituto</option>
              {referenceData.professores.map((professor) => (
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
              value={bulkForm.data_inicial}
              onChange={(event) =>
                setBulkForm((current) => ({ ...current, data_inicial: event.target.value }))
              }
            />
          </label>
          <label>
            Data final do lote
            <input
              type="date"
              value={bulkForm.data_final}
              onChange={(event) =>
                setBulkForm((current) => ({ ...current, data_final: event.target.value }))
              }
            />
          </label>
          <div className="filter-group__wide">
            <span className="person-role__label">Turnos do lote</span>
            <div className="chip-row">
              {turnosDisponiveis.map((turno) => (
                <button
                  key={turno}
                  type="button"
                  className={`filter-chip${bulkForm.turnos.includes(turno) ? " filter-chip--active" : ""}`}
                  aria-pressed={bulkForm.turnos.includes(turno)}
                  onClick={() =>
                    setBulkForm((current) => ({
                      ...current,
                      turnos: current.turnos.includes(turno)
                        ? current.turnos.filter((item) => item !== turno)
                        : [...current.turnos, turno],
                    }))
                  }
                >
                  {turno}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group__wide">
            <span className="person-role__label">Dias da semana</span>
            <div className="chip-row">
              {weekdays.map((weekday) => (
                <button
                  key={weekday.value}
                  type="button"
                  className={`filter-chip${bulkForm.dias_da_semana.includes(weekday.value) ? " filter-chip--active" : ""}`}
                  aria-pressed={bulkForm.dias_da_semana.includes(weekday.value)}
                  onClick={() =>
                    setBulkForm((current) => ({
                      ...current,
                      dias_da_semana: current.dias_da_semana.includes(weekday.value)
                        ? current.dias_da_semana.filter((item) => item !== weekday.value)
                        : [...current.dias_da_semana, weekday.value],
                    }))
                  }
                >
                  {weekday.label}
                </button>
              ))}
            </div>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={bulkForm.liberar_fim_de_semana}
              onChange={(event) =>
                setBulkForm((current) => ({
                  ...current,
                  liberar_fim_de_semana: event.target.checked,
                }))
              }
            />
            Liberar fins de semana para atividade extracurricular
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={bulkForm.override}
              onChange={(event) =>
                setBulkForm((current) => ({ ...current, override: event.target.checked }))
              }
            />
            Permitir override recorrente
          </label>
          {bulkForm.override ? (
            <label className="filter-group__wide">
              Justificativa do override recorrente
              <textarea
                value={bulkForm.justificativa_override}
                onChange={(event) =>
                  setBulkForm((current) => ({
                    ...current,
                    justificativa_override: event.target.value,
                  }))
                }
              />
            </label>
          ) : null}
        </div>

        <div className="guided-panel__actions">
          <button
            type="button"
            className="ghost-button"
            onClick={() => void handlePreviewRecurring()}
            disabled={
              bulkSubmitting ||
              referenceData.professores.length === 0 ||
              referenceData.turmas.length === 0
            }
          >
            {bulkSubmitting ? "Processando..." : "Validar preview do lote"}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => void handleConfirmRecurring()}
            disabled={bulkSubmitting || !recentBulkPreview || recentBulkPreview.total_validos === 0}
          >
            Confirmar cadastro recorrente
          </button>
        </div>

        {recentBulkPreview ? (
          <div className="bulk-panel">
            <div className="bulk-panel__header">
              <div>
                <p className="bulk-panel__eyebrow">Preview recorrente</p>
                <strong>{recentBulkPreview.total_previsto} item(ns) previsto(s)</strong>
              </div>
              <div className="status-badges">
                <span className="status-badge">Validos: {recentBulkPreview.total_validos}</span>
                <span className="status-badge">
                  Bloqueados: {recentBulkPreview.total_bloqueados}
                </span>
                <span className="status-badge">Criados: {recentBulkPreview.total_criados}</span>
              </div>
            </div>

            {recentBulkPreview.itens_validos.length > 0 ? (
              <div className="guided-note">
                <strong>Itens prontos para gravar</strong>
                <div className="bulk-preview-list">
                  {recentBulkPreview.itens_validos.map((item) => (
                    <span key={`valido-${item.turno}-${item.data}`} className="status-badge">
                      {item.turma_codigo} • {formatDate(item.data)} • {item.turno}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {recentBulkPreview.itens_bloqueados.length > 0 ? (
              <div className="warning-panel">
                <strong>Itens bloqueados antes da gravacao</strong>
                <ul className="warning-list">
                  {recentBulkPreview.itens_bloqueados.map((item) => (
                    <li key={`bloqueado-${item.turno}-${item.data}`}>
                      {item.turma_codigo} • {formatDate(item.data)} • {item.turno}: {item.motivo}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="state-message">
            Valide o lote para conferir datas geradas, conflitos e itens prontos para gravar.
          </p>
        )}
      </SectionCard>
    </div>
  );
}

function buildRecentAllocation(
  created: Alocacao,
  form: typeof initialAlocacao,
  referenceData: ReferenceData,
): Alocacao {
  const turma = referenceData.turmas.find((item) => item.id === form.turma_id);
  const titular = referenceData.professores.find((item) => item.id === form.professor_titular_id);
  const substituto = referenceData.professores.find(
    (item) => item.id === form.professor_substituto_id,
  );

  return {
    ...created,
    turma_id: created.turma_id ?? form.turma_id,
    turma_codigo: created.turma_codigo || turma?.codigo || "Turma recem-salva",
    data: created.data ?? form.data,
    turno: created.turno ?? form.turno,
    professor_titular_id: created.professor_titular_id ?? form.professor_titular_id,
    professor_titular_nome: created.professor_titular_nome || titular?.nome || "Professor titular",
    professor_substituto_id:
      created.professor_substituto_id ??
      (form.professor_substituto_id ? form.professor_substituto_id : null),
    professor_substituto_nome:
      created.professor_substituto_nome ??
      (form.professor_substituto_id ? substituto?.nome || null : null),
    forcada: created.forcada ?? form.override,
    justificativa_override:
      created.justificativa_override ?? (form.override ? form.justificativa_override : null),
  };
}

function actionTitle(action: ActionMode) {
  const titles: Record<ActionMode, string> = {
    alocar: "Nova alocacao a partir do recorte ativo",
    substituir: "Substituicao guiada pela escala",
    override: "Override com justificativa assistida",
    remover: "Remocao contextual da alocacao",
  };
  return titles[action];
}

function actionDescription(actionContext: ActionContext) {
  switch (actionContext.action) {
    case "alocar":
      return "O formulario abaixo ja foi preparado com turno, data e turma do recorte selecionado.";
    case "substituir":
      return "Use o formulario abaixo para registrar um substituto sem perder o contexto da escala.";
    case "override":
      return "O formulario abaixo abre com override habilitado para registrar a justificativa exigida pela regra de negocio.";
    case "remover":
      return "Esta remocao usa a API de exclusao da alocacao e exige confirmacao explicita.";
    default:
      return "";
  }
}

function formGuidance(action: Exclude<ActionMode, "remover">) {
  if (action === "substituir") {
    return "Revise titular e substituto antes de salvar. A API continua bloqueando titular igual ao substituto.";
  }
  if (action === "override") {
    return "Preencha uma justificativa com pelo menos 10 caracteres para concluir o override.";
  }
  return "Ajuste apenas o necessario e salve a alocacao mantendo o recorte trazido da tela de escala.";
}

function findTurmaCode(referenceData: ReferenceData, turmaId: number) {
  return referenceData.turmas.find((turma) => turma.id === turmaId)?.codigo ?? `#${turmaId}`;
}
