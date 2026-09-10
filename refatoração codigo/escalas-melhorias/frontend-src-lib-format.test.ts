import { describe, expect, it } from "vitest";
import { buildDateRangeFromBounds, buildFallbackDates, formatDate, toIsoDate } from "./format";

describe("formatDate", () => {
  it("converte ISO yyyy-mm-dd para dd/mm/yyyy", () => {
    expect(formatDate("2026-09-09")).toBe("09/09/2026");
  });
});

describe("toIsoDate", () => {
  it("serializa data local sem deslocamento de fuso horário", () => {
    const date = new Date(2026, 8, 9, 0, 0, 0);
    expect(toIsoDate(date)).toBe("2026-09-09");
  });
});

describe("buildDateRangeFromBounds", () => {
  it("gera intervalo inclusivo de datas", () => {
    expect(buildDateRangeFromBounds("2026-09-01", "2026-09-03")).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ]);
  });

  it("não desloca datas por fuso (regressão do bug de toISOString)", () => {
    expect(buildDateRangeFromBounds("2026-01-31", "2026-02-02")).toEqual([
      "2026-01-31",
      "2026-02-01",
      "2026-02-02",
    ]);
  });

  it("retorna lista vazia para intervalo inválido", () => {
    expect(buildDateRangeFromBounds("2026-09-05", "2026-09-01")).toEqual([]);
    expect(buildDateRangeFromBounds("", "2026-09-01")).toEqual([]);
  });
});

describe("buildFallbackDates", () => {
  it("gera 5 datas a partir de hoje", () => {
    expect(buildFallbackDates()).toHaveLength(5);
  });
});
