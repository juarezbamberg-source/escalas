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

const jsPdfMock = vi.hoisted(() => {
  const chamadas: unknown[] = [];
  const instancias: {
    setFontSize: ReturnType<typeof vi.fn>;
    text: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  }[] = [];
  class JsPDFMock {
    setFontSize = vi.fn();
    text = vi.fn();
    save = vi.fn();
    constructor(options?: unknown) {
      chamadas.push(options);
      instancias.push(this);
    }
  }
  return { chamadas, instancias, JsPDFMock };
});

const autoTableMock = vi.hoisted(() => ({ aplicar: vi.fn() }));

const xlsxMock = vi.hoisted(() => ({
  utils: {
    aoa_to_sheet: vi.fn().mockReturnValue({}),
    book_new: vi.fn().mockReturnValue({}),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

vi.mock("jspdf", () => ({ default: jsPdfMock.JsPDFMock, jsPDF: jsPdfMock.JsPDFMock }));
vi.mock("jspdf-autotable", () => ({ default: autoTableMock.aplicar }));
vi.mock("xlsx", () => xlsxMock);

describe("exportar escala", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("gera PDF em paisagem com tabela via autotable", () => {
    exportarEscalaPdf(linhas, recorte);

    expect(jsPdfMock.chamadas).toContainEqual({ orientation: "landscape" });
    expect(autoTableMock.aplicar).toHaveBeenCalledTimes(1);
    expect(jsPdfMock.instancias[0]?.save).toHaveBeenCalledWith("escala-manha.pdf");
  });

  it("gera planilha Excel com cabecalho e linhas", () => {
    exportarEscalaExcel(linhas, recorte);

    expect(xlsxMock.utils.aoa_to_sheet).toHaveBeenCalledTimes(1);
    expect(xlsxMock.utils.book_append_sheet).toHaveBeenCalledTimes(1);
    expect(xlsxMock.writeFile).toHaveBeenCalledWith(expect.anything(), "escala-manha.xlsx");
  });
});
