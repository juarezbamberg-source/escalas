# TRD — Onda 7: Desativação Lógica (Soft Delete) e Filtros

## Modelo de dados
- Coluna ativo (Boolean, default true, not null) adicionada a:
  - Professor
  - Turma
  - UnidadeCurricular
  - Usuario (Onda 5)

## Endpoints
- GET /professores?incluir_inativos=true (default: apenas ativos)
- GET /ucs?incluir_inativos=true
- GET /turmas?incluir_inativos=true
- GET /usuarios?incluir_inativos=true (admin)
- PATCH /professores/{id}, /ucs/{id}, /turmas/{id}, /usuarios/{id} aceitam o campo ativo.

## Regras
- Desativar não valida vínculos (diferente do DELETE físico, que retorna 409).
- Consultas de alocação (histórico) continuam trazendo entidades inativas.
- Carga realizada considera alocações independente do status.
- Carga prevista considera atribuições ativas na vigência.

## Frontend
- Componente reutilizável de linha de cadastro com ações (editar, desativar/ativar).
- Badge "Inativo" + opacidade.
- Filtro de status (Ativos/Inativos/Todos) + busca.
- Paginação (ou scroll virtualizado) nas listas.

## Migração
- Alembic 0005: coluna ativo nas 4 tabelas.
