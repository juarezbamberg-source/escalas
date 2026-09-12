import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";

import { AppRoutes } from "../app/AppRoutes";
import { AppStatusProvider } from "../app/AppStatusContext";
import { storeSession } from "../lib/auth";

export function renderApp(initialEntry = "/", authenticated = true) {
  if (authenticated) {
    storeSession("token-de-teste", {
    id: 1,
    nome: "Administrador de Teste",
    username: "admin_fixture",
    funcao: "admin",
    ativo: true,
    trocar_senha_no_proximo_acesso: false,
    professor_id: null,
    });
  }

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppStatusProvider>
        <AppRoutes />
      </AppStatusProvider>
    </MemoryRouter>,
  );
}
