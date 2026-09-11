# Memória Final do Projeto — Escalas (SENAC-RS Gravataí)
*Histórico completo da revisão técnica e das sete ondas de melhorias — atualizado em 11/09/2026*

## 1. Visão Geral do Projeto
Sistema web de gestão de escalas de professores do Curso Técnico em Informática do SENAC-RS (unidade Gravataí), criado para substituir o controle por planilhas Excel por uma aplicação transacional com integridade referencial, bloqueio de conflitos e histórico auditável.
- **Repositório:** github.com/juarezbamberg-source/escalas (público, branch main)
- **Backend:** FastAPI + SQLAlchemy + Pydantic + SQLite
- **Frontend:** React 19 + TypeScript + Vite + React Router 7 + Vitest
- **Planejamento:** OpenSpec; decisões documentadas em ADR01–07

## 2. Objetivo Desta Memória
Registrar, de forma legível por qualquer membro do time, todo o histórico da revisão técnica e das ondas de melhoria, com o estado atual dos artefatos e as próximas ações, sem necessidade de contexto adicional.

## 3. Etapas Executadas (Ordem Cronológica)
1. **Revisão técnica** — leitura direta do código do repositório cobrindo arquitetura, frontend e testes.
2. **Onda 1 — Correções críticas:** bug de fuso horário em format.ts corrigido com toIsoDate() e parseIsoDate(); tipagem Turno no frontend e enum Turno nos schemas Pydantic; testes novos.
3. **Onda 2 — Infraestrutura:** Alembic (migrações 0001 e 0002), remoção do create_all do lifespan, env.py com render_as_batch condicional, pyproject.toml com alembic/pytest-cov/pyjwt, CI.
4. **Onda 3 — Refatoração do frontend:** EscalaPage.tsx decomposto em hooks + WeeklyMatrix/ActionStack; CadastrosPage.tsx decomposto em formulários; helpers em lib/; sentinela substituto 0 → null; GET /professores/carga.
5. **Onda 4 — Evolução (entregue e commitada):** regras de negócio configuráveis; feriados móveis (algoritmo de Gauss); PATCH para professores/turmas/UCs/alocações; autenticação JWT (POST /auth/login); CORS configurável. 47 testes, cobertura 92,87%.
6. **Onda 5 — Autenticação real, Usuários e Permissões (documentada):** login por e-mail/senha; 3 funções fixas (admin, coordenação, professor); usuário desacoplado do professor; seed do super admin; proteção por ação no backend. PRD/TRD/ADR 005.
7. **Onda 6 — Atribuição de Turmas/UCs e Carga Prevista (documentada):** entidade Atribuicao com vigência e substituto; exigir atribuição em alocações novas; visualização do professor limitada às turmas/UCs atribuídas; carga prevista vs realizada; pagamento fora do sistema. PRD/TRD/ADR 006.
8. **Onda 7 — Desativação Lógica e Filtros (documentada):** campo ativo em Professor/Turma/UC/Usuario; listas com filtro de status e paginação; desativação preserva histórico. PRD/TRD/ADR 007.
9. **Encerramento:** relatório consolidado em Word (14 seções), validação por leitura real, testes e commit/push no GitHub.

## 4. Decisões Tomadas e Justificativas
- **create_all → Alembic:** eliminar o risco de perda de dados em mudanças de schema.
- **Monólitos → hooks e formulários:** manutenibilidade e teste isolado.
- **Regras fixas → .env:** ajuste institucional sem reimplantar.
- **Sem acesso → JWT:** pré-requisito para uso multiusuário.
- **3 funções fixas + super admin via seed (ADR 005):** cobre os papéis reais sem RBAC completo; substitui o ADR 004.
- **Usuário desacoplado do Professor (ADR 005):** a coordenadora opera sem ser professora.
- **Atribuição persistente com vigência (ADR 006):** vínculo estável; professor vê suas turmas/UCs mesmo sem alocações; substituto cobre ausências.
- **Soft delete (ADR 007):** preserva histórico; desativar ≠ deletar; listas enxutas com filtros.
- **Carga prevista vs realizada; pagamento em R$ fora do sistema:** evita transformar o sistema acadêmico em módulo financeiro.

## 5. Estado Atual dos Artefatos (11/09/2026)
- **Código:** Ondas 1–4 aplicadas e commitadas no GitHub (branch main).
- **Testes:** 47 testes passando; cobertura 92,87% (exigência mínima de 70%).
- **Documentação das Ondas 5–7:** PRD, TRD e ADR (005–007) + Guia + Decisões do Brainstorm + seed do super admin + mapa de telas do frontend, na pasta refatoração codigo do Drive.
- **Arquivos novos da Onda 4:** app/core/security.py, app/schemas/auth.py, app/api/routes/auth.py, app/services/regras.py, app/services/feriados.py, tests/test_onda4.py.
- **Endpoints da Onda 4:** POST /api/v1/auth/login, PATCH /professores/{id}, PATCH /turmas/{id}, PATCH /ucs/{id}, PATCH /alocacoes/{id}.

## 6. Resultados Obtidos
- Bug de fuso horário corrigido, com teste de regressão.
- Migrações versionadas (0001 e 0002) e CI automatizado.
- Frontend decomposto, sem monólitos; agregação de carga movida para o backend.
- Regras configuráveis, PATCH e autenticação JWT implementados.
- Cobertura de testes real de 92,87%.
- Modelo de acesso/atribuição amadurecido em brainstorm e documentado em SDD (PRD/TRD/ADR) para as ondas 5–7.

## 7. Próximos Passos / Orientações para Continuidade
1. Implementar a Onda 5: seed do super admin (app/seed.py), entidade Usuario, login por e-mail/senha, troca de senha no primeiro acesso, proteção por função (require_funcao) e páginas LoginPage/TrocarSenhaPage/UsuariosPage.
2. Implementar a Onda 6: entidade Atribuicao com vigência e substituto, exigir atribuição em alocações novas, fim da visualização por atribuição e carga prevista.
3. Implementar a Onda 7: campo ativo nas entidades, filtros incluir_inativos, desativar/ativar nas telas, paginação.
4. Recuperação de senha por e-mail — próxima atualização do sistema.
5. Migrar efetivamente para Postgres (N:N turma × UC preparado para onda futura) e evoluir para SSO.

## 8. Informações Ambíguas ou Faltantes
- **Nome da pasta da Onda 3** varia no Drive: escala-onda3 (sem o "s").
- **Limpeza pendente na raiz do repo:** Documento.pdf, o PDF do curso e requirements-backup.txt vazio.
- **Pasta escalas-melhorias** (criada antes das ondas definitivas) pode conter duplicatas.
- **Multi-UC por turma:** a atribuição já carrega uc_id própria; a migração turma×UC para N:N fica para a onda em que o multi-UC for implementado.

*Atualizado em 11/09/2026 após a entrega da Onda 4 e a documentação das Ondas 5–7. Ver também: Relatório Consolidado de Revisão Técnica (Word, 14 seções) e guias por onda no Drive.*
