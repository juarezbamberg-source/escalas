import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";

import { AppRoutes } from "../app/AppRoutes";
import { AppStatusProvider } from "../app/AppStatusContext";

export function renderApp(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppStatusProvider>
        <AppRoutes />
      </AppStatusProvider>
    </MemoryRouter>,
  );
}
