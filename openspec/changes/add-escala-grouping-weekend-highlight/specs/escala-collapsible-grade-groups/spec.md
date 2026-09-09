## Purpose

Permitir que a grade da escala permaneça escaneável mesmo com muitos registros, agrupando as ocorrências por UC e turma com expansão sob demanda.

## ADDED Requirements

### Requirement: grade deve agrupar ocorrencias por UC e turma
O sistema MUST organizar a grade da escala em grupos por unidade curricular e turma antes de exibir as linhas detalhadas.

#### Scenario: leitura inicial da grade extensa
- **WHEN** o usuario acessa uma escala com muitos registros
- **THEN** o sistema apresenta grupos resumidos por UC e turma em vez de expandir todas as linhas de imediato

### Requirement: grupos devem poder expandir e recolher
O sistema MUST permitir expandir e recolher cada grupo da grade sem perder o recorte atual de turno e filtros.

#### Scenario: abertura de um grupo especifico
- **WHEN** o usuario aciona o controle de expandir de uma UC/turma
- **THEN** o sistema revela apenas as linhas detalhadas daquele grupo

#### Scenario: recolhimento preservando contexto
- **WHEN** o usuario recolhe novamente o grupo
- **THEN** o sistema volta ao resumo daquele agrupamento sem redefinir filtros ou selecoes globais da tela

### Requirement: resumo do grupo deve antecipar volume e sinais
O sistema MUST mostrar no cabecalho de cada grupo informacoes suficientes para triagem rapida, incluindo identificacao da UC, turma e quantidade de ocorrencias.

#### Scenario: triagem sem expandir tudo
- **WHEN** o usuario observa a lista de grupos recolhidos
- **THEN** o sistema permite identificar rapidamente quais grupos merecem abertura antes de entrar nos detalhes
