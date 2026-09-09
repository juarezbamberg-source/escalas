## ADDED Requirements

### Requirement: acoes destrutivas devem ficar em camada secundaria
O sistema MUST manter acoes destrutivas ou menos frequentes em uma camada visual secundaria em relacao a acao principal da linha.

#### Scenario: leitura com foco na acao principal
- **WHEN** o usuario analisa varias linhas da grade ou cards do drill-down
- **THEN** o sistema evidencia a acao principal sem dar o mesmo peso visual para remover ou outras acoes menos recorrentes

### Requirement: acoes por linha devem preservar explicabilidade do contexto
O sistema MUST mostrar, junto da acao principal, contexto suficiente para justificar por que aquela acao foi priorizada.

#### Scenario: acao principal contextual
- **WHEN** o sistema destaca uma acao principal como `Substituir` ou `Override`
- **THEN** o usuario consegue relacionar essa prioridade com os sinais operacionais exibidos na mesma linha
