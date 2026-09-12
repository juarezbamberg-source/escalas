import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { api } from "../lib/api";
import { getStoredToken, getStoredUser, storeSession } from "../lib/auth";

export function TrocarSenhaPage() {
  const navigate = useNavigate();
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const usuario = getStoredUser();

  async function salvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const token = getStoredToken();
      if (!token) throw new Error("Sessao expirada.");
      const resposta = await api.trocarSenha(token, atual, nova);
      storeSession(token, resposta.usuario);
      navigate("/");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Nao foi possivel trocar a senha.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="section-card auth-card">
        <div className="section-card__eyebrow">Primeiro acesso</div>
        <h1>Troque sua senha</h1>
        <p>{usuario?.nome ?? "Sua conta"} precisa definir uma senha pessoal antes de continuar.</p>
        <form onSubmit={salvar} className="form-stack">
          <label>Senha atual<input value={atual} onChange={(event) => setAtual(event.target.value)} type="password" required /></label>
          <label>Nova senha<input value={nova} onChange={(event) => setNova(event.target.value)} type="password" minLength={8} required /></label>
          {erro && <p className="form-error" role="alert">{erro}</p>}
          <button className="primary-button" disabled={enviando} type="submit">{enviando ? "Salvando..." : "Salvar nova senha"}</button>
        </form>
      </section>
    </main>
  );
}
