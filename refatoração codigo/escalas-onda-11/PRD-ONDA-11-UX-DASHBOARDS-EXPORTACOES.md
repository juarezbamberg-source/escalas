# PRD — Onda 11: UX de Navegação, Dashboards com Período e Exportações

## Contexto

Feedback do dono do produto (2026-09-24) após uso real do sistema:

1. **Frontend fora do padrão, difícil de encontrar** — navegação plana (`top-nav`), páginas monolíticas (Cadastros com 1.400 linhas escondendo 3 cadastros; Escala com 1.940), sem agrupamento por tarefa.
2. **Dashboards com "somente uma métrica"** — sem escolha de período; o resumo operacional já aceita `data_inicio`/`data_fim` no backend, mas o frontend nunca envia. A carga realizada não tem filtro de período nem no backend.
3. **Relatórios engessados** — só a Escala exporta; Dashboard e Carga não exportam; não há seletor de período para gráficos e planilhas.

## Objetivo

Tornar o sistema fácil de navegar, com dashboards configuráveis por período e exportações de todos os relatórios, respeitando o recorte de tempo escolhido.

## Requisitos Funcionais

### RF-01 — Carga realizada com filtro de período (backend)
`GET /professores/carga?tipo=realizada` aceita `data_inicio`/`data_fim` (opcional; sem filtro = comportamento atual, retrocompatível). Somente alocações dentro do período entram no cálculo.

### RF-02 — Seletor de período no Dashboard
Componente de período (presets: mês corrente, mês anterior, últimos 30 dias, trimestre, personalizado) aplicado a:
- Resumo operacional (alocações, substituições, turmas, gráficos por turno/turma) — envia `data_inicio`/`data_fim` ao `/dashboard/resumo`.
- Carga realizada — envia período ao `/professores/carga` (RF-01).
- Carga prevista — usa `vigente_em` = data final do período (recorte de vigência).

### RF-03 — Exportações do Dashboard e Carga
Botões Exportar PDF/Excel no Dashboard e na seção de carga, exportando exatamente o que está na tela (gráficos como tabelas + KPIs), com o período no cabeçalho do documento.

### RF-04 — Navegação reorganizada
- Sidebar (desktop) com itens agrupados por tarefa: **Operação** (Dashboard, Escala, Alocações, Atribuições), **Cadastros** (Professores, Turmas, UCs), **Administração** (Usuários — admin-only).
- Cadastros divididos: página própria por entidade (Professores, Turmas, UCs) em vez de um monólito com abas.
- Mobile: sidebar colapsa em menu hambúrguer.
- Rotas novas (`/cadastros/professores` etc.) com redirects das antigas.

### RF-05 — Logout e identidade visíveis
Nome do usuário, função e logout sempre acessíveis (cabeçalho fixo), em qualquer tela.

## Fora de Escopo
- Envelope de paginação server-side (adiado — Onda 10).
- Gráficos além dos existentes (novos tipos de visualização ficam para onda futura).
- Recuperação de senha por e-mail (backlog).

## Critérios de Aceite
- Coordenador consegue ver o resumo de **qualquer período** escolhendo datas; números mudam conforme o recorte.
- Professor continua vendo apenas a própria carga em qualquer período.
- Dashboard e Carga exportam PDF e Excel com o período no cabeçalho.
- Navegação em sidebar com grupos; Cadastros acessível em 1 clique a partir de qualquer tela.
- Testes: backend com cobertura ≥ 93%; frontend tsc/lint limpos; CI verde.
