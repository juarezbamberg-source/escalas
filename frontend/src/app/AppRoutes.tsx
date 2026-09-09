import { NavLink, Route, Routes } from "react-router-dom";

import { HomePage } from "../pages/HomePage";
import { CadastrosPage } from "../pages/CadastrosPage";
import { EscalaPage } from "../pages/EscalaPage";
import { DashboardPage } from "../pages/DashboardPage";
import { StatusBanner } from "../components/StatusBanner";
import { useAppStatus } from "./AppStatusContext";

const navItems = [
  { to: "/", label: "Visao Geral", end: true },
  { to: "/escala", label: "Escala por Turno" },
  { to: "/cadastros", label: "Cadastros e Alocacoes" },
  { to: "/dashboard", label: "Dashboard de Graficos" },
];

export function AppRoutes() {
  const { pendingRequests } = useAppStatus();

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__eyebrow">SENAC-RS • Gravatai • Tecnico em Informatica</div>
        <div className="hero__headline">
          <div>
            <h1>Sistema de Escala de Professores</h1>
            <p>
              Um painel operacional para consultar turnos, registrar alocacoes e substituir as planilhas com
              integridade.
            </p>
            <div className="hero__actions">
              <NavLink to="/dashboard" className="primary-link">
                Abrir dashboard de graficos
              </NavLink>
            </div>
          </div>
          <div className="hero__pulse" aria-live="polite">
            <span className={`hero__status ${pendingRequests > 0 ? "hero__status--busy" : ""}`} />
            {pendingRequests > 0 ? "Sincronizando com a API" : "API pronta"}
          </div>
        </div>
        <nav className="top-nav" aria-label="Navegacao principal">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `top-nav__link${isActive ? " top-nav__link--active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <StatusBanner />

      <main className="page-frame">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/escala" element={<EscalaPage />} />
          <Route path="/cadastros" element={<CadastrosPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
    </div>
  );
}
