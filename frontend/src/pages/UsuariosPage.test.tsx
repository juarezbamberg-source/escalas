import { screen, waitFor } from "@testing-library/react";
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

  it("nao exibe o menu de usuarios para coordenacao (RF-07)", () => {
    localStorage.clear();
    storeSession("token-coord", {
      id: 3,
      nome: "Coordenacao Teste",
      username: "coord_fixture",
      funcao: "coordenacao",
      ativo: true,
      trocar_senha_no_proximo_acesso: false,
      professor_id: null,
    });
    stubApi({});
    renderApp("/", false);
    expect(screen.queryByRole("link", { name: /usuarios/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /atribuicoes/i })).toBeInTheDocument();
  });

  it("desativa com motivo e exibe na aba Inativos (RF-05, RF-08)", async () => {
    const user = userEvent.setup();
    const inativo = {
      id: 5,
      nome: "Usuario Desligado",
      username: "desligado",
      funcao: "professor",
      ativo: false,
      trocar_senha_no_proximo_acesso: false,
      professor_id: null,
      motivo_desativacao: "desligado da instituicao",
      desativado_em: "2026-09-18T12:00:00Z",
    };
    let patchBody: Record<string, unknown> | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";
        if (method === "GET" && url.includes("/professores")) {
          return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
        }
        if (method === "GET" && url.includes("/usuarios")) {
          return Promise.resolve(
            new Response(JSON.stringify({ items: [usuarioAdmin, inativo], total: 2 }), { status: 200 }),
          );
        }
        if (method === "PATCH" && url.includes("/usuarios/")) {
          patchBody = JSON.parse(String(init?.body ?? "{}"));
          return Promise.resolve(new Response(JSON.stringify({ ...usuarioAdmin }), { status: 200 }));
        }
        return Promise.resolve(new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 }));
      }),
    );

    renderApp("/usuarios");

    expect(await screen.findByText("admin_fixture")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Ativos \(1\)$/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Inativos \(1\)$/i })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^Inativos \(/i }));
    expect(await screen.findByText("desligado")).toBeInTheDocument();
    expect(screen.getByText("18/09/2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Reativar$/i })).toBeInTheDocument();

    // Fluxo de desativacao com motivo (via aba Todos)
    await user.click(screen.getByRole("tab", { name: /^Todos \(/i }));
    const desativar = screen.getAllByRole("button", { name: /^Desativar$/i })[0];
    await user.click(desativar);
    await user.type(screen.getByLabelText(/motivo \(opcional\)/i), "afastamento");
    await user.click(screen.getByRole("button", { name: /confirmar desativacao/i }));

    await waitFor(() => {
      expect(patchBody).toMatchObject({ ativo: false, motivo_desativacao: "afastamento" });
    });
  });

  it("exclui usuario com confirmacao e trata 409 (RF-01)", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";
        if (method === "GET" && url.includes("/professores")) {
          return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
        }
        if (method === "GET" && url.includes("/usuarios")) {
          return Promise.resolve(
            new Response(JSON.stringify({ items: [usuarioAdmin], total: 1 }), { status: 200 }),
          );
        }
        if (method === "DELETE" && url.includes("/usuarios/")) {
          return Promise.resolve(
            new Response(JSON.stringify({ detail: "Professor vinculado tem 3 alocacao(oes) registradas." }), {
              status: 409,
            }),
          );
        }
        return Promise.resolve(new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 }));
      }),
    );

    renderApp("/usuarios");

    expect(await screen.findByText("admin_fixture")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Excluir$/i }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(await screen.findByText(/alocacao\(oes\) registradas/i)).toBeInTheDocument();
  });
});
