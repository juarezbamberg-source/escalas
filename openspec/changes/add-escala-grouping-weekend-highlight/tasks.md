## 1. Dados para agrupamento

- [x] 1.1 Estender o contrato de alocacoes para incluir identificacao da UC necessaria ao agrupamento e verificar compatibilidade com testes em `tests/test_escalas_api.py`
- [x] 1.2 Atualizar tipos e mocks do frontend para consumir a UC junto das alocacoes e verificar que `frontend/src/pages/EscalaPage.test.tsx` continua consistente

## 2. Dias nao letivos

- [x] 2.1 Bloquear cadastro unitario em sabados, domingos e feriados nacionais com mensagem clara e verificar cenarios em `tests/test_escalas_api.py`
- [x] 2.2 Bloquear ou sinalizar como nao letivos os itens do cadastro recorrente e da consulta por periodo nessas datas, e verificar comportamento com testes backend

## 3. Grade agrupada

- [x] 3.1 Implementar agrupamento da grade por UC e turma com resumo recolhido por padrao e verificar a renderizacao da estrutura na tela `Escala por turno`
- [x] 3.2 Permitir expandir e recolher grupos preservando filtros, selecao e acoes da grade, e verificar o comportamento em `frontend/src/pages/EscalaPage.test.tsx`

## 4. Calendario com fim de semana destacado

- [x] 4.1 Destacar sabados e domingos nas visoes semanal e mensal com amarelo contextual sem quebrar o semaforo operacional, e verificar legibilidade manual da tela
- [x] 4.2 Cobrir o destaque de fim de semana com testes de interface em `frontend/src/pages/EscalaPage.test.tsx`

## 5. Documentacao e validacao

- [x] 5.1 Atualizar `README.md` com a grade agrupada, o destaque de fim de semana e o bloqueio de dias nao letivos, e verificar clareza do fluxo documentado
- [x] 5.2 Validar a integracao final com `.\.venv\Scripts\python.exe -m pytest tests\test_escalas_api.py`, `cd frontend && npm run test -- --run` e `cd frontend && npm run build`
