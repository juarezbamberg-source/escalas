import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { StatusBanner } from "../components/StatusBanner";
import { DashboardPage } from "../pages/DashboardPage";
import { CadastrosPage } from "../pages/CadastrosPage";
import { EscalaPage } from "../pages/EscalaPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { TrocarSenhaPage } from "../pages/TrocarSenhaPage";
import { UsuariosPage } from "../pages/UsuariosPage";
import { clearSession, getStoredUser } from "../lib/auth";
import { useAppStatus } from "./AppStatusContext";

const navItems = [
  { to: "/", label: "Visao Geral", end: true },
  { to: "/escala", label: "Escala por Turno" },
  { to: "/cadastros", label: "Cadastros e Alocacoes" },
  { to: "/dashboard", label: "Dashboard de Graficos" },
];

const adminNavItems = [{ to: "/usuarios", label: "Usuarios" }];

function ProtectedRoutes() {
  const location = useLocation();
  const usuario = getStoredUser();
  if (!usuario) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (usuario.trocar_senha_no_proximo_acesso) return <Navigate to="/trocar-senha" replace />;
  return <AppShell />;
}

function AppShell() {
  const { pendingRequests } = useAppStatus();
  const navigate = useNavigate();
  const usuario = getStoredUser();

  function sair() {
    clearSession();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__eyebrow">SENAC-RS • Gravatai • Tecnico em Informatica</div>
        <div className="hero__headline">
          <div>
            <h1>Sistema de Escala de Professores</h1>
            <p>Um painel operacional para consultar turnos, registrar alocacoes e substituir as planilhas com integridade.</p>
            <div className="hero__actions"><NavLink to="/dashboard" className="primary-link">Abrir dashboard de graficos</NavLink></div>
          </div>
          <div className="hero__pulse" aria-live="polite"><span className={`hero__status ${pendingRequests > 0 ? "hero__status--busy" : ""}`} />{pendingRequests > 0 ? "Sincronizando com a API" : `${usuario?.nome ?? "Usuario"} • ${usuario?.funcao ?? ""}`}</div>
        </div>
        <nav className="top-nav" aria-label="Navegacao principal">
          {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `top-nav__link${isActive ? " top-nav__link--active" : ""}`}>{item.label}</NavLink>)}
          {usuario?.funcao === "admin" && adminNavItems.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `top-nav__link${isActive ? " top-nav__link--active" : ""}`}>{item.label}</NavLink>)}
          <button className="ghost-button" type="button" onClick={sair}>Sair</button>
        </nav>
      </header>
      <StatusBanner />
      <main className="page-frame"><Routes><Route path="/" element={<HomePage />} /><Route path="/escala" element={<EscalaPage />} /><Route path="/cadastros" element={<CadastrosPage />} /><Route path="/dashboard" element={<DashboardPage />} /><Route path="/usuarios" element={<UsuariosPage />} /></Routes></main>
    </div>
  );
}

export function AppRoutes() {
  return <Routes><Route path="/login" element={<LoginPage />} /><Route path="/trocar-senha" element={<TrocarSenhaPage />} /><Route path="*" element={<ProtectedRoutes />} /></Routes>;
}
