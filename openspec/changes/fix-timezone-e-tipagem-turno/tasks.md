# 1. Correcao de timezone em format.ts

- [x] 1.1 Substituir `toISOString().slice(0, 10)` por `toIsoDate()` em `buildFallbackDates()`
- [x] 1.2 Substituir `toISOString().slice(0, 10)` por `toIsoDate()` em `buildDateRangeFromBounds()`
- [x] 1.3 Adicionar `parseIsoDate()` para leitura segura de datas ISO em horario local

# 2. Tipagem de turno

- [x] 2.1 Atualizar `frontend/src/types/api.ts` com o tipo `Turno` nos campos `turno`/`turno_padrao`
- [x] 2.2 Atualizar `app/schemas/alocacao.py` com `turno: Turno` e `turnos: list[Turno]`
- [x] 2.3 Atualizar `app/schemas/turma.py` com `turno_padrao: Turno`

# 3. Testes novos

- [x] 3.1 Criar `frontend/src/lib/format.test.ts` com caso de regressao de fuso
- [x] 3.2 Criar `frontend/src/lib/escalaSignals.test.ts`

# 4. Limpeza da configuracao do Vite

- [x] 4.1 Remover `frontend/vite.config.js`
- [x] 4.2 Remover `frontend/vite.config.d.ts`

# 5. Validacao local (a executar pelo usuario)

- [ ] 5.1 `cd frontend && npm run test -- --run`
- [ ] 5.2 `cd frontend && npm run build`
