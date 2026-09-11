import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { formatDate } from "../lib/format";
import { renderApp } from "../test/renderApp";

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function offsetDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatIsoDate(date);
}

function nextWeekday(targetDay: number) {
  const date = new Date();
  const distance = (targetDay - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + distance);
  return formatIsoDate(date);
}

const today = offsetDate(0);
const tomorrow = offsetDate(1);
const afterTomorrow = nextWeekday(6);
const plusThreeDays = nextWeekday(0);
const plusFourDays = offsetDate(4);

const baseManhaAlocacoes = [
  {
    id: 1,
    turma_id: 1,
    turma_codigo: "7074D",
    uc_id: 11,
    uc_codigo: "UC-A",
    uc_nome: "Algoritmos",
    data: today,
    turno: "manha",
    professor_titular_id: 1,
    professor_titular_nome: "Juarez Bamberg da Silva",
    professor_substituto_id: null,
    professor_substituto_nome: null,
    forcada: false,
    justificativa_override: null,
  },
  {
    id: 2,
    turma_id: 2,
    turma_codigo: "8080N",
    uc_id: 12,
    uc_codigo: "UC-B",
    uc_nome: "Banco de Dados",
    data: tomorrow,
    turno: "manha",
    professor_titular_id: 2,
    professor_titular_nome: "Maria Oliveira",
    professor_substituto_id: 3,
    professor_substituto_nome: "Carlos Souza",
    forcada: true,
    justificativa_override: "Cobertura emergencial da turma.",
  },
  {
    id: 3,
    turma_id: 3,
    turma_codigo: "9090X",
    uc_id: 11,
    uc_codigo: "UC-A",
    uc_nome: "Algoritmos",
    data: afterTomorrow,
    turno: "manha",
    professor_titular_id: 4,
    professor_titular_nome: "Ana Lima",
    professor_substituto_id: null,
    professor_substituto_nome: null,
    forcada: false,
    justificativa_override: null,
  },
];

const baseManhaCalendario = [
  {
    turma_id: 1,
    turma_codigo: "7074D",
    uc_id: 11,
    uc_codigo: "UC-A",
    uc_nome: "Algoritmos",
    data: today,
    turno: "manha",
    professor_titular_nome: "Juarez Bamberg da Silva",
    professor_substituto_nome: null,
    status_visual: "VERMELHO",
  },
  {
    turma_id: 2,
    turma_codigo: "8080N",
    uc_id: 12,
    uc_codigo: "UC-B",
    uc_nome: "Banco de Dados",
    data: tomorrow,
    turno: "manha",
    professor_titular_nome: "Maria Oliveira",
    professor_substituto_nome: "Carlos Souza",
    status_visual: "ROXO",
  },
  {
    turma_id: 3,
    turma_codigo: "9090X",
    uc_id: 11,
    uc_codigo: "UC-A",
    uc_nome: "Algoritmos",
    data: afterTomorrow,
    turno: "manha",
    professor_titular_nome: "Ana Lima",
    professor_substituto_nome: null,
    status_visual: "VERDE",
  },
  {
    turma_id: 4,
    turma_codigo: "6060Z",
    uc_id: 13,
    uc_codigo: "UC-C",
    uc_nome: "Redes",
    data: plusThreeDays,
    turno: "manha",
    professor_titular_nome: null,
    professor_substituto_nome: null,
    status_visual: "AMARELO",
  },
];

const baseNoiteAlocacoes = [
  {
    id: 4,
    turma_id: 5,
    turma_codigo: "1111N",
    uc_id: 14,
    uc_codigo: "UC-N",
    uc_nome: "Noturno",
    data: plusFourDays,
    turno: "noite",
    professor_titular_id: 5,
    professor_titular_nome: "Paulo Nunes",
    professor_substituto_id: null,
    professor_substituto_nome: null,
    forcada: false,
    justificativa_override: null,
  },
];

const baseNoiteCalendario = [
  {
    turma_id: 5,
    turma_codigo: "1111N",
    uc_id: 14,
    uc_codigo: "UC-N",
    uc_nome: "Noturno",
    data: plusFourDays,
    turno: "noite",
    professor_titular_nome: "Paulo Nunes",
    professor_substituto_nome: null,
    status_visual: "VERDE",
  },
];

