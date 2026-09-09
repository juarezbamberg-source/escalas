## Purpose

Evoluir o calendario da escala para uma visualizacao temporal consolidada, com densidade informacional maior e caminhos de drill-down mais proximos da rotina de triagem.

## ADDED Requirements

### Requirement: calendario deve agregar ocorrencias
O sistema MUST evitar repetir cards isolados por ocorrencia quando houver apresentacao agregada mais clara por dia ou recorte temporal.

#### Scenario: agregacao por dia
- **WHEN** existem multiplas ocorrencias de um mesmo dia
- **THEN** o sistema apresenta uma sintese consolidada em vez de apenas listar cards repetidos

### Requirement: calendario deve oferecer mais de um modo de leitura
O sistema MUST ser projetado para suportar visoes ao menos `mensal`, `semanal` e `agenda`.

#### Scenario: alternancia de modo de calendario
- **WHEN** o usuario escolhe um modo de visualizacao diferente
- **THEN** o sistema reorganiza o calendario sem perder o recorte de filtros ativo

### Requirement: calendario deve permitir drill-down contextual
O sistema MUST permitir abrir o detalhe de um dia ou bloco temporal para inspecionar alocacoes, conflitos e lacunas daquele recorte.

#### Scenario: abertura de detalhe do dia
- **WHEN** o usuario clica em um dia ou bloco do calendario
- **THEN** o sistema exibe um painel contextual com as alocacoes correspondentes

### Requirement: calendario deve apoiar triagem por pendencia
O sistema MUST tornar visiveis os contadores ou marcadores de conflito, sem professor, substituicao e override em cada recorte temporal relevante.

#### Scenario: leitura de pendencias por dia
- **WHEN** o usuario observa um dia com pendencias
- **THEN** o sistema indica visualmente a quantidade ou presenca de conflitos, lacunas e substituicoes daquele dia
