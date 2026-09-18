import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderApp } from "../test/renderApp";
import { storeSession } from "../lib/auth";

const usuarioAdmin = {
  id: 1,
  nome: "Admin Teste",
  username: "admin_fixture",
  funcao: "admin",
  ativo: true,
  trocar_senha_no_proximo_acesso: false,
  professor_id: null,
};

describe("UsuariosPage", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  function stubApi(respostas: Record<string, unknown>) {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        for (const trecho of Object.keys(respostas)) {
          if (url.includes(trecho)) {
            return Promise.resolve(new Response(JSON.stringify(respostas[trecho]), { status: 200 }));
          }
        }
        if (url.includes("/professores")) {
          return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
        }
        return Promise.resolve(new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 }));
      }),
    );
  }

  it("lista usuarios e cria um novo com senha temporaria", async () => {
    const user = userEvent.setup();
    const chamadas: { url: string; method: string; body?: unknown }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";
        chamadas.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
        if (method === "GET" && url.includes("/professores")) {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                { id: 5, nome: "Professora Ana Silva", contratacao: "CLT", ativo: true },
              ]),
              { status: 200 },
            ),
          );
        }
        if (method === "POST" && url.includes("/usuarios")) {
          return Promise.resolve(
            new Response(JSON.stringify({ ...usuarioAdmin, id: 2, username: "ana" }), { status: 201 }),
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify({ items: [usuarioAdmin], total: 1 }), { status: 200 }),
        );
      }),
    );

    renderApp("/usuarios");

    expect(await screen.findByText("admin_fixture")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^nome$/i), "Professora Ana");
    await user.type(screen.getByLabelText(/^username$/i), "ana");
    await user.selectOptions(screen.getByLabelText(/^funcao$/i), "professor");
    await user.selectOptions(screen.getByLabelText(/professor vinculado$/i), "5");
    await user.type(screen.getByLabelText(/senha temporaria/i), "Senha-Temp-123!");
    await user.click(screen.getByRole("button", { name: /criar usuario/i }));

    expect(await screen.findByText(/senha temporaria para/i)).toBeInTheDocument();
    const post = chamadas.find((c) => c.method === "POST" && c.url.includes("/usuarios"));
    expect(post?.body).toMatchObject({ professor_id: 5 });
  });

  it("nao exibe o menu de usuarios para funcao professor", () => {
    localStorage.clear();
    storeSession("token-professor", {
      id: 2,
      nome: "Professor Teste",
      username: "professor_fixture",
      funcao: "professor",
      ativo: true,
      trocar_senha_no_proximo_acesso: false,
      professor_id: null,
    });
    stubApi({});
    renderApp("/", false);
    expect(screen.queryByRole("link", { name: /usuarios/i })).not.toBeInTheDocument();
  });
});
