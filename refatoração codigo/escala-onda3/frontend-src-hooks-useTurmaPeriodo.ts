import { useCallback, useState } from "react";
import { useAppStatus } from "../app/AppStatusContext";
import { api, ApiError } from "../lib/api";
import type { AlocacaoTurmaPeriodoItem, Turno } from "../types/api";

export type TurmaPeriodoQueryState = {
  turmaId: string;
  dataInicial: string;
  dataFinal: string;
  turno: "" | Turno;
  exibirSubstituicoes: boolean;
};

export type TurmaPeriodoQueryResultState = {
  loading: boolean;
  rows: AlocacaoTurmaPeriodoItem[];
  submitted: boolean;
};

export const defaultTurmaPeriodoQuery: TurmaPeriodoQueryState = {
  turmaId: "",
  dataInicial: "",
  dataFinal: "",
  turno: "",
  exibirSubstituicoes: true,
};

/**
 * Hook da consulta por turma e periodo.
 * Extraido do EscalaPage.tsx.
 */
export function useTurmaPeriodo() {
  const [query, setQuery] = useState<TurmaPeriodoQueryState>(defaultTurmaPeriodoQuery);
  const [result, setResult] = useState<TurmaPeriodoQueryResultState>({
    loading: false,
    rows: [],
    submitted: false,
  });
  const { showError } = useAppStatus();

  const updateQuery = useCallback(<K extends keyof TurmaPeriodoQueryState>(key: K, value: TurmaPeriodoQueryState[K]) => {
    setQuery((current) => ({ ...current, [key]: value }));
  }, []);

  const submit = useCallback(async () => {
    if (!query.turmaId) {
      showError("Selecione uma turma para consultar o professor da turma.");
      return;
    }
    if (!query.dataInicial || !query.dataFinal) {
      showError("Informe a data inicial e a data final da consulta por turma.");
      return;
    }
    setResult({ loading: true, rows: [], submitted: true });
    try {
      const rows = await api.listAlocacoesTurmaPeriodo({
        turma_id: Number(query.turmaId),
        data_inicial: query.dataInicial,
        data_final: query.dataFinal,
        turno: query.turno || undefined,
      });
      setResult({ loading: false, rows, submitted: true });
    } catch (error) {
      setResult({ loading: false, rows: [], submitted: true });
      showError(error instanceof ApiError ? error.message : "Nao foi possivel consultar o periodo da turma.");
    }
  }, [query, showError]);

  return { query, result, updateQuery, submit };
}
