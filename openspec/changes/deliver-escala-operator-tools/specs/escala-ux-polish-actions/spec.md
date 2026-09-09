## ADDED Requirements

### Requirement: a tela deve suportar acoes coletivas com seguranca
O sistema MUST permitir que acoes em lote coexistam com as acoes por linha sem comprometer clareza nem seguranca operacional.

#### Scenario: transicao entre acoes individuais e coletivas
- **WHEN** o usuario seleciona multiplos itens da grade
- **THEN** o sistema apresenta comandos coletivos sem ocultar completamente as acoes individuais

### Requirement: acoes sensiveis devem ganhar confirmacao contextual
O sistema MUST reforcar a confirmacao de acoes sensiveis quando elas afetarem mais de um item.

#### Scenario: confirmacao contextual do lote
- **WHEN** uma acao em lote altera ou remove multiplos registros
- **THEN** o sistema apresenta resumo do impacto antes da confirmacao final
