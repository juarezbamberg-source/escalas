## Purpose

Permitir que cada operador salve e reaplique conjuntos frequentes de filtros e modo de leitura, reduzindo retrabalho entre consultas recorrentes.

## ADDED Requirements

### Requirement: operador deve poder salvar presets de recorte
O sistema MUST permitir salvar um preset contendo filtros relevantes e modo de leitura da workbench.

#### Scenario: salvar preset atual
- **WHEN** o usuario escolhe salvar o recorte ativo
- **THEN** o sistema registra o preset com nome identificavel e permite reaplicacao futura

### Requirement: operador deve poder reaplicar e excluir presets
O sistema MUST permitir reaplicar e remover presets salvos sem editar manualmente cada filtro.

#### Scenario: reaplicar preset salvo
- **WHEN** o usuario seleciona um preset salvo
- **THEN** o sistema restaura os filtros, o turno e o modo de leitura associados ao preset
