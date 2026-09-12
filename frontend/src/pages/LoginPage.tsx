import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { api } from "../lib/api";
import { storeSession } from "../lib/auth";
import { ApiError } from "../lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const sessao = await api.login(username, senha);
      const usuario = await api.me(sessao.access_token);
      storeSession(sessao.access_token, usuario);
      navigate(usuario.trocar_senha_no_proximo_acesso ? "/trocar-senha" : "/");
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Nao foi possivel entrar agora.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="section-card auth-card">
        <div className="section-card__eyebrow">Acesso local</div>
        <h1>Entrar no sistema</h1>
        <p>Use seu nome de usuário e senha para acessar a escala.</p>
        <form onSubmit={entrar} className="form-stack">
          <label>
            Usuário
            <input value={username} onChange={(event) => setUsername(event.target.value)} required autoComplete="username" />
          </label>
          <label>
            Senha
            <input value={senha} onChange={(event) => setSenha(event.target.value)} required type="password" autoComplete="current-password" />
          </label>
          {erro && <p className="form-error" role="alert">{erro}</p>}
          <button className="primary-button" disabled={enviando} type="submit">
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
