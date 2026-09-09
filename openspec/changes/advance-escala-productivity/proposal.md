## Why

A workbench de escala ja ficou funcional e mais fluida, mas ainda ha atrito cognitivo em dois pontos: falta explicabilidade imediata para entender por que um item entrou em alerta e falta acabamento de produtividade para operar grades grandes sem sobrecarga visual. Resolver isso agora aumenta confianca operacional sem mexer nas regras centrais de integridade da fase 1.

## What Changes

- Introduzir explicabilidade dos sinais na grade e no drill-down, com motivo resumido e caminho visivel para detalhar causas operacionais de conflito, lacuna, substituicao e override.
- Refinar a coluna de professores e a hierarquia de sinais para reforcar leitura por papel, e nao como texto comprimido.
- Evoluir a coluna de acoes para diferenciar melhor acao principal, acao secundaria e acao destrutiva de menor destaque.
- Planejar um pacote seguinte de produtividade operacional com modos mais densos de leitura, acoes recorrentes mais rapidas e organizacao mais escalavel para volume maior de registros.

## Capabilities

### New Capabilities
- `escala-signal-explainability`: cobre explicacao contextual dos sinais operacionais na grade, no drill-down e no fluxo assistido.
- `escala-operator-productivity`: cobre prioridades de produtividade para operadores recorrentes, incluindo hierarquia de acoes, compactacao visual e proximos atalhos da workbench.

### Modified Capabilities
- `escala-ux-polish-filters`: amplia a leitura dos badges e do recorte para que os sinais da tabela nao dependam apenas da cor ou do texto comprimido.
- `escala-ux-polish-actions`: ajusta a hierarquia das acoes por linha para reduzir peso visual e empurrar acoes destrutivas para uma camada secundaria.

## Impact

- Frontend React da tela [frontend/src/pages/EscalaPage.tsx](C:/Users/Juarez/Documents/002%20-%20SENAC/WebSiteEscalas/frontend/src/pages/EscalaPage.tsx) e componentes auxiliares de grade, sinais e acoes contextuais.
- Estilos em `frontend/src/styles/app.css`.
- Testes de interface da escala em `frontend/src/pages/EscalaPage.test.tsx`.
- Sem mudancas obrigatorias de API neste primeiro recorte; a explicabilidade deve partir prioritariamente dos dados ja disponiveis na workbench atual.
