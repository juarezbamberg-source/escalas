import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type AppStatusContextValue = {
  pendingRequests: number;
  errorMessage: string | null;
  successMessage: string | null;
  startLoading: () => void;
  stopLoading: () => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  clearMessages: () => void;
};

const AppStatusContext = createContext<AppStatusContextValue | null>(null);

export function AppStatusProvider({ children }: { children: ReactNode }) {
  const [pendingRequests, setPendingRequests] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const startLoading = useCallback(() => setPendingRequests((current) => current + 1), []);
  const stopLoading = useCallback(() => setPendingRequests((current) => Math.max(0, current - 1)), []);
  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setSuccessMessage(null);
  }, []);
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setErrorMessage(null);
  }, []);
  const clearMessages = useCallback(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  const value = useMemo<AppStatusContextValue>(
    () => ({
      pendingRequests,
      errorMessage,
      successMessage,
      startLoading,
      stopLoading,
      showError,
      showSuccess,
      clearMessages,
    }),
    [clearMessages, errorMessage, pendingRequests, showError, showSuccess, startLoading, stopLoading, successMessage],
  );

  return <AppStatusContext.Provider value={value}>{children}</AppStatusContext.Provider>;
}

export function useAppStatus() {
  const context = useContext(AppStatusContext);
  if (!context) {
    throw new Error("useAppStatus must be used inside AppStatusProvider");
  }
  return context;
}
