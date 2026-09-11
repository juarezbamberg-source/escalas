# Proposta: Onda 3 — refatoração do workbench e carga por professor

## Objetivo

Reduzir o acoplamento das páginas monolíticas do frontend e mover a consolidação de carga horária para o backend, preservando o comportamento funcional existente.

## Escopo

- decompor `EscalaPage.tsx` em hooks, tipos e componentes reutilizáveis;
- decompor `CadastrosPage.tsx` em formulários por domínio;
- centralizar helpers de erro e contexto de ação;
- criar `GET /professores/carga` com agregação no serviço;
- migrar o dashboard para consumir o endpoint dedicado;
- manter classes CSS, contratos existentes e regras de negócio;
- adicionar testes backend e frontend para as novas fronteiras.

## Fora de escopo

- autenticação;
- edição via PATCH;
- migração para PostgreSQL como banco padrão;
- novas regras de negócio de carga, feriados ou limites anuais;
- redesign visual amplo.

## Critérios de aceite

1. A suíte backend existente continua passando sem regressões.
2. O endpoint de carga retorna dados agregados por professor, considerando titular e substituto.
3. O dashboard deixa de buscar os três turnos para calcular carga no cliente.
4. `EscalaPage.tsx` e `CadastrosPage.tsx` passam a orquestrar hooks/componentes, sem alterar os fluxos atuais.
5. ESLint, testes frontend e build continuam verdes.
6. Cada fatia possui teste automatizado e pode ser revertida isoladamente.

## Riscos

- ciclos de importação entre tipos e componentes;
- alteração involuntária de filtros/persistência do workbench;
- divergência entre a agregação antiga do frontend e a nova consulta do backend;
- regressões em deep links de ações e no sentinel `null` de substituto.
