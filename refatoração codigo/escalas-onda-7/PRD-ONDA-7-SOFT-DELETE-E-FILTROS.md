# PRD — Onda 7: Desativação Lógica (Soft Delete) e Filtros

## Objetivo
Permitir desativar cadastros (professor, UC, turma, usuário) sem perder histórico, e manter as listas enxutas com filtros e paginação conforme a base cresce.

## Histórias de usuário
- Como coordenação, quero desativar um professor/UC/turma que não está mais em uso, mantendo o histórico de alocações.
- Como admin, quero desativar/ativar usuários.
- Como usuário, quero identificar visualmente itens inativos e filtrar a lista (ativos, inativos, todos).
- Como usuário, quero buscar por nome/código e paginar listas grandes.

## Requisitos funcionais
- RF-01: Campo ativo (bool, default true) em Professor, Turma, UnidadeCurricular e Usuario.
- RF-02: Listas retornam apenas ativos por padrão; parâmetro incluir_inativos=true para incluir.
- RF-03: Botões desativar/ativar nas telas de cadastro e usuários.
- RF-04: Item inativo com visual distinto (badge/selo).
- RF-05: Filtro por status + busca por nome/código.
- RF-06: Paginação nas listas.

## Critérios de aceite
- Desativar não quebra vínculos existentes nem apaga histórico.
- Alocações antigas continuam exibindo o professor desativado.
- Lista padrão não mostra inativos; filtro permite vê-los.
- Carga horária (realizada) continua considerando alocações históricas independente do status.
