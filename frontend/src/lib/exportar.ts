import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Onda 8 (RF-09): exportacao da escala por turno/periodo em PDF e Excel.

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

export function exportarEscalaPdf(linhas: LinhaEscala[], recorte: RecorteEscala): void {
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

export function exportarEscalaExcel(linhas: LinhaEscala[], recorte: RecorteEscala): void {
  const planilha = XLSX.utils.aoa_to_sheet([
    cabecalho(recorte),
    [],
    ["Data", "Turma", "Turno", "Titular", "Substituto", "Forcada", "Status"],
    ...corpoTabela(linhas),
  ]);
  const pasta = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(pasta, planilha, "Escala");
  XLSX.writeFile(pasta, `escala-${recorte.turno}.xlsx`);
}
