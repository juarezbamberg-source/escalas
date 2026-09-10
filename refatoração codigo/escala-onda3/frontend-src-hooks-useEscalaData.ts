import { useCallback, useEffect, useState } from "react";
import { useAppStatus } from "../app/AppStatusContext";
import { api, ApiError } from "../lib/api";
import { buildDateRangeFromBounds, buildFallbackDates } from "../lib/format";
import type { Alocacao, CalendarioItem, Professor, Turma, Turno } from "../types/api";

/**
 * Hook de carregamento dos dados da escala (alocacoes, calendario, professores e turmas).
 * Extraido do EscalaPage.tsx para permitir teste isolado e reuso.
 */
export function useEscalaData(turno: Turno, reloadKey: number) {
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
  const [calendario, setCalendario] = useState<CalendarioItem[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const { startLoading, stopLoading, showError, clearMessages } = useAppStatus();

  const reload = useCallback(() => {
    setReloadKeyInternal((current) => current + 1);
  }, []);

  const [reloadKeyInternal, setReloadKeyInternal] = useState(reloadKey);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      clearMessages();
      startLoading();
      try {
        const grade = await api.listAlocacoes(turno);
        const orderedDates = Array.from(new Set(grade.map((item) => item.data))).sort((a, b) =>
          a.localeCompare(b),
        );
        const dates =
          orderedDates.length > 0
            ? buildDateRangeFromBounds(orderedDates[0], orderedDates[orderedDates.length - 1])
            : buildFallbackDates();
        const calendarioResponse = await api.listCalendario(turno, dates);
        const refs = await Promise.allSettled([api.listProfessores(), api.listTurmas()]);

        if (!active) {
          return;
        }

        setAlocacoes(grade);
        setCalendario(calendarioResponse);
        setProfessores(refs[0].status === "fulfilled" ? refs[0].value : []);
        setTurmas(refs[1].status === "fulfilled" ? refs[1].value : []);

        if (refs[0].status === "rejected" || refs[1].status === "rejected") {
          showError("Nao foi possivel carregar professores ou turmas. Verifique se o backend esta no ar.");
        }
      } catch (error) {
        if (active) {
          showError(
            error instanceof ApiError
              ? error.message
              : "Nao foi possivel carregar a escala agora. Tente novamente em instantes.",
          );
          setAlocacoes([]);
          setCalendario([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
        stopLoading();
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [clearMessages, reloadKeyInternal, showError, startLoading, stopLoading, turno]);

  return { alocacoes, calendario, professores, turmas, loading, reload };
}
