# escala-ux-polish-filters Specification

## Purpose

Lapidar a leitura da workbench de escala para que filtros, badges e acoes fiquem mais claros, consistentes e rapidos de escanear na rotina operacional.

## Requirements

### Requirement: filtros devem ter hierarquia visual mais clara
O sistema MUST destacar os grupos de filtros, os atalhos e o resumo do recorte ativo com espacamento e contraste suficientes para leitura imediata.

#### Scenario: leitura rapida do recorte
- **WHEN** o usuario acessa a tela de escala
- **THEN** o sistema apresenta filtros, atalhos e resumo do recorte de forma visualmente separada e facil de escanear

### Requirement: sinais operacionais devem usar badges consistentes
O sistema MUST representar conflito, lacuna, substituicao, override e padrao com badges visuais consistentes entre grade, resumo e drill-down.

#### Scenario: consistencia dos sinais
- **WHEN** o mesmo estado operacional aparece em mais de uma area da tela
- **THEN** o sistema usa a mesma semantica visual para esse estado em todas elas

### Requirement: acoes por linha devem ter hierarquia perceptivel
O sistema MUST diferenciar acao principal e acoes secundarias para reduzir poluicao visual na grade da escala.

#### Scenario: leitura da coluna de acoes
- **WHEN** o usuario observa varias linhas consecutivas da grade
- **THEN** o sistema permite identificar a acao principal sem competir visualmente com todas as demais
