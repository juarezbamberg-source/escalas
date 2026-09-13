import { useCallback, useEffect, useState } from "react";

import { api, ApiError } from "../lib/api";
import type { UsuarioAtual } from "../lib/auth";

type NovaSenhaInfo = {
  username: string;
  senha: string;
};

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioAtual[]>([]);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState<NovaSenhaInfo | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [funcao, setFuncao] = useState("professor");
  const [senhaTemporaria, setSenhaTemporaria] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await api.listUsuarios(busca ? { busca } : {});
      setUsuarios(resposta.items);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Nao foi possivel carregar os usuarios.");
    } finally {
      setCarregando(false);
    }
  }, [busca]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function criarUsuario(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);
    try {
      const criado = await api.createUsuario({ nome, username, funcao, senha_temporaria: senhaTemporaria });
      setNovaSenha({ username: criado.username, senha: senhaTemporaria });
      setNome("");
      setUsername("");
      setFuncao("professor");
      setSenhaTemporaria("");
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Nao foi possivel criar o usuario.");
    }
  }

  async function alternarAtivo(usuario: UsuarioAtual) {
    setErro(null);
    setMensagem(null);
    try {
      await api.updateUsuario(usuario.id, { ativo: !usuario.ativo });
      await carregar();
      setMensagem(`Usuario ${usuario.username} ${usuario.ativo ? "desativado" : "reativado"}.`);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Nao foi possivel atualizar o usuario.");
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

  return (
    <div className="page-grid">
      <section className="section-card">
        <div className="section-card__eyebrow">Administracao</div>
        <h2>Usuarios do sistema</h2>
        <p>Somente administradores acessam esta pagina. Novos usuarios recebem senha temporaria e devem troca-la no primeiro acesso.</p>

        <div className="usuarios-toolbar">
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
                <th>Situacao</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.username}</td>
                  <td>{usuario.nome}</td>
                  <td>{usuario.funcao}</td>
                  <td>{usuario.ativo ? "Ativo" : "Inativo"}</td>
                  <td>
                    <button className="ghost-button" type="button" onClick={() => void alternarAtivo(usuario)}>
                      {usuario.ativo ? "Desativar" : "Reativar"}
                    </button>
                    <button className="ghost-button" type="button" onClick={() => void resetarSenha(usuario)}>
                      Resetar senha
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
