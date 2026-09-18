import { useCallback, useEffect, useState } from "react";

import { api, ApiError } from "../lib/api";
import type { UsuarioAtual } from "../lib/auth";
import type { Professor } from "../types/api";

type NovaSenhaInfo = {
  username: string;
  senha: string;
};

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioAtual[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState<NovaSenhaInfo | null>(null);
  const [carregando, setCarregando] = useState(true);
  // Onda 9 (RF-06): abas de status com contadores.
  const [filtroStatus, setFiltroStatus] = useState<"ativos" | "inativos" | "todos">("ativos");
  const [contadores, setContadores] = useState({ ativos: 0, inativos: 0, todos: 0 });
  // Onda 9 (RF-05): motivo opcional ao desativar.
  const [desativando, setDesativando] = useState<UsuarioAtual | null>(null);
  const [motivoDesativacao, setMotivoDesativacao] = useState("");

  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [funcao, setFuncao] = useState("professor");
  const [senhaTemporaria, setSenhaTemporaria] = useState("");
  const [professorId, setProfessorId] = useState<number | null | "">("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      // Onda 9: busca sempre com tudo para os contadores das abas; exibicao filtra client-side.
      const resposta = await api.listUsuarios(busca ? { busca } : {});
      const itens = resposta.items;
      setContadores({
        ativos: itens.filter((u) => u.ativo).length,
        inativos: itens.filter((u) => !u.ativo).length,
        todos: itens.length,
      });
      const visiveis =
        filtroStatus === "todos"
          ? itens
          : itens.filter((u) => (filtroStatus === "ativos" ? u.ativo : !u.ativo));
      setUsuarios(visiveis);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Nao foi possivel carregar os usuarios.");
    } finally {
      setCarregando(false);
    }
  }, [busca, filtroStatus]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    async function carregarProfessores() {
      try {
        setProfessores(await api.listProfessores());
      } catch {
        // Sem professores o select fica vazio; o vinculo continua possivel depois.
      }
    }
    void carregarProfessores();
  }, []);

  async function criarUsuario(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);
    try {
      const criado = await api.createUsuario({
        nome,
        username,
        funcao,
        senha_temporaria: senhaTemporaria,
        professor_id: funcao === "professor" && professorId !== "" ? professorId : null,
      });
      setNovaSenha({ username: criado.username, senha: senhaTemporaria });
      setNome("");
      setUsername("");
      setFuncao("professor");
      setSenhaTemporaria("");
      setProfessorId("");
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Nao foi possivel criar o usuario.");
    }
  }

  async function alternarAtivo(usuario: UsuarioAtual) {
    // Onda 9 (RF-05): desativacao pede motivo (opcional) via painel; reativacao direta.
    if (usuario.ativo) {
      setDesativando(usuario);
      setMotivoDesativacao("");
      return;
    }
    setErro(null);
    setMensagem(null);
    try {
      await api.updateUsuario(usuario.id, { ativo: true });
      await carregar();
      setMensagem(`Usuario ${usuario.username} reativado.`);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Nao foi possivel reativar o usuario.");
    }
  }

  async function confirmarDesativacao() {
    if (!desativando) return;
    setErro(null);
    setMensagem(null);
    try {
      await api.updateUsuario(desativando.id, {
        ativo: false,
        motivo_desativacao: motivoDesativacao.trim() || null,
      });
      setDesativando(null);
      setMotivoDesativacao("");
      await carregar();
      setMensagem(`Usuario ${desativando.username} desativado. Use a aba 'Inativos' para reativa-lo.`);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Nao foi possivel desativar o usuario.");
      setDesativando(null);
      setMotivoDesativacao("");
    }
  }

  async function excluirUsuario(usuario: UsuarioAtual) {
    // Onda 9 (RF-01): exclusao fisica com confirmacao; 409 tratado com o motivo da API.
    if (!window.confirm(`Excluir DEFINITIVAMENTE o usuario ${usuario.username}? Esta acao nao pode ser desfeita.`)) {
      return;
    }
    setErro(null);
    setMensagem(null);
    try {
      await api.excluirUsuario(usuario.id);
      await carregar();
      setMensagem(`Usuario ${usuario.username} excluido definitivamente.`);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Nao foi possivel excluir o usuario.");
    }
  }

  async function resetarSenha(usuario: UsuarioAtual) {
    setErro(null);
    setMensagem(null);
    const nova = `Temp-${Math.random().toString(36).slice(2, 10)}!`;
    try {
      await api.updateUsuario(usuario.id, { nova_senha_temporaria: nova });
      setNovaSenha({ username: usuario.username, senha: nova });
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Nao foi possivel resetar a senha.");
    }
  }

  async function vincularProfessor(usuario: UsuarioAtual, professorIdNovo: number | null) {
    setErro(null);
    setMensagem(null);
    try {
      await api.updateUsuario(usuario.id, { professor_id: professorIdNovo });
      await carregar();
      setMensagem(
        professorIdNovo
          ? `Usuario ${usuario.username} vinculado ao professor.`
          : `Vinculo do usuario ${usuario.username} removido.`,
      );
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Nao foi possivel vincular o professor.");
    }
  }

  return (
    <div className="page-grid">
      <section className="section-card">
        <div className="section-card__eyebrow">Administracao</div>
        <h2>Usuarios do sistema</h2>
        <p>Somente administradores acessam esta pagina. Novos usuarios recebem senha temporaria e devem troca-la no primeiro acesso.</p>

        <div className="usuarios-toolbar">
          <div className="turno-tabs" role="tablist" aria-label="Filtro de status">
            {(["ativos", "inativos", "todos"] as const).map((valor) => (
              <button
                key={valor}
                type="button"
                role="tab"
                aria-selected={filtroStatus === valor}
                className={`turno-tabs__button${filtroStatus === valor ? " turno-tabs__button--active" : ""}`}
                onClick={() => setFiltroStatus(valor)}
              >
                {valor === "ativos"
                  ? `Ativos (${contadores.ativos})`
                  : valor === "inativos"
                    ? `Inativos (${contadores.inativos})`
                    : `Todos (${contadores.todos})`}
              </button>
            ))}
          </div>
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por username"
            aria-label="Buscar por username"
          />
          <button className="ghost-button" type="button" onClick={() => void carregar()}>
            Atualizar
          </button>
        </div>

        {desativando ? (
          <div className="nova-senha-box" role="dialog" aria-label="Desativar usuario">
            <strong>Desativar {desativando.username}</strong>
            <p>O usuario perde o acesso imediatamente. O login continuara generico para ele.</p>
            <label>
              Motivo (opcional)
              <input
                value={motivoDesativacao}
                onChange={(event) => setMotivoDesativacao(event.target.value)}
                placeholder="desligado, afastamento..."
                maxLength={255}
              />
            </label>
            <div className="exportar-acoes">
              <button className="primary-button" type="button" onClick={() => void confirmarDesativacao()}>
                Confirmar desativacao
              </button>
              <button className="ghost-button" type="button" onClick={() => setDesativando(null)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : null}

        {erro && <p className="form-error" role="alert">{erro}</p>}
        {mensagem && <p className="form-success" role="status">{mensagem}</p>}
        {novaSenha && (
          <div className="nova-senha-box" role="status">
            <strong>Senha temporaria para {novaSenha.username}:</strong> <code>{novaSenha.senha}</code>
            <p>Informe a senha ao usuario. Ela sera trocada no primeiro acesso.</p>
          </div>
        )}

        {carregando ? (
          <p>Carregando usuarios...</p>
        ) : (
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nome</th>
                <th>Funcao</th>
                <th>Professor vinculado</th>
                <th>Situacao</th>
                {filtroStatus !== "ativos" ? (
                  <>
                    <th>Motivo</th>
                    <th>Desativado em</th>
                  </>
                ) : null}
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.username}</td>
                  <td>{usuario.nome}</td>
                  <td>{usuario.funcao}</td>
                  <td>
                    {usuario.funcao === "professor" ? (
                      <select
                        aria-label={`Professor vinculado a ${usuario.username}`}
                        value={usuario.professor_id ?? ""}
                        onChange={(event) =>
                          void vincularProfessor(
                            usuario,
                            event.target.value === "" ? null : Number(event.target.value),
                          )
                        }
                      >
                        <option value="">Sem vinculo</option>
                        {professores.map((professor) => (
                          <option key={professor.id} value={professor.id}>
                            {professor.nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{usuario.ativo ? "Ativo" : "Inativo"}</td>
                  {filtroStatus !== "ativos" ? (
                    <>
                      <td>{usuario.motivo_desativacao ?? "—"}</td>
                      <td>{usuario.desativado_em ? new Date(usuario.desativado_em).toLocaleDateString("pt-BR") : "—"}</td>
                    </>
                  ) : null}
                  <td>
                    <button className="ghost-button" type="button" onClick={() => void alternarAtivo(usuario)}>
                      {usuario.ativo ? "Desativar" : "Reativar"}
                    </button>
                    <button className="ghost-button" type="button" onClick={() => void resetarSenha(usuario)}>
                      Resetar senha
                    </button>
                    <button className="ghost-button" type="button" onClick={() => void excluirUsuario(usuario)}>
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
        <h2>Novo usuario</h2>
        <form onSubmit={criarUsuario} className="form-stack">
          <label>
            Nome
            <input value={nome} onChange={(event) => setNome(event.target.value)} required />
          </label>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} />
          </label>
          <label>
            Funcao
            <select value={funcao} onChange={(event) => setFuncao(event.target.value)}>
              <option value="professor">Professor</option>
              <option value="coordenacao">Coordenacao</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          {funcao === "professor" ? (
            <label>
              Professor vinculado
              <select
                value={professorId ?? ""}
                onChange={(event) =>
                  setProfessorId(event.target.value === "" ? null : Number(event.target.value))
                }
              >
                <option value="">Sem vinculo (dashboard vazio)</option>
                {professores.map((professor) => (
                  <option key={professor.id} value={professor.id}>
                    {professor.nome}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            Senha temporaria
            <input value={senhaTemporaria} onChange={(event) => setSenhaTemporaria(event.target.value)} required minLength={8} type="text" />
          </label>
          <button className="primary-button" type="submit">
            Criar usuario
          </button>
        </form>
      </section>
    </div>
  );
}
