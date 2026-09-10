# Memória Final do Projeto — Escalas (SENAC-RS Gravataí)

*Histórico completo da revisão técnica e das quatro ondas de melhorias — 10/09/2026*

---

## 1. Visão Geral do Projeto

Sistema web de gestão de escalas de professores do Curso Técnico em Informática do SENAC-RS (unidade Gravataí), criado para substituir o controle por planilhas Excel por uma aplicação transacional com integridade referencial, bloqueio de conflitos e histórico auditável.

- **Repositório:** github.com/juarezbamberg-source/escalas (público, branch main)
- **Backend:** FastAPI + SQLAlchemy + Pydantic + SQLite
- **Frontend:** React 19 + TypeScript + Vite + React Router 7 + Vitest
- **Planejamento:** OpenSpec; decisões documentadas em ADR01–03

## 2. Objetivo Desta Memória

Registrar, de forma legível por qualquer membro do time, todo o histórico da revisão técnica e das quatro ondas de melhoria, com o estado atual dos artefatos e as próximas ações, sem necessidade de contexto adicional.

## 3. Etapas Executadas (Ordem Cronológica)

1. **Revisão técnica** — leitura direta do código do repositório cobrindo arquitetura, frontend e testes.
2. **Onda 1 — Correções críticas:** bug de fuso horário em format.ts corrigido com as funções toIsoDate() e parseIsoDate() (eliminando o uso de toISOString, que deslocava datas em UTC-3); tipagem Turno aplicada no frontend e enum Turno nos schemas Pydantic; testes novos para format.ts e escalaSignals.ts; consolidação do Vite (remoção de vite.config.js e .d.ts duplicados).
3. **Onda 2 — Infraestrutura:** Alembic com migrações 0001 (tabelas iniciais) e 0002 (índice parcial compatível com Postgres); remoção do create_all do lifespan; alembic/env.py com render_as_batch condicional (SQLite vs Postgres); pyproject.toml com alembic, pytest-cov (cobertura mínima 70%), pyjwt e psycopg2-binary; CI no GitHub Actions; ESLint 9 flat e Prettier.
4. **Onda 3 — Refatoração do frontend:** EscalaPage.tsx (75 KB) decomposto em 5 hooks + WeeklyMatrix/ActionStack + types/workbench.ts; CadastrosPage.tsx (35 KB) decomposto em 5 formulários; helpers unificados em lib/; sentinela de substituto 0 → null; endpoint GET /professores/carga criado no backend.
5. **Onda 4 — Evolução:** regras de negócio configuráveis; feriados móveis (algoritmo de Gauss); operações PATCH para professores, turmas, UCs e alocações; autenticação JWT.
6. **Encerramento:** relatório consolidado em Word (14 seções) e validação dos arquivos por leitura do conteúdo real.

## 4. Decisões Tomadas e Justificativas

- **create_all → Alembic:** eliminar o risco de perda de dados em mudanças de schema.
- **Monólitos → hooks e formulários:** manutenibilidade e teste isolado.
- **Regras fixas → .env:** ajuste institucional sem reimplantar.
- **Sem acesso → JWT:** pré-requisito para uso multiusuário.
- **Índice parcial dual (sqlite_where + postgresql_where):** portabilidade de banco.
- **Schemas de resposta mantidos com turno: str:** serviços já preenchem .value; não há ganho em mudar.

## 5. Dependências, Premissas e Restrições

- **GitHub não está conectado** a esta conversa — os artefatos foram salvos no Google Drive para commit manual.
- Pastas no Drive: escalas-onda-1, escalas-onda-2, escala-onda3, escalas-onda-4.
- Convenção de nomes: hífen no lugar de barra (ex.: frontend-src-lib-format.ts = frontend/src/lib/format.ts).
- Dependências novas: alembic, pytest-cov, pyjwt, psycopg2-binary, ESLint/Prettier.

## 6. Resultados Obtidos

- Bug de fuso horário corrigido, com teste de regressão.
- Migrações versionadas (0001 e 0002) e CI automatizado.
- Frontend decomposto, sem monólitos; agregação de carga movida para o backend.
- Regras configuráveis, PATCH e autenticação JWT implementados.
- Cerca de 50 arquivos entregues nas quatro pastas do Drive.

## 7. Lições Aprendidas e Pontos de Atenção

- **Validar sempre o conteúdo real** dos arquivos criados — app-services-professores.py foi salvo corrompido (10 KB) e precisou ser recriado.
- Preservar os nomes de classe CSS existentes ao reescrever as páginas.
- Nenhum código restante deve comparar professor_substituto_id === 0 (sentinela agora é null).
- A autenticação atual (login por professor_id) **não deve ir a produção** sem senha/SSO.
- Se já existir escalas.db criado pelo create_all, apagar o banco local antes de rodar a migração 0001 em dev.

## 8. Próximos Passos / Orientações para Continuidade

1. Aplicar as quatro ondas nos caminhos indicados: alembic upgrade head, pytest, npm install, npm run lint, npm run test -- --run, npm run build, e publicar o workflow de CI.
2. Implementar autenticação por senha/SSO e proteger as rotas com get_current_professor.
3. Migrar efetivamente para Postgres (via DATABASE_URL + psycopg2).
4. Criar testes unitários dos serviços e elevar a cobertura acima de 70%.
5. Fazer o commit/push manual no GitHub.

## 9. Informações Ambíguas ou Faltantes

- **app-api-routes-auth.py:** o arquivo foi criado, mas o conteúdo final não pôde ser confirmado por leitura (o link temporário expirou).
- **Nome da pasta da Onda 3** varia no Drive: escala-onda3 (sem o "s").
- **Limpeza pendente na raiz do repo:** Documento.pdf, o PDF do curso e requirements-backup.txt vazio.
- **Pasta escalas-melhorias** (criada antes das ondas definitivas) pode conter duplicatas.
- **Cobertura real de testes desconhecida** — o limite de 70% foi definido como referência.

---

*Gerado em 10/09/2026. Ver também: Relatório Consolidado de Revisão Técnica (Word, 14 seções).*