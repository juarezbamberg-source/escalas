# Especificação: Onda 3 — refatoração e carga por professor

## Requisito: carga consolidada por professor

O sistema MUST disponibilizar `GET /professores/carga` com a carga agregada por professor.

### Cenário: professor titular recebe carga

- **WHEN** existem alocações com o professor como titular
- **THEN** a resposta inclui o professor e a quantidade de horas correspondente

### Cenário: professor substituto recebe carga

- **WHEN** existem alocações com o professor como substituto
- **THEN** a resposta inclui essas horas na mesma consolidação do professor

### Cenário: nenhum registro

- **WHEN** não existem alocações
- **THEN** a resposta é uma lista vazia com status de sucesso

## Requisito: dashboard usa contrato dedicado

O dashboard MUST consumir o endpoint de carga, sem buscar os três turnos apenas para calcular horas no cliente.

### Cenário: erro na carga

- **WHEN** o endpoint de carga falha
- **THEN** o dashboard exibe a mensagem de erro padrão e encerra o estado de carregamento

## Requisito: decomposição do workbench

`EscalaPage` MUST delegar dados, filtros, persistência, remoção em lote e consulta por turma aos hooks definidos na change.

### Cenário: recarga após persistência

- **WHEN** uma alocação é criada, substituída, removida ou alterada por override
- **THEN** o hook de dados permite recarregar a visão sem duplicar a consulta na página

## Requisito: decomposição de cadastros

`CadastrosPage` MUST compor os cinco formulários de domínio e preservar os fluxos atuais de cadastro, alocação unitária e lote recorrente.

### Cenário: formulário recebe erro da API

- **WHEN** uma operação de formulário falha
- **THEN** o helper compartilhado converte o erro para a mensagem exibida atualmente

## Requisito: compatibilidade

A refatoração MUST preservar as regras de negócio, contratos existentes, deep links, classes CSS e acessibilidade dos controles.
