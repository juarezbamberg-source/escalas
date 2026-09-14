import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderApp } from "../test/renderApp";

function buildReferenceFetchMock() {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (method === "GET") {
      if (url.includes("/professores")) {
        return Promise.resolve(
          new Response(
            JSON.stringify([{ id: 1, nome: "Juarez Bamberg da Silva", contratacao: "CLT", ativo: true }]),
          ),
        );
      }
      if (url.includes("/ucs")) {
        return Promise.resolve(
          new Response(JSON.stringify([{ id: 1, codigo: "UC1", nome: "UC 1", carga_horaria: 40, ativo: true }])),
        );
      }
      if (url.includes("/turmas")) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              { id: 1, codigo: "7074D", nome: "Turma 7074D", turno_padrao: "manha", uc_id: 1, ativo: true },
            ]),
          ),
        );
      }
    }

    return null;
  });
}

describe("CadastrosPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mostra a ultima alocacao registrada logo abaixo do formulario", async () => {
    const baseMock = buildReferenceFetchMock();
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const baseResponse = baseMock(input, init);
        if (baseResponse) {
          return baseResponse;
        }

        const url = String(input);
        if (url.includes("/alocacoes") && init?.method === "POST") {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                id: 9,
                turma_id: 1,
                turma_codigo: "",
                data: "2026-03-16",
                turno: "manha",
                professor_titular_id: 1,
                professor_titular_nome: "",
                professor_substituto_id: null,
                professor_substituto_nome: null,
                forcada: false,
                justificativa_override: null,
              }),
              {
                status: 201,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }

        return Promise.resolve(new Response(JSON.stringify({}), { status: 201 }));
      }),
    );

    renderApp("/cadastros");

    await userEvent.type(await screen.findByLabelText(/^Data$/i), "2026-03-16");
    await userEvent.click(screen.getByRole("button", { name: /salvar alocacao/i }));

    await waitFor(() => {
      expect(screen.getByText(/ultima alocacao registrada/i)).toBeInTheDocument();
      expect(screen.getByText(/7074D\s*•\s*Juarez Bamberg da Silva/i)).toBeInTheDocument();
    });
  });

  it("preserva a mensagem exata da API em erro de duplicidade", async () => {
    const baseMock = buildReferenceFetchMock();
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const baseResponse = baseMock(input, init);
        if (baseResponse) {
          return baseResponse;
        }

        const url = String(input);
        if (url.includes("/alocacoes") && init?.method === "POST") {
          return Promise.resolve(
            new Response(JSON.stringify({ detail: "Ja existe uma alocacao para a turma 7074D na data 16/03/2026 no turno manha." }), {
              status: 409,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        return Promise.resolve(new Response(JSON.stringify({}), { status: 201 }));
      }),
    );

    renderApp("/cadastros");

    await userEvent.type(await screen.findByLabelText(/^Data$/i), "2026-03-16");
    await userEvent.click(screen.getByRole("button", { name: /salvar alocacao/i }));

    await waitFor(() => {
      expect(screen.getByText(/Ja existe uma alocacao para a turma 7074D na data 16\/03\/2026 no turno manha\./i)).toBeInTheDocument();
    });
  });

  it("preenche o formulario de alocacao com o contexto vindo da tela de escala", async () => {
    vi.stubGlobal("fetch", buildReferenceFetchMock());

    renderApp("/cadastros?action=override&turno=manha&data=2026-03-16&turmaId=1&titularId=1");

    expect(await screen.findByText(/acao contextual da escala/i)).toBeInTheDocument();
    expect(screen.getByText(/override com justificativa assistida/i)).toBeInTheDocument();
    const section = screen.getByRole("heading", { name: /registrar nova alocacao/i }).closest("section") as HTMLElement;

    await waitFor(() => {
      expect(within(section).getByLabelText(/^Data$/i)).toHaveValue("2026-03-16");
      expect(within(section).getByLabelText(/^Turno$/i)).toHaveValue("manha");
      expect(within(section).getByLabelText(/^Turma$/i)).toHaveValue("1");
      expect(within(section).getByLabelText(/^Professor titular$/i)).toHaveValue("1");
      expect(within(section).getByRole("checkbox", { name: /registrar override/i })).toBeChecked();
    });

    expect(screen.getByText(/pelo menos 10 caracteres/i)).toBeInTheDocument();
  });

  it("remove uma alocacao quando a tela abre em modo contextual de remocao", async () => {
    const user = userEvent.setup();
    const baseMock = buildReferenceFetchMock();
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const baseResponse = baseMock(input, init);
      if (baseResponse) {
        return baseResponse;
      }

      const url = String(input);
      if (url.includes("/alocacoes/9?confirmar=true") && init?.method === "DELETE") {
        return Promise.resolve(new Response(null, { status: 204 }));
      }

      return Promise.resolve(new Response(JSON.stringify([])));
    });

    vi.stubGlobal("fetch", fetchMock);

    renderApp("/cadastros?action=remover&alocacaoId=9&turno=manha&data=2026-03-16&turmaId=1");

    expect(await screen.findByText(/remocao contextual da alocacao/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /confirmar remocao/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/alocacoes/9?confirmar=true"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    expect(screen.getByText(/alocacao removida com sucesso/i)).toBeInTheDocument();
  });

  it("gera preview recorrente e confirma cadastro em lote por dias da semana", async () => {
    const user = userEvent.setup();
    const baseMock = buildReferenceFetchMock();
    let confirmationDone = false;

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const baseResponse = baseMock(input, init);
        if (baseResponse) {
          return baseResponse;
        }

        const url = String(input);
        if (url.includes("/alocacoes/recorrente") && init?.method === "POST") {
          const payload = JSON.parse(String(init?.body ?? "{}")) as { confirmar: boolean };
          if (payload.confirmar) {
            confirmationDone = true;
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  total_previsto: 2,
                  total_validos: 2,
                  total_bloqueados: 0,
                  total_criados: 2,
                  itens_validos: [
                    {
                      data: "2026-03-16",
                      turno: "manha",
                      turma_id: 1,
                      turma_codigo: "7074D",
                      professor_titular_nome: "Juarez Bamberg da Silva",
                      professor_substituto_nome: null,
                      status: "valido",
                      motivo: null,
                    },
                    {
                      data: "2026-03-18",
                      turno: "manha",
                      turma_id: 1,
                      turma_codigo: "7074D",
                      professor_titular_nome: "Juarez Bamberg da Silva",
                      professor_substituto_nome: null,
                      status: "valido",
                      motivo: null,
                    },
                  ],
                  itens_bloqueados: [],
                  itens_criados: [
                    {
                      id: 11,
                      turma_id: 1,
                      turma_codigo: "7074D",
                      data: "2026-03-16",
                      turno: "manha",
                      professor_titular_id: 1,
                      professor_titular_nome: "Juarez Bamberg da Silva",
                      professor_substituto_id: null,
                      professor_substituto_nome: null,
                      forcada: false,
                      justificativa_override: null,
                    },
                    {
                      id: 12,
                      turma_id: 1,
                      turma_codigo: "7074D",
                      data: "2026-03-18",
                      turno: "manha",
                      professor_titular_id: 1,
                      professor_titular_nome: "Juarez Bamberg da Silva",
                      professor_substituto_id: null,
                      professor_substituto_nome: null,
                      forcada: false,
                      justificativa_override: null,
                    },
                  ],
                  requer_confirmacao: false,
                }),
              ),
            );
          }

          return Promise.resolve(
            new Response(
              JSON.stringify({
                total_previsto: 3,
                total_validos: 2,
                total_bloqueados: 1,
                total_criados: 0,
                itens_validos: [
                  {
                    data: "2026-03-16",
                    turno: "manha",
                    turma_id: 1,
                    turma_codigo: "7074D",
                    professor_titular_nome: "Juarez Bamberg da Silva",
                    professor_substituto_nome: null,
                    status: "valido",
                    motivo: null,
                  },
                  {
                    data: "2026-03-18",
                    turno: "manha",
                    turma_id: 1,
                    turma_codigo: "7074D",
                    professor_titular_nome: "Juarez Bamberg da Silva",
                    professor_substituto_nome: null,
                    status: "valido",
                    motivo: null,
                  },
                ],
                itens_bloqueados: [
                  {
                    data: "2026-03-20",
                    turno: "manha",
                    turma_id: 1,
                    turma_codigo: "7074D",
                    professor_titular_nome: "Juarez Bamberg da Silva",
                    professor_substituto_nome: null,
                    status: "bloqueado",
                    motivo: "Ja existe uma alocacao para a turma 7074D na data 20/03/2026 no turno manha.",
                  },
                ],
                itens_criados: [],
                requer_confirmacao: true,
              }),
            ),
          );
        }

        return Promise.resolve(new Response(JSON.stringify([])));
      }),
    );

    renderApp("/cadastros");

    await screen.findByText(/lancamento recorrente por dias da semana/i);
    await user.type(screen.getByLabelText(/data inicial do lote/i), "2026-03-16");
    await user.type(screen.getByLabelText(/data final do lote/i), "2026-03-20");
    await user.click(screen.getByRole("button", { name: /^Seg$/i }));
    await user.click(screen.getByRole("button", { name: /^Qua$/i }));
    await user.click(screen.getByRole("button", { name: /validar preview do lote/i }));

    expect(await screen.findByText(/preview recorrente/i)).toBeInTheDocument();
    expect(screen.getByText(/3 item\(ns\) previsto\(s\)/i)).toBeInTheDocument();
    expect(screen.getByText(/bloqueados: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/20\/03\/2026/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /confirmar cadastro recorrente/i }));

    await waitFor(() => {
      expect(confirmationDone).toBe(true);
    });
    expect(screen.getByText(/2 alocacao\(oes\) recorrente\(s\) criada\(s\) com sucesso/i)).toBeInTheDocument();
  });

  it("filtra por status e desativa um professor via PATCH", async () => {
    const user = userEvent.setup();
    let patchAtivo: boolean | undefined;

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "GET" && url.includes("/professores")) {
          const incluirInativos = url.includes("incluir_inativos=true");
          const itens = incluirInativos
            ? [
                { id: 1, nome: "Maria Ativa", contratacao: "CLT", ativo: true },
                { id: 2, nome: "Joao Inativo", contratacao: "PF", ativo: false },
              ]
            : [{ id: 1, nome: "Maria Ativa", contratacao: "CLT", ativo: true }];
          return Promise.resolve(new Response(JSON.stringify(itens)));
        }
        if (method === "GET" && (url.includes("/ucs") || url.includes("/turmas"))) {
          return Promise.resolve(new Response(JSON.stringify([])));
        }
        if (method === "PATCH" && url.includes("/professores/2")) {
          patchAtivo = (JSON.parse(String(init?.body ?? "{}")) as { ativo?: boolean }).ativo;
          return Promise.resolve(
            new Response(JSON.stringify({ id: 2, nome: "Joao Inativo", contratacao: "PF", ativo: true })),
          );
        }
        return Promise.resolve(new Response(JSON.stringify([])));
      }),
    );

    renderApp("/cadastros");

    await screen.findAllByText("Maria Ativa");
    expect(screen.queryByText("Joao Inativo")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^Todos \(/i }));
    await screen.findAllByText("Joao Inativo");
    expect(document.querySelectorAll(".badge-inativo").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /Reativar/i }));
    await waitFor(() => {
      expect(patchAtivo).toBe(true);
    });
  });

  it("exibe contadores nas abas e mensagem de desativacao aponta o filtro", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "GET" && url.includes("/professores")) {
          const incluirInativos = url.includes("incluir_inativos=true");
          const itens = incluirInativos
            ? [
                { id: 1, nome: "Maria Ativa", contratacao: "CLT", ativo: true },
                { id: 2, nome: "Joao Inativo", contratacao: "PF", ativo: false },
              ]
            : [{ id: 1, nome: "Maria Ativa", contratacao: "CLT", ativo: true }];
          return Promise.resolve(new Response(JSON.stringify(itens)));
        }
        if (method === "GET" && (url.includes("/ucs") || url.includes("/turmas"))) {
          return Promise.resolve(new Response(JSON.stringify([])));
        }
        if (method === "PATCH" && url.includes("/professores/2")) {
          return Promise.resolve(
            new Response(JSON.stringify({ id: 2, nome: "Joao Inativo", contratacao: "PF", ativo: true })),
          );
        }
        return Promise.resolve(new Response(JSON.stringify([])));
      }),
    );

    renderApp("/cadastros", true, {
      id: 1,
      nome: "Coordenador",
      username: "coord",
      funcao: "coordenacao",
      ativo: true,
      trocar_senha_no_proximo_acesso: false,
      professor_id: null,
    });

    await screen.findAllByText("Maria Ativa");
    expect(screen.getByRole("tab", { name: /^Ativos \(1\)$/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Inativos \(1\)$/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Todos \(2\)$/i })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^Todos \(/i }));
    await user.click(screen.getByRole("button", { name: /^Desativar$/i }));

    await waitFor(() => {
      expect(screen.getByText(/use o filtro 'Inativos' para reativa-lo/i)).toBeInTheDocument();
    });
  });

  it("edita um professor pela tela via PATCH", async () => {
    const user = userEvent.setup();
    let patchPayload: Record<string, unknown> | undefined;

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "GET" && url.includes("/professores")) {
          return Promise.resolve(
            new Response(
              JSON.stringify([{ id: 1, nome: "Maria Ativa", contratacao: "CLT", ativo: true }]),
            ),
          );
        }
        if (method === "GET" && (url.includes("/ucs") || url.includes("/turmas"))) {
          return Promise.resolve(new Response(JSON.stringify([])));
        }
        if (method === "PATCH" && url.includes("/professores/1")) {
          patchPayload = JSON.parse(String(init?.body ?? "{}"));
          return Promise.resolve(
            new Response(JSON.stringify({ id: 1, nome: "Maria Editada", contratacao: "PJ", ativo: true })),
          );
        }
        return Promise.resolve(new Response(JSON.stringify([])));
      }),
    );

    renderApp("/cadastros", true, {
      id: 1,
      nome: "Coordenador",
      username: "coord",
      funcao: "coordenacao",
      ativo: true,
      trocar_senha_no_proximo_acesso: false,
      professor_id: null,
    });

    await screen.findAllByText("Maria Ativa");

    await user.click(screen.getByRole("button", { name: /^Editar$/i }));
    const campoNome = screen.getAllByLabelText(/^Nome$/i)[0];
    await user.clear(campoNome);
    await user.type(campoNome, "Maria Editada");
    await user.click(screen.getByRole("button", { name: /Atualizar professor/i }));

    await waitFor(() => {
      expect(patchPayload).toMatchObject({ nome: "Maria Editada" });
    });
    expect(screen.getByText(/professor atualizado com sucesso/i)).toBeInTheDocument();
  });

  it("pagina a lista de professores em blocos de 20", async () => {
    const user = userEvent.setup();
    const muitos = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      nome: `Professor ${String(i + 1).padStart(2, "0")}`,
      contratacao: "CLT",
      ativo: true,
    }));

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (method === "GET" && url.includes("/professores")) {
          return Promise.resolve(new Response(JSON.stringify(muitos)));
        }
        return Promise.resolve(new Response(JSON.stringify([])));
      }),
    );

    renderApp("/cadastros", true, {
      id: 1,
      nome: "Coordenador",
      username: "coord",
      funcao: "coordenacao",
      ativo: true,
      trocar_senha_no_proximo_acesso: false,
      professor_id: null,
    });

    await screen.findAllByText("Professor 01");
    const nomesNaLista = Array.from(document.querySelectorAll(".data-list li strong")).map(
      (el) => el.textContent,
    );
    expect(nomesNaLista).not.toContain("Professor 21");
    expect(screen.getByText(/Pagina 1 de 2/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Proxima$/i }));
    await screen.findAllByText("Professor 21");
    expect(screen.queryByText(/Pagina 1 de 2/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Pagina 2 de 2/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Anterior$/i }));
    await screen.findAllByText("Professor 01");
  });
});
