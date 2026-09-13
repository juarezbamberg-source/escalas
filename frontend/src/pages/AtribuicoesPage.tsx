import { useCallback, useEffect, useState } from "react";

import { api, ApiError } from "../lib/api";
import type { Atribuicao } from "../types/api";

const HOJE = new Date().toISOString().slice(0, 10);

export function AtribuicoesPage() {
  const [atribuicoes, setAtribuicoes] = useState<Atribuicao[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [professores, setProfessores] = useState<{ id: number; nome: string }[]>([]);
  const [turmas, setTurmas] = useState<{ id: number; codigo: string; uc_id: number }[]>([]);
  const [ucs, setUcs] = useState<{ id: number; codigo: string; nome: string }[]>([]);

  const [professorId, setProfessorId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [ucId, setUcId] = useState("");
  const [dataInicio, setDataInicio] = useState(HOJE);
  const [dataFim, setDataFim] = useState("2026-12-31");
  const [substitutoId, setSubstitutoId] = useState("");
  const [justificativa, setJustificativa] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await api.listAtribuicoes();
      setAtribuicoes(resposta);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Nao foi possivel carregar as atribuicoes.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
    void (async () => {
      try {
        const [professoresResposta, turmasResposta, ucsResposta] = await Promise.all([
          api.listProfessores(),
          api.listTurmas(),
          api.listUcs(),
        ]);
        setProfessores(professoresResposta.map((p) => ({ id: p.id, nome: p.nome })));
        setTurmas(turmasResposta.map((t) => ({ id: t.id, codigo: t.codigo, uc_id: t.uc_id })));
        setUcs(ucsResposta.map((u) => ({ id: u.id, codigo: u.codigo, nome: u.nome })));
      } catch {
        /* referencias ficam vazias; erro ja exibido pelo carregar */
      }
    })();
  }, [carregar]);

  async function criarAtribuicao(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);
    if (!professorId || !turmaId || !ucId) {
      setErro("Selecione professor, turma e UC.");
      return;
    }
    try {
      await api.createAtribuicao({
        professor_id: Number(professorId),
        turma_id: Number(turmaId),
        uc_id: Number(ucId),
        data_inicio: dataInicio,
        data_fim: dataFim,
        professor_substituto_id: substitutoId ? Number(substitutoId) : null,
        justificativa_retroativa: justificativa.trim() || null,
      });
      setMensagem("Atribuicao criada com sucesso.");
      setJustificativa("");
      setSubstitutoId("");
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Nao foi possivel criar a atribuicao.");
    }
  }

  async function excluir(atribuicao: Atribuicao) {
    setErro(null);
    setMensagem(null);
    try {
      await api.deleteAtribuicao(atribuicao.id, true);
      setMensagem(`Atribuicao de ${atribuicao.professor_nome} removida.`);
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Nao foi possivel remover a atribuicao.");
    }
  }

  return (
    <div className="page-grid">
      <section className="section-card">
        <div className="section-card__eyebrow">Coordenacao</div>
        <h2>Atribuicoes de turma/UC</h2>
        <p>
          Atribua professores titulares e substitutos as turmas/UCs com vigencia. Alocacoes novas
          exigem atribuicao ativa na data.
        </p>

        {erro && <p className="form-error" role="alert">{erro}</p>}
        {mensagem && <p className="form-success" role="status">{mensagem}</p>}

        {carregando ? (
          <p>Carregando atribuicoes...</p>
        ) : atribuicoes.length === 0 ? (
          <p>Nenhuma atribuicao cadastrada ainda.</p>
        ) : (
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Professor</th>
                <th>Turma</th>
                <th>UC</th>
                <th>Vigencia</th>
                <th>Substituto</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {atribuicoes.map((atribuicao) => (
                <tr key={atribuicao.id}>
                  <td>{atribuicao.professor_nome}</td>
                  <td>{atribuicao.turma_codigo}</td>
                  <td>{atribuicao.uc_codigo}</td>
                  <td>
                    {atribuicao.data_inicio} a {atribuicao.data_fim}
                  </td>
                  <td>{atribuicao.professor_substituto_nome ?? "-"}</td>
                  <td>
                    <button className="ghost-button" type="button" onClick={() => void excluir(atribuicao)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="section-card">
        <h2>Nova atribuicao</h2>
        <form onSubmit={criarAtribuicao} className="form-stack">
          <label>
            Professor titular
            <select value={professorId} onChange={(event) => setProfessorId(event.target.value)}>
              <option value="">Selecione...</option>
              {professores.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Turma
            <select
              value={turmaId}
              onChange={(event) => {
                setTurmaId(event.target.value);
                const turma = turmas.find((t) => String(t.id) === event.target.value);
                if (turma) setUcId(String(turma.uc_id));
              }}
            >
              <option value="">Selecione...</option>
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.codigo}
                </option>
              ))}
            </select>
          </label>
          <label>
            Unidade curricular
            <select value={ucId} onChange={(event) => setUcId(event.target.value)}>
              <option value="">Selecione...</option>
              {ucs.map((uc) => (
                <option key={uc.id} value={uc.id}>
                  {uc.codigo} — {uc.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Inicio da vigencia
            <input type="date" value={dataInicio} onChange={(event) => setDataInicio(event.target.value)} required />
          </label>
          <label>
            Fim da vigencia
            <input type="date" value={dataFim} onChange={(event) => setDataFim(event.target.value)} required />
          </label>
          <label>
            Professor substituto (opcional)
            <select value={substitutoId} onChange={(event) => setSubstitutoId(event.target.value)}>
              <option value="">Nenhum</option>
              {professores.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Justificativa retroativa (obrigatoria se inicio no passado)
            <textarea value={justificativa} onChange={(event) => setJustificativa(event.target.value)} rows={2} />
          </label>
          <button className="primary-button" type="submit">
            Criar atribuicao
          </button>
        </form>
      </section>
    </div>
  );
}
