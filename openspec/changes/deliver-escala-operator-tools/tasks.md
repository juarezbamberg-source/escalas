## 1. Atalhos de Triagem

- [x] 1.1 Implementar atalhos recorrentes com combinacoes operacionais predefinidas e verificar na tela `Escala por turno` que grade e calendario reagem com um clique
- [x] 1.2 Refletir atalhos aplicados na combinacao visivel de filtros ativos e verificar cobertura em `frontend/src/pages/EscalaPage.test.tsx`

## 2. Presets do Operador

- [x] 2.1 Criar fluxo para salvar preset com nome, turno, filtros e modo de leitura e verificar persistencia local no navegador
- [x] 2.2 Permitir reaplicar e excluir presets salvos e verificar em `frontend/src/pages/EscalaPage.test.tsx` a restauracao completa do recorte

## 3. Remocao em Lote

- [x] 3.1 Modelar selecao multipla de linhas na grade e verificar exibicao clara do estado selecionado
- [x] 3.2 Implementar endpoint e servico de remocao em lote com confirmacao e resultado agregado, e verificar com testes backend
- [x] 3.3 Conectar a remocao em lote no frontend com resumo de impacto e confirmacao explicita, e verificar comportamento na tela de escala

## 4. Limpeza de UX

- [x] 4.1 Remover da interface o banner de backlog de aceleradores operacionais, ja que os recursos passam a existir na workbench
- [x] 4.2 Atualizar documentacao funcional com atalhos, presets e remocao em lote, e verificar clareza no `README.md`

## 5. Validacao

- [x] 5.1 Cobrir atalhos, presets e remocao em lote com testes de interface e verificar com `cd frontend && npm run test -- --run`
- [x] 5.2 Cobrir o endpoint de remocao em lote com testes automatizados e verificar com `.\.venv\Scripts\python.exe -m pytest`
- [x] 5.3 Validar a integracao final com `cd frontend && npm run build`
