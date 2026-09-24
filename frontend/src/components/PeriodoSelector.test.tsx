import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PeriodoSelector, PRESETS_PADRAO } from "./PeriodoSelector";

describe("PeriodoSelector", () => {
  it("renderiza os presets e as datas do periodo atual", () => {
    const onChange = vi.fn();
    render(
      <PeriodoSelector value={{ inicio: "2026-09-01", fim: "2026-09-24" }} onChange={onChange} />,
    );

    expect(screen.getByRole("tab", { name: "Mês corrente" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Mês anterior" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Últimos 30 dias" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Trimestre" })).toBeTruthy();
    expect((screen.getByLabelText("Data inicial") as HTMLInputElement).value).toBe("2026-09-01");
    expect((screen.getByLabelText("Data final") as HTMLInputElement).value).toBe("2026-09-24");
  });

  it("aplica preset ao clicar", () => {
    const onChange = vi.fn();
    render(
      <PeriodoSelector value={{ inicio: "2026-09-01", fim: "2026-09-24" }} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Mês anterior" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const periodo = onChange.mock.calls[0][0] as { inicio: string; fim: string };
    expect(periodo.fim.endsWith("-01") || periodo.fim.length === 10).toBe(true);
    expect(periodo.inicio < periodo.fim).toBe(true);
  });

  it("marca preset personalizado quando datas nao batem com nenhum preset", () => {
    render(
      <PeriodoSelector value={{ inicio: "2026-01-10", fim: "2026-02-20" }} onChange={vi.fn()} />,
    );

    const mesCorrente = screen.getByRole("tab", { name: "Mês corrente" });
    expect(mesCorrente.getAttribute("aria-selected")).toBe("false");
  });

  it("presets padrao produzem periodos validos", () => {
    for (const preset of PRESETS_PADRAO) {
      const periodo = preset.calcular();
      expect(periodo.inicio).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(periodo.fim).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(periodo.inicio <= periodo.fim).toBe(true);
    }
  });
});
