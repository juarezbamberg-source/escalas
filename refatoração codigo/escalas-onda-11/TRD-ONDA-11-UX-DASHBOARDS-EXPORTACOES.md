# TRD — Onda 11: UX de Navegação, Dashboards com Período e Exportações

## Visão técnica

Três frentes independentes, fatiadas em PRs separados. F1 é backend; F2 e F3 são frontend puro; F4 (navegação) é o maior refactor frontend e vai por último para não gerar conflitos.

## F1 — Backend: período na carga realizada (PR 1 da onda)

**Endpoint**: `GET /professores/carga?tipo=realizada&data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD`

- `app/services/carga.py` → `calcular_carga_por_professor(db, data_inicio: date | None = None, data_fim: date | None = None)`:
  - Quando ambos ausentes: comportamento atual (todas as alocações) — retrocompatível.
  - Quando informados: filtro `Alocacao.data >= data_inicio` e `Alocacao.data <= data_fim` na query.
- `app/api/routes/carga.py`: novos parâmetros `Query(default=None)` repassados ao service.
- Sem migração (colunas de data já existem em `Alocacao`).
- Testes: carga com período parcial, período sem dados, sem período (retrocompat), professor com filtro aplicado.

## F2 — Frontend: seletor de período + exportações no Dashboard (PR 2)

**Componente novo** `frontend/src/components/PeriodoSelector.tsx`:
- Props: `value: {inicio: string; fim: string}`, `onChange`, `presets` (lista de {label, calcula()}).
- Presets: Mês corrente (default), Mês anterior, Últimos 30 dias, Trimestre, Personalizado (2 `input type="date"`).
- Padrão visual dos filtros existentes (`.filters-row`).

**DashboardPage**:
- Estado `periodo` alimentando as 3 consultas:
  - `api.dashboardResumo(periodo.inicio, periodo.fim)` — assinatura já existe em `api.ts` (parâmetros opcionais).
  - `api.listCargaProfessores("realizada", periodo.inicio, periodo.fim)` — estender assinatura em `api.ts`.
  - `api.listCargaProfessores("prevista", undefined, periodo.fim)` — `vigente_em` = fim do período.
- `useEffect` depende de `periodo` — troca de período recarrega.
- KPIs existentes ganham o recorte no título (`Resumo de 01/09/2026 a 30/09/2026` já existe; adicionar aos demais cards).

**Exportações** (`lib/exportar.ts` — estender):
- `exportarDashboardPdf(excel)`: KPIs + tabela carga por professor + tabela resumo operacional, com período no cabeçalho; reutiliza os chunks lazy de jspdf/xlsx (Onda 10).
- `exportarCargaPdf(excel)`: tabela de carga (realizada ou prevista) com período.
- Botões nas telas com `void` handler (padrão Onda 10).
- Testes: mock de `api` com período, asserções de chamada com query params; exportações com dados fake.

## F3 — Frontend: revisão visual de padrão (PR 3)

- Padronização de `SectionCard` (eyebrow/título/descrição) em todas as páginas — hoje Escala e Cadastros têm layouts próprios divergentes.
- Consistência de botões (`.primary-button`, `.ghost-button`), estados vazios (`state-message`) e mensagens de carregamento.
- Sem mudança de rota nem de comportamento — só CSS + pequenos ajustes de JSX.
- Testes: apenas ajustes de seletores se necessário.

## F4 — Frontend: navegação e split de Cadastros (PR 4)

**AppRoutes**:
- `navItems` reescritos em 3 grupos: Operação (Dashboard, Escala, Alocações, Atribuições), Cadastros (Professores, Turmas, UCs), Administração (Usuários, admin-only).
- Sidebar desktop (`app-sidebar` em `app.css`): largura fixa 240px, grupos com rótulo, item ativo com destaque; `app-shell` vira grid `sidebar + conteúdo`.
- Mobile (< 900px): sidebar some, botão hambúrguer no header abre drawer overlay.
- Header fixo: nome/função do usuário + logout (já existentes, movidos para o header).

**Split de CadastrosPage (1.400 linhas) em 3 páginas**:
- `ProfessoresPage`, `TurmasPage`, `UnidadesCurricularesPage` — cada uma com sua busca, filtro de status, paginação, formulário e exportação (componentes de tabela já são reaproveitáveis).
- Rotas: `/cadastros/professores`, `/cadastros/turmas`, `/cadastros/ucs`; redirect `/cadastros` → `/cadastros/professores`.
- `CadastrosPage.test.tsx` (542 linhas) é dividido em 3 arquivos de teste, um por página.
- Nenhum teste de comportamento perdido — somente reorganizados.

**Riscos**:
- `EscalaPage` (1.940 linhas) NÃO é tocada nesta onda (só o drawer de navegação ao redor) — split dela só se houver demanda.
- Testes de rota (`AppRoutes.test.tsx`) precisam de atualização de paths.
- `localStorage` de sessão não muda — logout/redirect intactos.

## Ordem dos PRs
1. F1 backend (período na carga) — desbloqueia F2.
2. F2 dashboard período + exportações.
3. F3 padrão visual.
4. F4 navegação + split de cadastros (maior, isolado por último).

## Validação
- Backend: pytest cobertura ≥ 93%.
- Frontend: `tsc --noEmit`, ESLint 0 erros, Vitest, build Vite (bundle principal continua ~371 kB — exportações reutilizam chunks lazy).
- CI verde em cada PR.
- Validação manual do dono no Windows: escolher período no dashboard, exportar, navegar na nova sidebar.
