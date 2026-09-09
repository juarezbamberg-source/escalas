## MODIFIED Requirements

### Requirement: filtros devem ter hierarquia visual mais clara
O sistema MUST destacar os grupos de filtros, os atalhos, os presets salvos e o resumo do recorte ativo com espacamento e contraste suficientes para leitura imediata.

#### Scenario: leitura rapida do recorte
- **WHEN** o usuario acessa a tela de escala
- **THEN** o sistema apresenta filtros, atalhos e resumo do recorte de forma visualmente separada e facil de escanear

#### Scenario: leitura de preset aplicado
- **WHEN** o usuario reaplica um preset salvo ou um atalho recorrente
- **THEN** o sistema deixa explicito no recorte ativo que o contexto atual veio dessa combinacao
