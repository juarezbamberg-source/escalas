## MODIFIED Requirements

### Requirement: sinais operacionais devem usar badges consistentes
O sistema MUST representar conflito, lacuna, substituicao, override e padrao com badges visuais consistentes entre grade, resumo e drill-down, e complementar esses badges com texto suficiente para que o entendimento nao dependa apenas da cor.

#### Scenario: consistencia dos sinais
- **WHEN** o mesmo estado operacional aparece em mais de uma area da tela
- **THEN** o sistema usa a mesma semantica visual para esse estado em todas elas

#### Scenario: leitura sem dependencia exclusiva da cor
- **WHEN** o usuario precisa entender rapidamente o estado de uma linha da grade
- **THEN** o sistema apresenta badges e rotulos que explicam o sinal sem exigir interpretacao apenas cromatica

## ADDED Requirements

### Requirement: leitura de professores deve separar papeis operacionais
O sistema MUST diferenciar visualmente professor titular e professor substituto na grade e no drill-down.

#### Scenario: leitura por papel
- **WHEN** o usuario consulta a coluna de professores ou um card do drill-down
- **THEN** o sistema apresenta titular e substituto em linhas, campos ou rotulos distintos
