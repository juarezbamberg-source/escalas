import type { StatusVisual } from "../types/api";

export type EscalaSignalSource = {
  forcada: boolean;
  justificativa_override: string | null;
  professor_substituto_nome: string | null;
  professor_titular_nome: string | null;
  status_visual: StatusVisual;
};

export type RowSignal = {
  label: string;
  tone: "verde" | "vermelho" | "amarelo" | "roxo" | "accent";
};

export type SignalExplanation = {
  badges: RowSignal[];
  labels: string[];
  reasons: string[];
  summary: string;
};

const toneByStatus: Record<StatusVisual, RowSignal["tone"]> = {
  VERDE: "verde",
  VERMELHO: "vermelho",
  AMARELO: "amarelo",
  ROXO: "roxo",
};

function buildReasonLabels(source: EscalaSignalSource) {
  const labels: string[] = [];

  if (source.status_visual === "VERMELHO") {
    labels.push("Conflito");
  }
  if (!source.professor_titular_nome) {
    labels.push("Lacuna");
  }
  if (!source.professor_substituto_nome && source.status_visual !== "VERDE") {
    labels.push("Sem substituto");
  }
  if (source.professor_substituto_nome) {
    labels.push("Substituicao");
  }
  if (source.forcada) {
    labels.push("Override");
  }
  if (labels.length === 0 && source.status_visual === "VERDE") {
    labels.push("Padrao");
  }

  return labels;
}

function buildReasonSentences(source: EscalaSignalSource) {
  const reasons: string[] = [];

  if (source.status_visual === "VERMELHO") {
    reasons.push("Professor em conflito de horario neste turno e data.");
  }
  if (!source.professor_titular_nome) {
    reasons.push("Turma sem professor titular definido.");
  }
  if (!source.professor_substituto_nome && source.status_visual !== "VERDE") {
    reasons.push("Ainda nao ha professor substituto informado para cobrir o contexto atual.");
  }
  if (source.professor_substituto_nome) {
    reasons.push("Existe substituicao registrada para esta alocacao.");
  }
  if (source.forcada) {
    reasons.push(
      source.justificativa_override
        ? `Override registrado com justificativa: ${source.justificativa_override}`
        : "Override registrado para manter a alocacao mesmo com restricoes operacionais.",
    );
  }
  if (reasons.length === 0 && source.status_visual === "VERDE") {
    reasons.push("Alocacao estavel, sem pendencias visiveis no recorte atual.");
  }

  return reasons;
}

function buildSummary(labels: string[]) {
  if (labels.length === 0) {
    return "Sem sinais adicionais";
  }
  if (labels.length === 1) {
    return labels[0];
  }
  return `${labels[0]} +${labels.length - 1} motivo(s)`;
}

export function buildSignalExplanation(source: EscalaSignalSource): SignalExplanation {
  const labels = buildReasonLabels(source);
  const reasons = buildReasonSentences(source);
  const badges: RowSignal[] = [{ label: source.status_visual, tone: toneByStatus[source.status_visual] }];

  labels.forEach((label) => {
    const tone: RowSignal["tone"] =
      label === "Conflito"
        ? "vermelho"
        : label === "Lacuna" || label === "Sem substituto"
          ? "amarelo"
          : label === "Substituicao"
            ? "roxo"
            : label === "Override"
              ? "accent"
              : "verde";

    badges.push({ label, tone });
  });

  return {
    badges,
    labels,
    reasons,
    summary: buildSummary(labels),
  };
}

export function buildPrimaryActionReason(source: EscalaSignalSource) {
  if (!source.professor_titular_nome) {
    return "sem professor titular definido";
  }
  if (source.status_visual === "VERMELHO" && !source.professor_substituto_nome) {
    return "conflito ativo sem cobertura informada";
  }
  if (source.forcada) {
    return "override exige revisao assistida";
  }
  if (source.professor_substituto_nome) {
    return "substituicao ja registrada no item";
  }
  return "ajuste operacional mais provavel neste contexto";
}
