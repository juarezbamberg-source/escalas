## Purpose

Transformar a tela de escala em uma bancada de consulta operacional, permitindo recortar rapidamente o conjunto de alocacoes por contexto, status e busca direta sem perder visibilidade do que esta filtrado.

## ADDED Requirements

### Requirement: filtros devem ser agrupados por intencao operacional
O sistema MUST apresentar filtros separados em blocos de contexto, status operacional e busca direta na tela de escala.

#### Scenario: agrupamento visivel dos filtros
- **WHEN** o usuario acessa a tela de escala
- **THEN** o sistema exibe controles distintos para contexto, status operacional e busca direta

### Requirement: usuario pode combinar filtros de contexto e status
O sistema MUST permitir combinar ao menos turno, intervalo de datas, turma, professor titular, professor substituto, override e conflito no mesmo recorte.

#### Scenario: combinacao de criterios
- **WHEN** o usuario seleciona um turno, informa um professor e ativa um filtro de conflito
- **THEN** a grade e o calendario refletem apenas os itens compativeis com a combinacao ativa

### Requirement: filtros rapidos devem ser acionaveis por chips
O sistema MUST oferecer chips de filtro rapido para cenarios recorrentes como `Hoje`, `Esta semana`, `Com conflito`, `Sem substituto` e `Overrides`.

#### Scenario: chip rapido aplicado
- **WHEN** o usuario clica no chip `Overrides`
- **THEN** a tela aplica imediatamente o recorte correspondente e sinaliza visualmente que esse criterio esta ativo

### Requirement: recorte ativo deve permanecer explicito
O sistema MUST exibir um resumo legivel da combinacao atual de filtros e permitir limpar criterios individualmente.

#### Scenario: resumo de criterios ativos
- **WHEN** o usuario combina mais de um filtro
- **THEN** o sistema apresenta um resumo visivel do recorte ativo
- **AND** permite remover criterios sem redefinir todos os demais

### Requirement: semaforo deve atuar como controle de filtro
O sistema MUST permitir que os estados `VERDE`, `VERMELHO`, `AMARELO` e `ROXO` sejam usados como filtros clicaveis.

#### Scenario: filtro por semaforo
- **WHEN** o usuario clica no estado `VERMELHO`
- **THEN** a tela restringe a visualizacao a registros em conflito