describe("EscalaPage", () => {
  beforeEach(() => {
    let manhaAlocacoes = structuredClone(baseManhaAlocacoes);
    let manhaCalendario = structuredClone(baseManhaCalendario);
    const noiteAlocacoes = structuredClone(baseNoiteAlocacoes);
    const noiteCalendario = structuredClone(baseNoiteCalendario);
    const turmaPeriodoRows = [
      {
        data: "2026-09-01",
        turno: "manha",
        turma_id: 1,
        turma_codigo: "7074D",
        uc_id: 11,
        uc_codigo: "UC-A",
        uc_nome: "Algoritmos",
        professor_titular_nome: "Juarez Bamberg da Silva",
        professor_substituto_nome: null,
        situacao: "Confirmada",
      },
      {
        data: "2026-09-02",
        turno: "manha",
        turma_id: 1,
        turma_codigo: "7074D",
        uc_id: 11,
        uc_codigo: "UC-A",
        uc_nome: "Algoritmos",
        professor_titular_nome: null,
        professor_substituto_nome: null,
        situacao: "Sem professor definido",
      },
    ];

    window.sessionStorage.clear();
    window.localStorage.clear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (url.includes("/alocacoes/remocao-lote") && method === "POST") {
          const payload = JSON.parse(String(init?.body ?? "{}")) as { alocacao_ids: number[]; confirmar: boolean };
          const uniqueIds = Array.from(new Set(payload.alocacao_ids));
          const removable = manhaAlocacoes.filter((item) => uniqueIds.includes(item.id));
          const missing = uniqueIds.filter((id) => !removable.some((item) => item.id === id));
          const responseBody = {
            total_solicitado: uniqueIds.length,
            total_removivel: removable.length,
            total_removido: payload.confirmar ? removable.length : 0,
            itens_removiveis: removable.map((item) => ({
              id: item.id,
              turma_codigo: item.turma_codigo,
              data: item.data,
              turno: item.turno,
              professor_titular_nome: item.professor_titular_nome,
              professor_substituto_nome: item.professor_substituto_nome,
            })),
            itens_removidos: payload.confirmar
              ? removable.map((item) => ({
                  id: item.id,
                  turma_codigo: item.turma_codigo,
                  data: item.data,
                  turno: item.turno,
                  professor_titular_nome: item.professor_titular_nome,
                  professor_substituto_nome: item.professor_substituto_nome,
                }))
              : [],
            ids_inexistentes: missing,
            requer_confirmacao: !payload.confirmar,
          };

          if (payload.confirmar) {
            manhaAlocacoes = manhaAlocacoes.filter((item) => !uniqueIds.includes(item.id));
            manhaCalendario = manhaCalendario.filter((item) => !removable.some((alocacao) => alocacao.turma_codigo === item.turma_codigo && alocacao.data === item.data));
          }

          return new Response(JSON.stringify(responseBody));
        }

        if (url.includes("/alocacoes/turma-periodo")) {
          return new Response(JSON.stringify(turmaPeriodoRows));
        }

        if (url.includes("/alocacoes/calendario") && url.includes("turno=manha")) {
          return new Response(JSON.stringify(manhaCalendario));
        }
        if (url.includes("/alocacoes/calendario") && url.includes("turno=noite")) {
          return new Response(JSON.stringify(noiteCalendario));
        }
        if (url.includes("/alocacoes?turno=manha")) {
          return new Response(JSON.stringify(manhaAlocacoes));
        }
        if (url.includes("/alocacoes?turno=noite")) {
          return new Response(JSON.stringify(noiteAlocacoes));
        }
        if (url.includes("/professores")) {
          return new Response(
            JSON.stringify([
              { id: 1, nome: "Juarez Bamberg da Silva", contratacao: "CLT" },
              { id: 2, nome: "Maria Oliveira", contratacao: "CLT" },
              { id: 3, nome: "Carlos Souza", contratacao: "CLT" },
              { id: 4, nome: "Ana Lima", contratacao: "CLT" },
            ]),
          );
        }
        if (url.includes("/ucs")) {
          return new Response(JSON.stringify([{ id: 1, codigo: "UC1", nome: "UC 1", carga_horaria: 40 }]));
        }
        if (url.includes("/turmas")) {
          return new Response(
            JSON.stringify([
              { id: 1, codigo: "7074D", nome: "Turma 7074D", turno_padrao: "manha", uc_id: 1 },
              { id: 2, codigo: "8080N", nome: "Turma 8080N", turno_padrao: "manha", uc_id: 1 },
              { id: 3, codigo: "9090X", nome: "Turma 9090X", turno_padrao: "manha", uc_id: 1 },
              { id: 4, codigo: "670007074D", nome: "Turma 670007074D", turno_padrao: "manha", uc_id: 1 },
            ]),
          );
        }

        return new Response(JSON.stringify([]));
      }),
    );
  });

  afterEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  async function expandGroup(user: ReturnType<typeof userEvent.setup>, turmaCodigo: string) {
    await user.click(screen.getByRole("button", { name: new RegExp(`Turma ${turmaCodigo}`, "i") }));
  }

  it("combina filtros de turma, professor e status com resumo visivel e limpeza individual", async () => {
    const user = userEvent.setup();

    renderApp("/escala");

    await screen.findByText(/filtros avancados/i);
    const filtersSection = screen.getByRole("heading", { name: /filtros avancados/i }).closest("section") as HTMLElement;

    await user.selectOptions(within(filtersSection).getByLabelText(/^Turma$/i), "7074D");
    await user.selectOptions(within(filtersSection).getByLabelText(/professor titular/i), "Juarez Bamberg da Silva");
    await user.click(screen.getByRole("button", { name: /^Com conflito$/i }));
    await expandGroup(user, "7074D");

    const table = screen.getByRole("table");
    expect(within(table).getByText("7074D")).toBeInTheDocument();
    expect(within(table).getByText("Juarez Bamberg da Silva")).toBeInTheDocument();
    expect(within(table).queryByText("8080N")).not.toBeInTheDocument();

    expect(screen.getByText("Turno: manha")).toBeInTheDocument();
    expect(screen.getByText("Turma: 7074D")).toBeInTheDocument();
    expect(screen.getByText("Titular: Juarez Bamberg da Silva")).toBeInTheDocument();
    expect(screen.getByText("Status: Com conflito")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remover filtro titular: juarez bamberg da silva/i }));

    await waitFor(() => {
      expect(screen.queryByText("Titular: Juarez Bamberg da Silva")).not.toBeInTheDocument();
    });
  });

  it("aplica atalhos recorrentes e reflete a origem no resumo do recorte", async () => {
    const user = userEvent.setup();

    renderApp("/escala");

    await screen.findByText(/filtros avancados/i);
    await user.click(screen.getByRole("button", { name: /conflitos de hoje/i }));

    expect(screen.getByText("Atalho: Conflitos de hoje")).toBeInTheDocument();
    expect(screen.getByText("Semaforo: VERMELHO")).toBeInTheDocument();
    expect(screen.getByText(`De: ${formatDate(today)}`)).toBeInTheDocument();
    expect(screen.getByText(`Ate: ${formatDate(today)}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Turma 7074D/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Turma 8080N/i })).not.toBeInTheDocument();
  });

  it("salva, reaplica e remove presets com persistencia local", async () => {
    const user = userEvent.setup();

    const firstRender = renderApp("/escala");
    await screen.findByText(/filtros avancados/i);
    const firstFiltersSection = screen.getByRole("heading", { name: /filtros avancados/i }).closest("section") as HTMLElement;

    await user.selectOptions(within(firstFiltersSection).getByLabelText(/^Turma$/i), "8080N");
    await user.click(screen.getByRole("tab", { name: /^Mensal$/i }));
    await user.click(screen.getByRole("button", { name: /modo compacto/i }));
    await user.type(screen.getByLabelText(/nome do preset/i), "Plantao roxo");
    await user.click(screen.getByRole("button", { name: /salvar preset atual/i }));

    expect(screen.getByText("Preset: Plantao roxo")).toBeInTheDocument();
    firstRender.unmount();

    renderApp("/escala");
    await screen.findByText(/filtros avancados/i);
    const secondFiltersSection = screen.getByRole("heading", { name: /filtros avancados/i }).closest("section") as HTMLElement;

    expect(screen.getByText("Plantao roxo")).toBeInTheDocument();
    await user.selectOptions(within(secondFiltersSection).getByLabelText(/^Turma$/i), "7074D");
    await user.click(screen.getByRole("button", { name: /^Aplicar$/i }));

    expect(screen.getByText("Preset: Plantao roxo")).toBeInTheDocument();
    expect(screen.getByText("Turma: 8080N")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Mensal$/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: /modo compacto/i })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: /^Excluir$/i }));
    await waitFor(() => {
      expect(screen.queryByText("Plantao roxo")).not.toBeInTheDocument();
    });
  });

  it("mantem o recorte ao trocar de turno e mostra estado vazio especifico quando nada combina", async () => {
    const user = userEvent.setup();

    renderApp("/escala");

    await screen.findByText(/filtros avancados/i);

    await user.click(screen.getByRole("button", { name: /^Overrides$/i }));
    expect(screen.getByText("Status: Overrides")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^noite$/i }));

    await waitFor(() => {
      expect(screen.getByText(/nenhum item atende ao recorte ativo/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Turno: noite")).toBeInTheDocument();
    expect(screen.queryByText("Atalho:")).not.toBeInTheDocument();
  });

  it("agrega o calendario por dia, alterna modos e abre o drill-down do recorte escolhido", async () => {
    const user = userEvent.setup();

    renderApp("/escala");

    await screen.findByText(/filtros avancados/i);

    expect(screen.getByText(/dia\(s\) com ocorrencias no recorte atual/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: formatDate(today), level: 3 })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^Semanal$/i }));
    expect(screen.getByText(/semana de/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^Mensal$/i }));
    expect(screen.getByText(/de 2026/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: `Abrir detalhe de ${formatDate(tomorrow)}` }));

    const detailHeading = screen.getByRole("heading", { name: formatDate(tomorrow), level: 3 });
    const detailPanel = detailHeading.closest("aside");
    const detailCard = within(detailPanel as HTMLElement).getByText("8080N").closest("article");

    expect(detailHeading).toBeInTheDocument();
    expect(detailPanel).not.toBeNull();
    expect(detailCard).not.toBeNull();
    expect(within(detailCard as HTMLElement).getByText(/maria oliveira/i)).toBeInTheDocument();
    expect(within(detailCard as HTMLElement).getByText(/^Substituto$/i)).toBeInTheDocument();
    expect(within(detailCard as HTMLElement).getByText(/carlos souza/i)).toBeInTheDocument();
  });

  it("explica os sinais e separa titular e substituto na grade", async () => {
    const user = userEvent.setup();

    renderApp("/escala");

    await screen.findByText(/filtros avancados/i);
    await expandGroup(user, "7074D");
    const table = screen.getByRole("table");
    const row = within(table).getByText("7074D").closest("tr") as HTMLTableRowElement;

    expect(within(row).getByText(/^Titular$/i)).toBeInTheDocument();
    expect(within(row).getByText(/^Substituto$/i)).toBeInTheDocument();
    expect(within(row).getAllByText(/sem substituto/i).length).toBeGreaterThan(0);
    expect(within(row).getByText(/conflito \+1 motivo\(s\)/i)).toBeInTheDocument();

    await user.click(within(row).getByText(/conflito \+1 motivo\(s\)/i));

    expect(within(row).getByText(/professor em conflito de horario neste turno e data/i)).toBeInTheDocument();
    expect(within(row).getByText(/ainda nao ha professor substituto informado/i)).toBeInTheDocument();
  });

  it("abre a drawer de substituicao contextual a partir do overflow do drill-down", async () => {
    const user = userEvent.setup();

    renderApp("/escala");

    await screen.findByText(/filtros avancados/i);
    await user.click(screen.getByRole("button", { name: `Abrir detalhe de ${formatDate(tomorrow)}` }));
    const detailHeading = screen.getByRole("heading", { name: formatDate(tomorrow), level: 3 });
    const detailPanel = detailHeading.closest("aside") as HTMLElement;
    const detailCard = within(detailPanel).getByText("8080N").closest("article") as HTMLElement;

    await user.click(within(detailCard).getAllByText(/mais acoes/i)[0]);
    await user.click(within(detailCard).getAllByRole("button", { name: /^Substituir$/i })[0]);

    expect(await screen.findByText(/acao contextual/i)).toBeInTheDocument();
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: /substituir sem sair da escala/i })).toBeInTheDocument();
    expect(within(dialog).getByText(/leitura operacional do item/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(within(dialog).getByLabelText(/^Data$/i)).toHaveValue(tomorrow);
      expect(within(dialog).getByLabelText(/^Turno$/i)).toHaveValue("manha");
      expect(within(dialog).getByLabelText(/^Turma$/i)).toHaveValue("2");
      expect(within(dialog).getByLabelText(/professor titular/i)).toHaveValue("2");
      expect(within(dialog).getByLabelText(/professor substituto/i)).toHaveValue("3");
    });
  });

  it("antecipa avisos preventivos e preserva contexto no formulario completo", async () => {
    const user = userEvent.setup();

    renderApp("/escala");

    await screen.findByText(/filtros avancados/i);
    await user.click(screen.getByRole("button", { name: `Abrir detalhe de ${formatDate(today)}` }));
    const detailHeading = screen.getByRole("heading", { name: formatDate(today), level: 3 });
    const detailPanel = detailHeading.closest("aside") as HTMLElement;

    await user.click(within(detailPanel).getAllByRole("button", { name: /^Substituir$/i })[0]);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/validacoes preventivas/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/informe um substituto para concluir a acao de substituicao/i)).toBeInTheDocument();

    const fallbackLink = within(dialog).getByRole("link", { name: /abrir formulario completo/i });
    expect(fallbackLink).toHaveAttribute(
      "href",
      `/cadastros?action=substituir&turno=manha&data=${today}&turmaId=1&alocacaoId=1&titularId=1`,
    );
  });

  it("seleciona itens, antecipa resumo e confirma remocao em lote", async () => {
    const user = userEvent.setup();

    renderApp("/escala");

    await screen.findByText(/filtros avancados/i);
    await expandGroup(user, "7074D");
    await expandGroup(user, "8080N");
    await user.click(screen.getByRole("checkbox", { name: /selecionar alocacao da turma 7074d/i }));
    await user.click(screen.getByRole("checkbox", { name: /selecionar alocacao da turma 8080n/i }));
    await user.click(screen.getByRole("button", { name: /preparar remocao em lote/i }));

    expect(await screen.findByText(/resumo antes de confirmar/i)).toBeInTheDocument();
    expect(screen.getByText(/2 item\(ns\) podem ser removidos agora/i)).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /confirmo a remocao em lote/i }));
    await user.click(screen.getByRole("button", { name: /confirmar remocao de 2 item/i }));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Turma 7074D/i })).not.toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /Turma 8080N/i })).not.toBeInTheDocument();
    await expandGroup(user, "9090X");
    const gradeTable = screen.getByRole("table", { name: /grupo 9090x/i });
    expect(within(gradeTable).getByText("9090X")).toBeInTheDocument();
  });

  it("agrupa a grade por UC e turma e expande sob demanda", async () => {
    const user = userEvent.setup();

    renderApp("/escala");

    await screen.findByText(/alocacoes do turno/i);

    expect(screen.getAllByRole("button", { name: /UC-A/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("table", { name: /grupo 7074d/i })).not.toBeInTheDocument();

    await expandGroup(user, "7074D");

    const groupTable = screen.getByRole("table", { name: /grupo 7074d/i });
    expect(groupTable).toBeInTheDocument();
    expect(within(groupTable).getByText("Juarez Bamberg da Silva")).toBeInTheDocument();
  });

  it("destaca sabado e domingo no calendario como contexto visual", async () => {
    const user = userEvent.setup();

    renderApp("/escala");

    await screen.findByText(/calendario sintetico/i);

    const saturdayCard = screen.getByRole("button", { name: `Abrir detalhe de ${formatDate(plusThreeDays)}` });
    expect(saturdayCard.className).toContain("calendar-day-card--weekend");

    await user.click(screen.getByRole("tab", { name: /^Mensal$/i }));

    const saturdayCardInMonth = screen.getByRole("button", { name: `Abrir detalhe de ${formatDate(plusThreeDays)}` });
    expect(saturdayCardInMonth.className).toContain("calendar-day-card--weekend");
  });

  it("destaca sabado e domingo tambem nos registros expandidos da grade", async () => {
    const user = userEvent.setup();

    renderApp("/escala");

    await screen.findByText(/alocacoes do turno/i);
    await expandGroup(user, "9090X");

    const groupTable = screen.getByRole("table", { name: /grupo 9090x/i });
    const weekendRow = within(groupTable).getByText(formatDate(afterTomorrow)).closest("tr");

    expect(weekendRow).not.toBeNull();
    expect(weekendRow?.className).toContain("table-row--weekend");
  });

  it("nao mistura registros de turmas diferentes so porque compartilham data e turno", async () => {
    const user = userEvent.setup();

    renderApp("/escala");

    await screen.findByText(/alocacoes do turno/i);
    expect(screen.getByRole("button", { name: /Turma 6060Z/i })).toBeInTheDocument();

    await expandGroup(user, "7074D");
    const groupTable = screen.getByRole("table", { name: /grupo 7074d/i });

    expect(within(groupTable).queryByText(formatDate(plusThreeDays))).not.toBeInTheDocument();
  });

  it("inclui sabado e domingo intermediarios ao montar a grade por intervalo continuo", async () => {
    const user = userEvent.setup();

    renderApp("/escala");

    await screen.findByText(/alocacoes do turno/i);
    await expandGroup(user, "6060Z");

    const groupTable = screen.getByRole("table", { name: /grupo 6060z/i });
    expect(within(groupTable).getByText(formatDate(plusThreeDays))).toBeInTheDocument();
  });

  it("exige liberacao explicita para salvar atividade extracurricular no fim de semana", async () => {
    const user = userEvent.setup();

    renderApp("/escala");

    await screen.findByText(/alocacoes do turno/i);
    await expandGroup(user, "6060Z");

    const groupTable = screen.getByRole("table", { name: /grupo 6060z/i });
    const weekendRow = within(groupTable).getByText(formatDate(plusThreeDays)).closest("tr") as HTMLTableRowElement;

    await user.click(within(weekendRow).getByRole("button", { name: /^Alocar$/i }));

    const dialog = await screen.findByRole("dialog");
    const submitButton = within(dialog).getByRole("button", { name: /^Alocar$/i });

    expect(
      within(dialog).getByRole("checkbox", { name: /liberar data de fim de semana para atividade extracurricular/i }),
    ).not.toBeChecked();
    expect(submitButton).toBeDisabled();

    await user.click(
      within(dialog).getByRole("checkbox", { name: /liberar data de fim de semana para atividade extracurricular/i }),
    );

    expect(submitButton).toBeEnabled();
  });

  it("consulta professor da turma por periodo e explicita ausencia de professor", async () => {
    const user = userEvent.setup();

    renderApp("/escala");

    await screen.findByText(/consulta por turma e periodo/i);
    const querySection = screen.getByRole("heading", { name: /consulta por turma e periodo/i }).closest("section") as HTMLElement;
    await user.selectOptions(within(querySection).getByLabelText(/^Turma$/i), "1");
    await user.type(within(querySection).getByLabelText(/data inicial/i), "2026-09-01");
    await user.type(within(querySection).getByLabelText(/data final/i), "2026-09-02");
    await user.click(within(querySection).getByRole("button", { name: /consultar professor da turma/i }));

    const table = await screen.findByRole("table", { name: /resultado da consulta por turma e periodo/i });
    expect(within(table).getByText("01/09/2026")).toBeInTheDocument();
    expect(within(table).getByText("Juarez Bamberg da Silva")).toBeInTheDocument();
    expect(within(table).getByText("Confirmada")).toBeInTheDocument();
    expect(within(table).getByText("02/09/2026")).toBeInTheDocument();
    expect(within(table).getAllByText("Sem professor definido")).toHaveLength(2);
  });

  it("permite ocultar substituicoes na consulta por turma e periodo", async () => {
    const user = userEvent.setup();

    renderApp("/escala");

    await screen.findByText(/consulta por turma e periodo/i);
    const querySection = screen.getByRole("heading", { name: /consulta por turma e periodo/i }).closest("section") as HTMLElement;
    await user.selectOptions(within(querySection).getByLabelText(/^Turma$/i), "1");
    await user.type(within(querySection).getByLabelText(/data inicial/i), "2026-09-01");
    await user.type(within(querySection).getByLabelText(/data final/i), "2026-09-02");
    await user.click(within(querySection).getByRole("checkbox", { name: /exibir substituicoes/i }));
    await user.click(within(querySection).getByRole("button", { name: /consultar professor da turma/i }));

    const table = await screen.findByRole("table", { name: /resultado da consulta por turma e periodo/i });
    expect(within(table).queryByRole("columnheader", { name: /substituto/i })).not.toBeInTheDocument();
  });
});
