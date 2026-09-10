import { useCallback, useState } from "react";
import { useAppStatus } from "../app/AppStatusContext";
import { api, ApiError } from "../lib/api";
import type { AlocacaoBulkDeleteResponse } from "../types/api";

export type BulkRemovalState = {
  loading: boolean;
  submitting: boolean;
  preview: AlocacaoBulkDeleteResponse | null;
  confirmed: boolean;
};

/**
 * Hook de selecao em lote e remocao com preview + confirmacao.
 * Extraido do EscalaPage.tsx.
 */
export function useBulkRemoval() {
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  const [bulkRemoval, setBulkRemoval] = useState<BulkRemovalState>({
    loading: false,
    submitting: false,
    preview: null,
    confirmed: false,
  });
  const { showError, showSuccess } = useAppStatus();

  const toggleRowSelection = useCallback((rowId: number) => {
    setSelectedRowIds((current) =>
      current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId],
    );
  }, []);

  const toggleSelectVisibleRows = useCallback((selectableRowIds: number[], allVisibleSelected: boolean) => {
    setSelectedRowIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !selectableRowIds.includes(id));
      }
      return Array.from(new Set([...current, ...selectableRowIds]));
    });
  }, []);

  const prepareBulkRemoval = useCallback(async () => {
    if (selectedRowIds.length === 0) {
      showError("Selecione pelo menos uma alocacao antes de preparar a remocao em lote.");
      return;
    }
    setBulkRemoval((current) => ({ ...current, loading: true, preview: null, confirmed: false }));
    try {
      const preview = await api.deleteAlocacoesBulk({ alocacao_ids: selectedRowIds, confirmar: false });
      setBulkRemoval((current) => ({ ...current, loading: false, preview }));
    } catch (error) {
      setBulkRemoval((current) => ({ ...current, loading: false }));
      showError(error instanceof ApiError ? error.message : "Nao foi possivel preparar a remocao em lote.");
    }
  }, [selectedRowIds, showError]);

  const confirmBulkRemoval = useCallback(async () => {
    if (!bulkRemoval.preview) {
      return;
    }
    setBulkRemoval((current) => ({ ...current, submitting: true }));
    try {
      const result = await api.deleteAlocacoesBulk({ alocacao_ids: selectedRowIds, confirmar: true });
      showSuccess(`${result.total_removido} alocacao(oes) removida(s) em lote com seguranca.`);
      setSelectedRowIds([]);
      setBulkRemoval({ loading: false, submitting: false, preview: null, confirmed: false });
    } catch (error) {
      showError(error instanceof ApiError ? error.message : "Nao foi possivel concluir a remocao em lote.");
      setBulkRemoval((current) => ({ ...current, submitting: false }));
    }
  }, [bulkRemoval.preview, selectedRowIds, showError, showSuccess]);

  return {
    selectedRowIds,
    setSelectedRowIds,
    bulkRemoval,
    setBulkRemoval,
    toggleRowSelection,
    toggleSelectVisibleRows,
    prepareBulkRemoval,
    confirmBulkRemoval,
  };
}
