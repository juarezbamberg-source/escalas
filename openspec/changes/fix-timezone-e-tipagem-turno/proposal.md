# Why

O frontend serializava datas com `toISOString().slice(0, 10)`, que converte para UTC. No fuso do Brasil (UTC-3), meia-noite local vira o dia anterior em UTC, fazendo o calendario exibir um dia a menos e corrompendo a virada de mes. Alem disso, os campos `turno` e `turno_padrao` estavam tipados como `string` generica, permitindo valores invalidos chegarem ao backend em runtime.

## What Changes

- Corrigir `frontend/src/lib/format.ts` com as funcoes `toIsoDate()` e `parseIsoDate()`, que montam/leem datas em horario local e eliminam o uso de `toISOString()`.
- Tipar `turno` e `turno_padrao` como `Turno` nos tipos do frontend e nos schemas Pydantic de entrada do backend.
- Adicionar testes unitarios Vitest para `format.ts` e `escalaSignals.ts`.
- Remover sobras de compilacao do Vite (`vite.config.js` e `vite.config.d.ts`) que estavam versionadas por engano, mantendo `vite.config.ts` como unica fonte.

## Capabilities

### New Capabilities

- `timezone-safe-dates`: serializacao de datas em horario local, sem deslocamento UTC, com regressao coberta por teste.
- `turno-enforced`: validacao de turno na borda com enum no backend e tipos estritos no frontend.
