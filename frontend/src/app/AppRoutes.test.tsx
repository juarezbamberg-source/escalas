import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderApp } from "../test/renderApp";

describe("AppRoutes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("permite navegar ate a pagina de escala e carregar a consulta principal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/alocacoes/calendario")) {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                {
                  turma_id: 1,
                  turma_codigo: "7074D",
                  uc_id: 1,
                  uc_codigo: "UC1",
                  uc_nome: "UC 1",
                  data: "2026-03-16",
                  turno: "manha",
                  professor_titular_nome: "Maria",
                  professor_substituto_nome: null,
                  status_visual: "VERDE",
                },
              ]),
            ),
          );
        }
        if (url.includes("/alocacoes?turno=manha")) {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                {
                  id: 1,
                  turma_id: 1,
                  turma_codigo: "7074D",
                  uc_id: 1,
                  uc_codigo: "UC1",
                  uc_nome: "UC 1",
                  data: "2026-03-16",
                  turno: "manha",
                  professor_titular_id: 1,
                  professor_titular_nome: "Maria",
                  professor_substituto_id: null,
                  professor_substituto_nome: null,
                  forcada: false,
                  justificativa_override: null,
                },
              ]),
            ),
          );
        }
        return Promise.resolve(new Response(JSON.stringify([])));
      }),
    );

    renderApp("/");

    await userEvent.click(screen.getByRole("link", { name: /abrir escala por turno/i }));
    await userEvent.click(screen.getByRole("button", { name: /Turma 7074D/i }));

    expect((await screen.findAllByText(/7074D/)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Maria/)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/VERDE/)).length).toBeGreaterThan(0);
  });

  it("abre o dashboard de graficos e consolida horas por professor", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/alocacoes?turno=manha")) {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                {
                  id: 1,
                  turma_id: 1,
                  turma_codigo: "7074D",
                  uc_id: 1,
                  uc_codigo: "UC1",
                  uc_nome: "UC 1",
                  data: "2026-03-16",
                  turno: "manha",
                  professor_titular_id: 1,
                  professor_titular_nome: "Maria",
                  professor_substituto_id: null,
                  professor_substituto_nome: null,
                  forcada: false,
                  justificativa_override: null,
                },
              ]),
            ),
          );
        }
        if (url.includes("/alocacoes?turno=tarde")) {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                {
                  id: 2,
                  turma_id: 2,
                  turma_codigo: "8080N",
                  uc_id: 1,
                  uc_codigo: "UC1",
                  uc_nome: "UC 1",
                  data: "2026-03-16",
                  turno: "tarde",
                  professor_titular_id: 1,
                  professor_titular_nome: "Maria",
                  professor_substituto_id: null,
                  professor_substituto_nome: null,
                  forcada: false,
                  justificativa_override: null,
                },
              ]),
            ),
          );
        }
        if (url.includes("/alocacoes?turno=noite")) {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                {
                  id: 3,
                  turma_id: 3,
                  turma_codigo: "9090X",
                  uc_id: 1,
                  uc_codigo: "UC1",
                  uc_nome: "UC 1",
                  data: "2026-03-16",
                  turno: "noite",
                  professor_titular_id: 2,
                  professor_titular_nome: "Joao",
                  professor_substituto_id: null,
                  professor_substituto_nome: null,
                  forcada: false,
                  justificativa_override: null,
                },
              ]),
            ),
          );
        }
        return Promise.resolve(new Response(JSON.stringify([])));
      }),
    );

    renderApp("/");

    await userEvent.click(screen.getByRole("link", { name: /abrir dashboard de graficos/i }));

    expect(await screen.findByRole("heading", { name: /total de horas por professor/i })).toBeInTheDocument();
    const chart = screen.getByRole("img", { name: /grafico de total de horas por professor/i });
    expect(chart).toBeInTheDocument();
    expect(within(chart).getByText("Maria")).toBeInTheDocument();
    expect(within(chart).getByText("Joao")).toBeInTheDocument();
    expect(within(chart).getByText(/2 alocacao\(oes\) • Manha 3h • Tarde 3h • Noite 0h/i)).toBeInTheDocument();
  });

  it("exibe falha visivel quando a API esta indisponivel", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("network down"))));

    renderApp("/escala");

    await waitFor(() => {
      expect(screen.getByText(/nao foi possivel carregar a escala agora/i)).toBeInTheDocument();
    });
  });
});
