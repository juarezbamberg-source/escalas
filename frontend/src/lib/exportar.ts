// Onda 10 (code-split): jsPDF e xlsx sao carregados sob demanda (dynamic import),
// tirando ~700kB do bundle inicial; os chunks baixam apenas no clique em Exportar.

export type LinhaEscala = {
  turma_codigo: string;
  data: string;
  turno: string;
  professor_titular_nome: string | null;
  professor_substituto_nome: string | null;
  forcada: boolean;
  status_visual: string;
};

export type RecorteEscala = {
  turno: string;
  dataInicio: string;
  dataFim: string;
};

function linhasOrdenadas(linhas: LinhaEscala[]): LinhaEscala[] {
  return [...linhas].sort(
    (left, right) =>
      left.data.localeCompare(right.data) || left.turma_codigo.localeCompare(right.turma_codigo),
  );
}

function cabecalho(recorte: RecorteEscala): string[] {
  const periodo =
    recorte.dataInicio || recorte.dataFim
      ? `Periodo: ${recorte.dataInicio || "..."} a ${recorte.dataFim || "..."}`
      : "Periodo: completo";
  return [`Escala por turno - ${recorte.turno}`, periodo];
}

function corpoTabela(linhas: LinhaEscala[]): string[][] {
  return linhasOrdenadas(linhas).map((linha) => [
    formatarData(linha.data),
    linha.turma_codigo,
    linha.turno,
    linha.professor_titular_nome ?? "-",
    linha.professor_substituto_nome ?? "-",
    linha.forcada ? "Sim" : "Nao",
    linha.status_visual,
  ]);
}

function formatarData(iso: string): string {
  if (!iso) return "-";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export async function exportarEscalaPdf(linhas: LinhaEscala[], recorte: RecorteEscala): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape" });
  const [titulo, periodo] = cabecalho(recorte);

  doc.setFontSize(14);
  doc.text(titulo, 14, 16);
  doc.setFontSize(10);
  doc.text(periodo, 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [["Data", "Turma", "Turno", "Titular", "Substituto", "Forcada", "Status"]],
    body: corpoTabela(linhas),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`escala-${recorte.turno}.pdf`);
}

export async function exportarEscalaExcel(linhas: LinhaEscala[], recorte: RecorteEscala): Promise<void> {
  const xlsx = await import("xlsx");

  const planilha = xlsx.utils.aoa_to_sheet([
    cabecalho(recorte),
    [],
    ["Data", "Turma", "Turno", "Titular", "Substituto", "Forcada", "Status"],
    ...corpoTabela(linhas),
  ]);
  const pasta = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(pasta, planilha, "Escala");
  xlsx.writeFile(pasta, `escala-${recorte.turno}.xlsx`);
}

// --- Onda 11 (RF-03): exportacoes do Dashboard e da Carga, com periodo no cabecalho ---

export type LinhaCarga = {
  professor_nome: string;
  horas: number;
  detalhe: string;
};

export type LinhaResumo = {
  titulo: string;
  valor: string;
};

function periodoTexto(periodo: PeriodoExportacao): string {
  return `Periodo: ${periodo.inicio.split("-").reverse().join("/")} a ${periodo.fim
    .split("-")
    .reverse()
    .join("/")}`;
}

export type PeriodoExportacao = { inicio: string; fim: string };

export async function exportarCargaPdf(
  linhas: LinhaCarga[],
  periodo: PeriodoExportacao,
  titulo: string,
): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(titulo, 14, 16);
  doc.setFontSize(10);
  doc.text(periodoTexto(periodo), 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [["Professor", "Horas", "Detalhe"]],
    body: linhas.map((linha) => [linha.professor_nome, String(linha.horas), linha.detalhe]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save("carga-professores.pdf");
}

export async function exportarCargaExcel(
  linhas: LinhaCarga[],
  periodo: PeriodoExportacao,
  titulo: string,
): Promise<void> {
  const xlsx = await import("xlsx");

  const planilha = xlsx.utils.aoa_to_sheet([
    [titulo],
    [periodoTexto(periodo)],
    [],
    ["Professor", "Horas", "Detalhe"],
    ...linhas.map((linha) => [linha.professor_nome, linha.horas, linha.detalhe]),
  ]);
  const pasta = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(pasta, planilha, "Carga");
  xlsx.writeFile(pasta, "carga-professores.xlsx");
}

export async function exportarDashboardPdf(
  resumo: LinhaResumo[],
  carga: LinhaCarga[],
  periodo: PeriodoExportacao,
): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Dashboard operacional", 14, 16);
  doc.setFontSize(10);
  doc.text(periodoTexto(periodo), 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [["Indicador", "Valor"]],
    body: resumo.map((linha) => [linha.titulo, linha.valor]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  const ultimaLinha = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  autoTable(doc, {
    startY: (ultimaLinha?.finalY ?? 28) + 8,
    head: [["Professor", "Horas", "Detalhe"]],
    body: carga.map((linha) => [linha.professor_nome, String(linha.horas), linha.detalhe]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save("dashboard-operacional.pdf");
}

export async function exportarDashboardExcel(
  resumo: LinhaResumo[],
  carga: LinhaCarga[],
  periodo: PeriodoExportacao,
): Promise<void> {
  const xlsx = await import("xlsx");

  const planilha = xlsx.utils.aoa_to_sheet([
    ["Dashboard operacional"],
    [periodoTexto(periodo)],
    [],
    ["Indicador", "Valor"],
    ...resumo.map((linha) => [linha.titulo, linha.valor]),
    [],
    ["Professor", "Horas", "Detalhe"],
    ...carga.map((linha) => [linha.professor_nome, linha.horas, linha.detalhe]),
  ]);
  const pasta = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(pasta, planilha, "Dashboard");
  xlsx.writeFile(pasta, "dashboard-operacional.xlsx");
}
