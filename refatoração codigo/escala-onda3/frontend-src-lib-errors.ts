import { ApiError } from "./api";

/**
 * Normaliza a mensagem de erro exibida ao operador.
 * Antes duplicada em EscalaPage, CadastrosPage e EscalaActionDrawer;
 * agora fonte unica.
 */
export function readErrorMessage(
  error: unknown,
  fallback = "Nao foi possivel concluir a operacao. Tente novamente.",
): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return fallback;
}
