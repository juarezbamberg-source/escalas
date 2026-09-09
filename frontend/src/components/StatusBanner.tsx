import { useAppStatus } from "../app/AppStatusContext";

export function StatusBanner() {
  const { errorMessage, successMessage, clearMessages } = useAppStatus();

  if (!errorMessage && !successMessage) {
    return null;
  }

  return (
    <div className={`status-banner ${errorMessage ? "status-banner--error" : "status-banner--success"}`} role="status">
      <div>
        <strong>{errorMessage ? "Falha de integracao" : "Operacao concluida"}</strong>
        <p>{errorMessage ?? successMessage}</p>
      </div>
      <button type="button" className="ghost-button" onClick={clearMessages}>
        Fechar
      </button>
    </div>
  );
}
