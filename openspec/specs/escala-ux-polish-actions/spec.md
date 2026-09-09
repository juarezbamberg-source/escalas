# escala-ux-polish-actions Specification

## Purpose

Suavizar a transicao entre analise e acao na tela de escala por meio de insercao contextual assistida, com pre-preenchimento amplo e validacoes preventivas.

## Requirements

### Requirement: acoes contextuais devem abrir em contexto local
O sistema MUST abrir `Alocar`, `Substituir` e `Justificar override` em drawer lateral ou modal contextual antes de exigir navegacao completa para outro modulo.

#### Scenario: abertura da acao contextual
- **WHEN** o usuario aciona uma operacao a partir da grade ou do drill-down
- **THEN** o sistema abre a interface de insercao dentro da propria experiencia da escala

### Requirement: fluxo contextual deve pre-preencher os campos conhecidos
O sistema MUST preencher automaticamente turno, data, turma e professor titular quando essas informacoes ja estiverem definidas no item de origem.

#### Scenario: substituicao a partir de ocorrencia existente
- **WHEN** o usuario inicia a acao `Substituir` a partir de uma ocorrencia da escala
- **THEN** o sistema abre o fluxo com os campos conhecidos ja preenchidos

### Requirement: fluxo contextual deve antecipar validacoes operacionais
O sistema MUST exibir avisos preventivos para conflito, ausencia de substituto e exigencia de justificativa antes do envio final.

#### Scenario: aviso de substituto ausente
- **WHEN** o usuario inicia uma substituicao e ainda nao informou o substituto
- **THEN** o sistema apresenta um aviso preventivo antes do submit

### Requirement: formulario completo deve permanecer acessivel
O sistema MUST manter um caminho secundario para abrir o formulario completo sem perder o contexto ja montado.

#### Scenario: escalonamento para formulario completo
- **WHEN** o usuario precisa de um fluxo mais amplo do que o drawer contextual oferece
- **THEN** o sistema permite abrir o formulario completo preservando o recorte e os campos ja conhecidos
