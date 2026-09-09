## Why

A tela de `Escala por turno` ja apoia consulta, triagem e acao, mas ainda transmite a sensacao de salto entre modulos e de densidade visual irregular. Esta mudanca busca transformar a base funcional atual em uma experiencia mais fluida, legivel e confiante para uso operacional diario.

## What Changes

- Refinar o layout dos filtros e dos badges para melhorar hierarquia visual, leitura e previsibilidade da triagem.
- Tornar os modos do calendario mais claros como navegacao primaria da consulta, com resumo consolidado do periodo antes da lista de dias.
- Evoluir o modo mensal para mostrar mini-contadores por cor dentro de cada dia e o modo semanal para revelar melhor o padrao operacional por turma.
- Reorganizar o drill-down do dia para separar nitidamente diagnostico consolidado e lista de ocorrencias acionaveis.
- Substituir o redirecionamento imediato das acoes `Alocar`, `Substituir` e `Justificar override` por drawer ou modal contextual, com pre-preenchimento completo e validacoes preventivas.

## Capabilities

### New Capabilities
- `escala-ux-polish-filters`: cobre refinamento visual dos filtros, dos badges operacionais e da hierarquia entre resumo, recorte e acoes.
- `escala-ux-polish-calendar`: cobre navegacao mais clara entre modos do calendario, resumo consolidado do periodo, densidade visual maior nas celulas e drill-down hierarquizado.
- `escala-ux-polish-actions`: cobre drawer ou modal contextual para insercao assistida, pre-preenchimento completo do contexto e validacoes preventivas antes do envio.

### Modified Capabilities
- Nenhuma.

## Impact

- Alteracoes concentradas em `frontend/src/pages/EscalaPage.tsx`, componentes compartilhados de navegacao visual, estilos globais e testes de interface.
- Ajustes em `frontend/src/pages/CadastrosPage.tsx` apenas se parte do formulario atual for reaproveitada como conteudo do drawer contextual.
- Nenhuma dependencia obrigatoria nova no backend para a primeira iteracao, embora validacoes preventivas possam reutilizar mensagens e regras ja existentes da API.
