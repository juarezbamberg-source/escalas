import type { Funcao } from "../types/api";

export type UsuarioAtual = {
  id: number;
  nome: string;
  username: string;
  funcao: Funcao;
  ativo: boolean;
  trocar_senha_no_proximo_acesso: boolean;
  professor_id: number | null;
};

const TOKEN_KEY = "escalas.access_token";
const USER_KEY = "escalas.usuario";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): UsuarioAtual | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UsuarioAtual;
  } catch {
    return null;
  }
}

export function storeSession(token: string, user: UsuarioAtual) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
