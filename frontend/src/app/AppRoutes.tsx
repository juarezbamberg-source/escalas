import { useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { StatusBanner } from "../components/StatusBanner";
import { DashboardPage } from "../pages/DashboardPage";
import { CadastrosPage } from "../pages/CadastrosPage";
import { EscalaPage } from "../pages/EscalaPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { TrocarSenhaPage } from "../pages/TrocarSenhaPage";
import { UsuariosPage } from "../pages/UsuariosPage";
import { AtribuicoesPage } from "../pages/AtribuicoesPage";
import { MinhasAtribuicoesPage } from "../pages/MinhasAtribuicoesPage";
import { clearSession, getStoredUser } from "../lib/auth";
import { useAppStatus } from "./AppStatusContext";

// Onda 11 (RF-04): sidebar agrupada por tarefa. Cada grupo e uma lista de
// itens; a visibilidade por funcao e controlada por `funcoes`.
type NavItem = { to: string; label: string; end?: boolean; funcoes?: string[] };
type NavGroup = { titulo: string; itens: NavItem[] };

const navGroups: NavGroup[] = [
  {
    titulo: "Operacao",
    itens: [
      { to: "/", label: "Visao Geral", end: true },
      { to: "/dashboard", label: "Dashboard de Graficos" },
      { to: "/escala", label: "Escala por Turno", funcoes: ["admin", "coordenacao"] },
      {
        to: "/atribuicoes",
        label: "Atribuicoes",
        funcoes: ["admin", "coordenacao"],
      },
      { to: "/minhas-atribuicoes", label: "Minhas Atribuicoes", funcoes: ["professor"] },
    ],
  },
  {
    titulo: "Cadastros",
    itens: [
      {
        to: "/cadastros/professores",
        label: "Professores",
        funcoes: ["admin", "coordenacao"],
      },
      { to: "/cadastros/turmas", label: "Turmas", funcoes: ["admin", "coordenacao"] },
      { to: "/cadastros/ucs", label: "Unidades Curriculares", funcoes: ["admin", "coordenacao"] },
      {
        to: "/cadastros/alocacoes",
        label: "Alocacoes",
        funcoes: ["admin", "coordenacao"],
      },
    ],
  },
  {
    titulo: "Administracao",
    itens: [{ to: "/usuarios", label: "Usuarios", funcoes: ["admin"] }],
  },
];

function itensVisiveis(grupos: NavGroup[], funcao: string | undefined): NavGroup[] {
  return grupos
    .map((grupo) => ({
      ...grupo,
      itens: grupo.itens.filter((item) => !item.funcoes || (funcao && item.funcoes.includes(funcao))),
    }))
    .filter((grupo) => grupo.itens.length > 0);
}

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
  const [menuAberto, setMenuAberto] = useState(false);

  // Onda 8 (ADR-008): rotas operacionais bloqueadas para professor no backend;
  // o frontend redireciona em vez de exibir a pagina quebrando com 403.
  const rotasRestritas = ["/escala", "/cadastros"];
  if (
    usuario?.funcao === "professor" &&
    rotasRestritas.some((rota) => window.location.pathname.startsWith(rota))
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  function sair() {
    clearSession();
    navigate("/login");
  }

  const grupos = itensVisiveis(navGroups, usuario?.funcao);

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          type="button"
          className="menu-toggle ghost-button"
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto((aberto) => !aberto)}
        >
          ☰ Menu
        </button>
        <div className="app-header__titulo">
          <strong>Sistema de Escala de Professores</strong>
          <span>SENAC-RS • Gravatai • Tecnico em Informatica</span>
        </div>
        <div className="app-header__usuario">
          <span className="hero__pulse" aria-live="polite">
            <span className={`hero__status ${pendingRequests > 0 ? "hero__status--busy" : ""}`} />
            {pendingRequests > 0
              ? "Sincronizando com a API"
              : `${usuario?.nome ?? "Usuario"} • ${usuario?.funcao ?? ""}`}
          </span>
          <button className="ghost-button" type="button" onClick={sair}>
            Sair
          </button>
        </div>
      </header>
      <div className="app-body">
        <nav
          className={`app-sidebar${menuAberto ? " app-sidebar--aberta" : ""}`}
          aria-label="Navegacao principal"
        >
          {grupos.map((grupo) => (
            <div key={grupo.titulo} className="app-sidebar__grupo">
              <p className="app-sidebar__titulo">{grupo.titulo}</p>
              {grupo.itens.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `app-sidebar__link${isActive ? " app-sidebar__link--active" : ""}`
                  }
                  onClick={() => setMenuAberto(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        {menuAberto ? (
          <button
            type="button"
            className="app-sidebar__overlay"
            aria-label="Fechar menu"
            onClick={() => setMenuAberto(false)}
          />
        ) : null}
        <main className="page-frame">
          <StatusBanner />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/escala" element={<EscalaPage />} />
            <Route path="/cadastros" element={<Navigate to="/cadastros/professores" replace />} />
            <Route path="/cadastros/professores" element={<CadastrosPage secao="professores" />} />
            <Route path="/cadastros/turmas" element={<CadastrosPage secao="turmas" />} />
            <Route path="/cadastros/ucs" element={<CadastrosPage secao="ucs" />} />
            <Route path="/cadastros/alocacoes" element={<CadastrosPage secao="alocacoes" />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/atribuicoes" element={<AtribuicoesPage />} />
            <Route path="/minhas-atribuicoes" element={<MinhasAtribuicoesPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/trocar-senha" element={<TrocarSenhaPage />} />
      <Route path="*" element={<ProtectedRoutes />} />
    </Routes>
  );
}
