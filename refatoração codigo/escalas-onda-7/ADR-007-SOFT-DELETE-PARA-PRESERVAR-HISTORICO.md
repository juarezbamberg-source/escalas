---
adr_number: "007"
status: aceito
created: 2026-09-11
---
# ADR 007: Desativação lógica (soft delete) para preservar histórico

## Contexto
A escala é histórica por natureza: um professor que saiu precisa continuar válido nas consultas de alocações antigas. A exclusão física destrói esse histórico e esbarra na integridade referencial (409 quando há vínculos). Listas grandes podem acumular informação passada que não é útil no presente.

## Alternativas consideradas
- Exclusão física com botão: simples, porém destrói histórico e gera 409 em vínculos.
- Arquivamento em tabela separada: preserva tudo, mas cria duas fontes de verdade e dobra a complexidade de consultas.
- Desativação lógica (campo ativo): um boolean, consultas simples, histórico intacto, limpeza visual por filtro.

## Decisão
- Adotar soft delete: campo ativo (bool, default true) em Professor, Turma, UnidadeCurricular e Usuario.
- Listas retornam ativos por padrão; incluir_inativos=true para consultar inativos.
- Desativação não quebra vínculos; histórico de alocações preservado.
- Coordenação desativa professor/UC/turma; apenas admin gerencia usuários.
- Filtros de status, busca e paginação resolvem o crescimento das listas.

## Consequências
- Positivas: histórico preservado, sem 409, UX clara (desativar ≠ deletar), listas enxutas.
- Negativas: consultas passam a considerar o filtro ativo por padrão (ajuste pontual nos services).
- Neutras: campo com default true não quebra endpoints existentes.
