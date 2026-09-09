## Purpose

Elevar a workbench de escala para uma rotina de operacao recorrente, com leitura mais compacta, acoes mais rapidas e menor carga visual em cenarios com volume maior de registros.

## ADDED Requirements

### Requirement: workbench deve oferecer modo de leitura mais compacto
O sistema MUST oferecer uma apresentacao mais compacta da grade e do calendario para facilitar escaneabilidade em recortes com muitos itens.

#### Scenario: consulta com dezenas de registros
- **WHEN** o usuario opera um recorte com alto volume de linhas ou ocorrencias
- **THEN** o sistema oferece densidade visual suficiente para manter leitura rapida sem perder os sinais essenciais

### Requirement: workbench deve priorizar acoes recorrentes
O sistema MUST destacar as acoes mais provaveis para o contexto operacional e rebaixar acoes menos frequentes para uma camada secundaria.

#### Scenario: triagem repetitiva
- **WHEN** o usuario avalia varias linhas seguidas da escala
- **THEN** o sistema reduz o custo visual e de clique para executar a acao mais comum de cada caso

### Requirement: workbench deve permitir retomada rapida do contexto
O sistema MUST preservar e reusar o contexto recente de operacao para acelerar recortes recorrentes.

#### Scenario: retorno ao mesmo recorte
- **WHEN** o usuario volta a consultar a escala apos navegar por outras partes do sistema
- **THEN** o sistema facilita retomar os filtros e o modo de leitura usados recentemente
