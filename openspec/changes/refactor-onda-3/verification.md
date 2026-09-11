# Registro SDD — encerramento parcial da Onda 3

## Estado

- **Status**: parcialmente entregue e integrado à `main`.
- **Revisão integrada**: `5d2a56a`.
- **Branch de trabalho**: `feat/onda-3-fase3-v2`.
- **Escopo entregue nesta etapa**: carga por professor no backend, contrato frontend, dashboard usando endpoint dedicado, helpers compartilhados e correção dos seletores ambíguos do drill-down.
- **Escopo ainda pendente**: decomposição estrutural completa de `EscalaPage` e `CadastrosPage`, hooks, `WeeklyMatrix`, `ActionStack` e cinco formulários.

## Evidências de verificação

- Backend: 26 testes aprovados.
- Cobertura: 93,09%.
- Alembic: revisão 0002 (head).
- Frontend: 40 testes aprovados.
- ESLint: 0 erros; 6 warnings `react-hooks/exhaustive-deps` não bloqueantes.
- TypeScript: aprovado.
- Build Vite: aprovado.
- CI do PR: Backend e Frontend aprovados.

## Decisão de escopo

A change não deve ser arquivada como totalmente concluída, porque a decomposição dos monólitos permanece pendente. As tarefas não entregues continuam abertas para o próximo ciclo, preservando rastreabilidade SDD.

## Próxima ação

Criar uma nova fatia spec-driven para a decomposição do workbench, começando por `types/workbench.ts`, hooks e componentes, com testes de contrato antes da remoção de código duplicado.
