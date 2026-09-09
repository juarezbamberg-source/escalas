## Why

A tela atual de `Escala por turno` já consulta a API, mas ainda funciona mais como uma vitrine de registros do que como uma bancada operacional para triagem, exceção e ação imediata. Evoluir essa experiência agora reduz a distância entre consultar a escala, entender problemas e agir sobre conflitos, lacunas e substituições.

## What Changes

- Reestruturar a tela de escala para suportar filtros avançados em três grupos: contexto, status operacional e busca direta.
- Adicionar chips de filtro rápido e feedback visível da combinação ativa de critérios.
- Refinar a grade da escala para leitura mais sintética, com recortes por professor, turma, data e status.
- Evoluir o calendário de uma lista colorida para modos orientados a operação, com agregação temporal e drill-down.
- Planejar modos adicionais de inserção de dados compatíveis com operação real, priorizando ações contextuais e edição mais fluida.

## Capabilities

### New Capabilities
- `escala-workbench-filters`: cobre filtros avançados, chips rápidos, combinação visível de critérios e recortes operacionais da grade por turno.
- `escala-workbench-calendar`: cobre evolução do calendário para visões mensal, semanal e agenda, com agregação, drill-down e ações contextuais.
- `escala-workbench-entry-modes`: cobre a evolução da inserção de dados para fluxo assistido, ações inline/contextuais e futuras rotinas de importação/replicação.

### Modified Capabilities
- Nenhuma.

## Impact

- Alterações relevantes em `frontend/src/pages/EscalaPage.tsx`, componentes compartilhados, estilos globais e testes de interface.
- Possível necessidade de ampliar a camada de API do frontend para parâmetros de filtro mais ricos.
- Potencial necessidade futura de endpoints backend mais expressivos para suportar agregações e sugestões, sem bloquear a primeira entrega de filtros avançados.
