## Purpose

Dar explicabilidade imediata aos sinais da escala para que o operador entenda por que um item ficou em alerta sem depender apenas da cor ou da memoria das regras.

## ADDED Requirements

### Requirement: sinais devem expor motivos operacionais resumidos
O sistema MUST exibir um resumo textual dos motivos que compoem o estado operacional de cada item da escala.

#### Scenario: conflito com mais de um motivo
- **WHEN** uma linha da escala concentra mais de um motivo relevante, como conflito, ausencia de substituto ou override
- **THEN** o sistema apresenta um resumo curto capaz de antecipar a leitura do problema sem abrir outro modulo

### Requirement: sinais devem poder ser detalhados no ponto de uso
O sistema MUST permitir consultar o detalhe dos motivos do sinal diretamente na grade e no drill-down da escala.

#### Scenario: detalhamento local do alerta
- **WHEN** o usuario interage com o resumo do sinal em uma linha ou card do drill-down
- **THEN** o sistema revela os motivos operacionais daquele item no proprio contexto da consulta

### Requirement: explicabilidade deve respeitar a semantica da regra de negocio
O sistema MUST descrever os motivos dos sinais usando linguagem coerente com as regras operacionais da escala.

#### Scenario: linguagem do motivo
- **WHEN** um item esta em alerta por conflito, lacuna, substituicao ou override
- **THEN** o sistema apresenta a causa em linguagem que ajude o operador a decidir a proxima acao
