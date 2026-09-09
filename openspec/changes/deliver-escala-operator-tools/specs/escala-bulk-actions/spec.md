## Purpose

Permitir operacoes em lote na escala com validacao previa, confirmacao explicita e feedback claro, reduzindo repeticao manual sem fragilizar as regras de integridade.

## ADDED Requirements

### Requirement: workbench deve permitir selecao multipla de itens
O sistema MUST permitir selecionar multiplas linhas compativeis da escala para tratamento conjunto.

#### Scenario: selecao em grade
- **WHEN** o usuario marca mais de uma linha da grade
- **THEN** o sistema exibe que ha uma selecao ativa e habilita acoes em lote compativeis

### Requirement: remocao em lote deve validar antes de aplicar
O sistema MUST antecipar conflitos, restricoes e incompatibilidades antes da confirmacao final da remocao em lote.

#### Scenario: lote com restricao operacional
- **WHEN** o usuario tenta executar uma remocao em lote sobre itens com incompatibilidades
- **THEN** o sistema apresenta os riscos ou bloqueios antes de confirmar a operacao

### Requirement: remocao em lote deve exigir confirmacao explicita
O sistema MUST exigir confirmacao clara antes de executar operacoes em lote destrutivas ou potencialmente irreversiveis.

#### Scenario: remocao em lote
- **WHEN** o usuario solicita uma remocao em lote
- **THEN** o sistema pede confirmacao explicita antes de efetivar a operacao
