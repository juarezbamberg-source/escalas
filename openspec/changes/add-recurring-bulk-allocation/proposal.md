## Why

Quando uma nova UC entra em operacao, o cadastro manual de cada data e turno vira trabalho repetitivo e sujeito a erro. O sistema precisa oferecer um fluxo de lancamento recorrente em lote, dividido por dias da semana, para aproximar a entrada de dados do jeito como a escala e montada no dia a dia.

## What Changes

- Adicionar um fluxo de cadastro recorrente em lote para gerar alocacoes a partir de um intervalo de datas, dias da semana marcados e um ou mais turnos.
- Permitir preview do lote antes da gravacao final, separando itens validos, conflitos e duplicidades ja conhecidas.
- Reaproveitar as regras atuais de integridade da API durante a simulacao e a persistencia do lote.
- Expor a capacidade no frontend de cadastros com linguagem orientada a operacao de UC, turma, professor e recorrencia semanal.
- Manter importacao por planilha Excel fora desta mudanca, como frente separada.

## Capabilities

### New Capabilities
- `recurring-bulk-allocation`: cobre o cadastro em lote de alocacoes recorrentes por faixa de datas, turnos e dias da semana com preview e confirmacao

### Modified Capabilities
- Nenhuma.

## Impact

- Backend FastAPI em `app/api/routes/alocacoes.py`, `app/services/alocacoes.py` e `app/schemas/alocacao.py`
- Frontend de cadastros em `frontend/src/pages/CadastrosPage.tsx` e possiveis componentes auxiliares
- Cliente HTTP em `frontend/src/lib/api.ts` e tipos em `frontend/src/types/api.ts`
- Testes automatizados do backend e frontend para preview, conflitos e gravacao em lote
