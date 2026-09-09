## Why

Os itens do backlog visual que apareceram na workbench ja nao devem mais ser apenas sinalizacao de futuro. Atalhos de triagem, presets de recorte e acoes em lote com seguranca sao ganhos diretos de produtividade para quem opera a escala todos os dias e reduzem repeticao manual na fase 1.

## What Changes

- Implementar atalhos de triagem recorrente que apliquem combinacoes uteis de filtros e leitura operacional com um clique.
- Permitir salvar, reaplicar e remover presets de recorte do operador sem perder o eixo principal da tela por turno.
- Introduzir selecao multipla e remocao em lote com validacao e confirmacao antes de operacoes sensiveis, preparando extensao futura para outras acoes coletivas.
- Remover da interface o banner de backlog desses itens, ja que eles passam a ser parte do produto.
- Registrar a importacao de planilhas Excel apenas como extensao futura separada, porque exige fluxo de upload e validacao de arquivo que hoje nao existe no backend.

## Capabilities

### New Capabilities
- `escala-triage-shortcuts`: cobre atalhos operacionais predefinidos para recortes frequentes na workbench.
- `escala-filter-presets`: cobre persistencia e reaplicacao de presets de filtros do operador.
- `escala-bulk-actions`: cobre selecao multipla e execucao segura de acoes em lote na escala.

### Modified Capabilities
- `escala-ux-polish-filters`: amplia a workbench para combinar filtros manuais, atalhos recorrentes e presets salvos sem perder clareza do recorte ativo.
- `escala-ux-polish-actions`: amplia a tela para suportar acoes em lote com confirmacao e hierarquia operacional segura.

## Impact

- Frontend React da tela `frontend/src/pages/EscalaPage.tsx` e possiveis componentes auxiliares para presets, selecao e confirmacao.
- Estilos em `frontend/src/styles/app.css`.
- Cliente HTTP em `frontend/src/lib/api.ts` se acoes em lote exigirem endpoint dedicado.
- Backend FastAPI em `app/api/routes/alocacoes.py`, `app/services/alocacoes.py`, schemas e testes caso o lote precise de API especifica.
