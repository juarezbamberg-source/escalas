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
          new Response(JSON.stringify([{ id: 1, nome: "Juarez Bamberg da Silva", contratacao: "CLT" }])),
        );
      }
      if (url.includes("/ucs")) {
        return Promise.resolve(new Response(JSON.stringify([{ id: 1, codigo: "UC1", nome: "UC 1", carga_horaria: 40 }])));
      }
      if (url.includes("/turmas")) {
        return Promise.resolve(
          new Response(JSON.stringify([{ id: 1, codigo: "7074D", nome: "Turma 7074D", turno_padrao: "manha", uc_id: 1 }])),
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
});
