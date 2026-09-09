## 1. API de consulta por turma e periodo

- [x] 1.1 Adicionar schemas e endpoint de consulta por turma e periodo com turno opcional e verificar contrato HTTP com testes em `tests/test_escalas_api.py`
- [x] 1.2 Implementar no servico a geracao de linhas por data e turno, incluindo lacunas explicitas sem professor, e verificar cenarios de alocacao existente e ausencia de alocacao com testes backend

## 2. Workbench da escala

- [x] 2.1 Adicionar na `EscalaPage` um bloco proprio `Consulta por turma e periodo` com filtros de turma, data inicial, data final, turno opcional e exibicao de substituicoes, e verificar renderizacao da acao `Consultar professor da turma`
- [x] 2.2 Exibir tabela de resultado com `data`, `turno`, `turma`, `professor titular`, `substituto` e `situacao`, deixando explicita a ausencia de professor, e verificar o comportamento em `frontend/src/pages/EscalaPage.test.tsx`

## 3. Acabamento e validacao

- [x] 3.1 Ajustar estilos e hierarquia visual para separar a consulta dirigida dos presets e filtros gerais, e verificar legibilidade manual na tela `Escala por turno`
- [x] 3.2 Atualizar `README.md` com a nova consulta por turma e periodo e verificar clareza do fluxo documentado
- [x] 3.3 Validar a integracao final com `.\.venv\Scripts\python.exe -m pytest tests\test_escalas_api.py`, `cd frontend && npm run test -- --run` e `cd frontend && npm run build`
