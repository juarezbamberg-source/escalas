import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "./app/AppRoutes";
import { AppStatusProvider } from "./app/AppStatusContext";
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppStatusProvider>
        <AppRoutes />
      </AppStatusProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
