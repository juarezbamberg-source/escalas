import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderApp } from "../test/renderApp";

describe("autenticacao frontend", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("redireciona visitante para login ao acessar uma rota protegida", async () => {
    localStorage.clear();
    renderApp("/", false);
    expect(await screen.findByRole("heading", { name: /entrar no sistema/i })).toBeInTheDocument();
  });

  it("faz login, consulta o usuario e persiste a sessao", async () => {
    const user = userEvent.setup();
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/login")) return Promise.resolve(new Response(JSON.stringify({ access_token: "token", token_type: "bearer", trocar_senha: false }), { status: 200 }));
      if (url.endsWith("/auth/me")) return Promise.resolve(new Response(JSON.stringify({ id: 1, nome: "Admin", username: "admin", funcao: "admin", ativo: true, trocar_senha_no_proximo_acesso: false, professor_id: null }), { status: 200 }));
      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
    }));

    renderApp("/login");
    await user.type(screen.getByLabelText(/usuário/i), "admin");
    await user.type(screen.getByLabelText(/senha/i), "Senha-123!");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText(/visao geral/i)).toBeInTheDocument();
    expect(localStorage.getItem("escalas.access_token")).toBe("token");
  });
});
