## Purpose

Refinar o calendario da escala para oferecer navegacao mais evidente, resumo consolidado do periodo e maior densidade informacional nas visoes semanal e mensal.

## ADDED Requirements

### Requirement: modos do calendario devem ser navegacao primaria visivel
O sistema MUST apresentar `Agenda`, `Semanal` e `Mensal` como controles claramente destacados dentro da area de calendario.

#### Scenario: troca de modo
- **WHEN** o usuario alterna entre `Agenda`, `Semanal` e `Mensal`
- **THEN** o sistema evidencia o modo selecionado e preserva o recorte ativo

### Requirement: calendario deve resumir o periodo antes do detalhe
O sistema MUST exibir um resumo consolidado do periodo filtrado com contadores de conflito, lacuna, substituicao e override antes da grade temporal.

#### Scenario: visao geral do periodo
- **WHEN** o usuario consulta um recorte da escala
- **THEN** o sistema mostra o saldo consolidado do periodo antes da lista ou matriz de dias

### Requirement: modo mensal deve mostrar contadores compactos por cor
O sistema MUST exibir mini-contadores por estado visual dentro de cada dia do modo mensal.

#### Scenario: leitura mensal sintetica
- **WHEN** o usuario visualiza o calendario mensal
- **THEN** cada dia apresenta marcadores compactos suficientes para identificar volume e tipo de pendencia sem abrir o detalhe

### Requirement: modo semanal deve revelar padrao por turma
O sistema MUST apresentar a semana em matriz por dia e turma para facilitar a leitura do padrao operacional.

#### Scenario: leitura semanal por turma
- **WHEN** o usuario abre o modo semanal
- **THEN** o sistema mostra uma matriz que evidencia distribuicao de estados ao longo dos dias para cada turma relevante

### Requirement: drill-down do dia deve separar diagnostico e acao
O sistema MUST exibir primeiro o resumo consolidado do dia e depois a lista de ocorrencias acionaveis.

#### Scenario: detalhe do dia selecionado
- **WHEN** o usuario abre o drill-down de um dia
- **THEN** o sistema apresenta um bloco de diagnostico resumido antes da lista detalhada de ocorrencias
