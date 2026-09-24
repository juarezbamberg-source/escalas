import { screen, waitFor } from "@testing-library/react";

import { renderApp } from "../test/renderApp";

function mockFetchAdmin() {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/professores/carga")) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              {
                professor_id: 1,
                professor_nome: "Maria",
                horas: 6,
                alocacoes: 2,
                manha: 3,
                tarde: 3,
                noite: 0,
              },
            ]),
          ),
        );
      }
      if (url.includes("/dashboard/resumo")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data_inicio: "2026-09-01",
              data_fim: "2026-09-14",
              alocacoes_por_turno: { manha: 4, tarde: 2, noite: 1 },
              alocacoes_por_turma: [
                { turma_id: 1, turma_codigo: "T1", turma_nome: "Turma 1", alocacoes: 4 },
              ],
              total_substituicoes: 1,
              total_alocacoes: 7,
            }),
          ),
        );
      }
      return Promise.resolve(new Response(JSON.stringify([])));
    }),
  );
}

describe("DashboardPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("coordenacao ve resumo operacional com graficos novos", async () => {
    mockFetchAdmin();

    renderApp("/dashboard");

    await waitFor(() => {
      expect(screen.getByText(/alocacoes no periodo/i)).toBeInTheDocument();
    });
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText(/substituicoes/i)).toBeInTheDocument();
    expect(screen.getByText(/alocacoes por turno/i)).toBeInTheDocument();
    expect(screen.getByText(/top turmas por alocacoes/i)).toBeInTheDocument();
    expect(screen.getByText("Dashboard de graficos")).toBeInTheDocument();
  });

  it("envia periodo ao backend nas consultas do dashboard", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/professores/carga")) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              {
                professor_id: 1,
                professor_nome: "Maria",
                horas: 6,
                alocacoes: 2,
                manha: 3,
                tarde: 3,
                noite: 0,
              },
            ]),
          ),
        );
      }
      if (url.includes("/dashboard/resumo")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data_inicio: "2026-09-01",
              data_fim: "2026-09-24",
              alocacoes_por_turno: { manha: 4, tarde: 2, noite: 1 },
              alocacoes_por_turma: [
                { turma_id: 1, turma_codigo: "T1", turma_nome: "Turma 1", alocacoes: 4 },
              ],
              total_substituicoes: 1,
              total_alocacoes: 7,
            }),
          ),
        );
      }
      return Promise.resolve(new Response(JSON.stringify([])));
    });
    vi.stubGlobal("fetch", fetchMock);

    renderApp("/dashboard");

    await waitFor(() => {
      expect(screen.getByText(/alocacoes no periodo/i)).toBeInTheDocument();
    });

    const chamadaCarga = fetchMock.mock.calls.find((call) =>
      String(call[0]).includes("/professores/carga"),
    );
    const chamadaResumo = fetchMock.mock.calls.find((call) =>
      String(call[0]).includes("/dashboard/resumo"),
    );
    const urlCarga = String(chamadaCarga?.[0]);
    const urlResumo = String(chamadaResumo?.[0]);
    expect(urlCarga).toContain("tipo=realizada");
    expect(urlCarga).toContain("data_inicio=");
    expect(urlCarga).toContain("data_fim=");
    expect(urlResumo).toContain("data_inicio=");
    expect(urlResumo).toContain("data_fim=");
  });

  it("professor ve Meu Dashboard sem resumo operacional", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/professores/carga")) {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                {
                  professor_id: 1,
                  professor_nome: "Prof Maria",
                  horas: 6,
                  alocacoes: 2,
                  manha: 3,
                  tarde: 3,
                  noite: 0,
                },
              ]),
            ),
          );
        }
        return Promise.resolve(new Response(JSON.stringify([])));
      }),
    );

    renderApp("/dashboard", true, {
      id: 2,
      nome: "Prof Maria",
      username: "prof_maria",
      funcao: "professor",
      ativo: true,
      trocar_senha_no_proximo_acesso: false,
      professor_id: 1,
    });

    await waitFor(() => {
      expect(screen.getAllByText("Meu Dashboard").length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/alocacoes no periodo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/top turmas/i)).not.toBeInTheDocument();
  });
});
