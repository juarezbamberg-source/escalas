## 1. Backend recorrente

- [x] 1.1 Criar schemas de preview e confirmacao do lote recorrente e verificar contratos em `app/schemas/alocacao.py`
- [x] 1.2 Implementar servico para gerar datas por intervalo, dias da semana e turnos reaproveitando validacoes existentes, e verificar com testes em `tests/test_escalas_api.py`
- [x] 1.3 Expor endpoints de preview e gravacao do lote recorrente em `app/api/routes/alocacoes.py` e verificar respostas agregadas pela API

## 2. Frontend de cadastros

- [x] 2.1 Adicionar secao de cadastro recorrente na tela `frontend/src/pages/CadastrosPage.tsx` com turma, professor, periodo, turnos e dias da semana, e verificar renderizacao clara
- [x] 2.2 Integrar preview e confirmacao do lote no frontend com resumo de validos e bloqueados, e verificar o fluxo pela interface
- [x] 2.3 Manter o formulario unitario coexistindo com o lote recorrente e verificar que os dois fluxos continuam utilizaveis sob a mesma capacidade de cadastro

## 3. Validacao e documentacao

- [x] 3.1 Cobrir o fluxo recorrente no frontend com testes em `frontend/src/pages/CadastrosPage.test.tsx` e verificar com `cd frontend && npm run test -- --run`
- [x] 3.2 Cobrir preview, bloqueios e persistencia recorrente no backend com `.\.venv\Scripts\python.exe -m pytest`
- [x] 3.3 Atualizar `README.md` com o novo fluxo de cadastro recorrente e validar integracao final com `cd frontend && npm run build`
