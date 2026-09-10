# Context

Ver `proposal.md` para a motivacao. O sistema exibia datas incorretas no calendario em fuso UTC-3 e aceitava qualquer string nos campos de turno, empurrando a falha para o runtime.

## Frontend

- `frontend/src/lib/format.ts`: `toIsoDate(date)` monta `YYYY-MM-DD` a partir de `getFullYear()`, `getMonth()` e `getDate()` (todos locais); `parseIsoDate(value)` constroi `new Date(year, month - 1, day)` em horario local; `buildFallbackDates()` e `buildDateRangeFromBounds()` passam a usar essas funcoes.
- `frontend/src/types/api.ts`: `turno` e `turno_padrao` passam de `string` para o tipo `Turno` nos tipos `Turma`, `Alocacao`, `AlocacaoBulkDeleteItem`, `AlocacaoBulkCreateItem`, `AlocacaoTurmaPeriodoItem` e `CalendarioItem`.
- Testes novos: `frontend/src/lib/format.test.ts` (inclui caso de regressao 31/01 a 02/02) e `frontend/src/lib/escalaSignals.test.ts`.

## Backend

- `app/models/enums.py` ja define `Turno(str, Enum)`; os schemas passam a importar e usar o enum.
- `app/schemas/alocacao.py`: `AlocacaoCreate.turno: Turno` e `AlocacaoBulkCreateRequest.turnos: list[Turno]`.
- `app/schemas/turma.py`: `TurmaCreate.turno_padrao: Turno`.
- Schemas de **resposta** (`AlocacaoRead`, `CalendarioItem`, `AlocacaoTurmaPeriodoItem`, `AlocacaoBulkCreateItem`, `AlocacaoBulkDeleteItem`) permanecem com `turno: str`, pois os servicos preenchem com `alocacao.turno.value`.
- Efeito: FastAPI retorna 422 automaticamente para valor invalido e o Swagger lista os valores permitidos; as funcoes `validar_turno` dos servicos continuam como segunda camada de defesa.

## Vite

- `frontend/vite.config.ts` permanece como fonte unica; `frontend/vite.config.js` e `frontend/vite.config.d.ts` foram removidos do repositorio.

## Validacao

- Rodar `cd frontend && npm run test -- --run` e `cd frontend && npm run build` no ambiente local.
