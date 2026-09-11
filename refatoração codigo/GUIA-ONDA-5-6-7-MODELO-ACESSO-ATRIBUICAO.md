# Guia de Aplicação — Ondas 5, 6 e 7: Acesso, Atribuição e Desativação

*Documentação SDD (PRD + TRD + ADR) das melhorias definidas em brainstorm — 11/09/2026*

## Contexto
Após a Onda 4 (autenticação JWT simplificada, PATCH, feriados, regras configuráveis), um brainstorm definiu a evolução do controle de acesso e do modelo de atribuição de turmas/UCs. O resultado foi consolidado em 18 decisões (DECISOES-BRAINSTORM-MODELO-ACESSO-ATRIBUICAO.md) e organizado em 3 ondas.

## As 3 ondas

| Onda | Tema | Documentos |
|---|---|---|
| Onda 5 | Autenticação real, Usuários e Permissões | PRD-ONDA-5, TRD-ONDA-5, ADR-005, SEED-SUPER-ADMIN |
| Onda 6 | Atribuição de Turmas/UCs e Carga Prevista | PRD-ONDA-6, TRD-ONDA-6, ADR-006 |
| Onda 7 | Desativação Lógica (Soft Delete) e Filtros | PRD-ONDA-7, TRD-ONDA-7, ADR-007 |

## Ordem de aplicação
1. Onda 5 (base: usuários e permissões) — desbloqueia as demais.
2. Onda 6 (atribuição) — depende de usuários para filtrar a visualização do professor.
3. Onda 7 (soft delete) — pode ser aplicada em paralelo; o filtro de status ganha contexto com as ondas 5 e 6.

## Passos por onda
- Backend: alembic upgrade head (novas migrações), pytest.
- Frontend: npm install, npm run lint, npm run test -- --run, npm run build.
- Onda 5: rodar o seed do super admin (python -m app.seed).

## Referências
- Decisões do brainstorm: DECISOES-BRAINSTORM-MODELO-ACESSO-ATRIBUICAO.md
- Telas do frontend: MAPA-TELAS-FRONTEND-ONDA-5-6-7.md
- ADRs anteriores: ADR01–04 (ADR 004 substituído pelo ADR 005)
