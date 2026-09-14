import { exportarEscalaExcel, exportarEscalaPdf, type LinhaEscala } from "./exportar";

const linhas: LinhaEscala[] = [
  {
    turma_codigo: "7074D",
    data: "2026-03-16",
    turno: "manha",
    professor_titular_nome: "Maria",
    professor_substituto_nome: null,
    forcada: false,
    status_visual: "VERDE",
  },
  {
    turma_codigo: "8080A",
    data: "2026-03-17",
    turno: "manha",
    professor_titular_nome: "Joao",
    professor_substituto_nome: "Maria",
    forcada: true,
    status_visual: "AMARELO",
  },
];

const recorte = { turno: "manha", dataInicio: "2026-03-16", dataFim: "2026-03-17" };

describe("exportar escala", () => {
  it("gera PDF com as linhas ordenadas por data", () => {
    const criar = vi.fn().mockReturnValue({
      setFontSize: vi.fn(),
      text: vi.fn(),
      save: vi.fn(),
    });
    vi.doMock("jspdf", () => ({ jsPDF: criar }));

    exportarEscalaPdf(linhas, recorte);

    expect(criar).toHaveBeenCalledWith({ orientation: "landscape" });
  });

  it("gera planilha Excel com cabecalho e linhas", () => {
    const escrever = vi.spyOn(
      { writeFile: () => undefined },
      "writeFile",
    );
    const planilha = {
      aoa_to_sheet: vi.fn().mockReturnValue({}),
      book_new: vi.fn().mockReturnValue({}),
      book_append_sheet: vi.fn(),
      writeFile: escrever,
    };
    vi.doMock("xlsx", () => planilha);

    exportarEscalaExcel(linhas, recorte);

    expect(planilha.aoa_to_sheet).toHaveBeenCalled();
    expect(planilha.book_append_sheet).toHaveBeenCalled();
  });
});
