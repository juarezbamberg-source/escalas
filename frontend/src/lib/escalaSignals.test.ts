import { describe, expect, it } from "vitest";
import { buildPrimaryActionReason, buildSignalExplanation } from "./escalaSignals";
import type { EscalaSignalSource } from "./escalaSignals";

const base: EscalaSignalSource = {
  forcada: false,
  justificativa_override: null,
  professor_substituto_nome: null,
  professor_titular_nome: "Maria",
  status_visual: "VERDE",
};

describe("buildSignalExplanation", () => {
  it("marca alocacao estavel como Padrao", () => {
    const result = buildSignalExplanation(base);
    expect(result.labels).toContain("Padrao");
    expect(result.badges[0]).toEqual({ label: "VERDE", tone: "verde" });
  });

  it("sinaliza conflito quando status e VERMELHO", () => {
    const result = buildSignalExplanation({ ...base, status_visual: "VERMELHO" });
    expect(result.labels).toContain("Conflito");
  });

  it("sinaliza lacuna quando nao ha titular", () => {
    const result = buildSignalExplanation({
      ...base,
      professor_titular_nome: null,
      status_visual: "AMARELO",
    });
    expect(result.labels).toContain("Lacuna");
    expect(result.labels).toContain("Sem substituto");
  });

  it("sinaliza substituicao quando ha substituto", () => {
    const result = buildSignalExplanation({
      ...base,
      professor_substituto_nome: "Joao",
      status_visual: "ROXO",
    });
    expect(result.labels).toContain("Substituicao");
  });

  it("sinaliza override quando forcada", () => {
    const result = buildSignalExplanation({
      ...base,
      forcada: true,
      justificativa_override: "Cobertura emergencial",
    });
    expect(result.labels).toContain("Override");
    expect(result.reasons.some((reason) => reason.includes("Cobertura emergencial"))).toBe(true);
  });

  it("resume multiplos motivos", () => {
    const result = buildSignalExplanation({
      ...base,
      forcada: true,
      status_visual: "VERMELHO",
    });
    // VERMELHO -> "Conflito", sem substituto -> "Sem substituto", forcada -> "Override".
    // O resumo mantem o primeiro label e contabiliza os demais.
    expect(result.labels).toEqual(["Conflito", "Sem substituto", "Override"]);
    expect(result.summary).toBe("Conflito +2 motivo(s)");
  });
});

describe("buildPrimaryActionReason", () => {
  it("prioriza ausencia de titular", () => {
    expect(buildPrimaryActionReason({ ...base, professor_titular_nome: null })).toBe(
      "sem professor titular definido",
    );
  });

  it("prioriza conflito ativo sem cobertura", () => {
    expect(buildPrimaryActionReason({ ...base, status_visual: "VERMELHO" })).toBe(
      "conflito ativo sem cobertura informada",
    );
  });

  it("prioriza revisao de override", () => {
    expect(buildPrimaryActionReason({ ...base, forcada: true })).toBe(
      "override exige revisao assistida",
    );
  });
});
