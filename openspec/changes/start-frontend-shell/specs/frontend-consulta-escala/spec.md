## Purpose

Permitir consultar e interpretar a escala por turno em uma visao amigavel, aproveitando os endpoints ja existentes para lista cronologica e calendario com semaforo visual.

## ADDED Requirements

### Requirement: usuario pode consultar escala por turno
O sistema MUST permitir selecionar `manha`, `tarde` ou `noite` e atualizar a grade da escala com base no turno escolhido.

#### Scenario: troca de turno atualiza a grade
- **WHEN** o usuario escolhe um turno especifico
- **THEN** o sistema consulta a API correspondente e exibe a grade cronologica da escala para o turno selecionado

### Requirement: grade deve exibir informacoes principais da alocacao
O sistema MUST exibir para cada alocacao a data, a turma, o professor titular, o professor substituto quando existir e a indicacao de override quando o registro for forcado.

#### Scenario: alocacao com substituto e override
- **WHEN** a consulta retorna uma alocacao com professor substituto e `forcada = true`
- **THEN** a grade exibe titular, substituto e algum indicativo visual de que o registro foi salvo com override

### Requirement: calendario deve usar o semaforo da escala
O sistema MUST representar os estados `VERDE`, `VERMELHO`, `AMARELO` e `ROXO` retornados pela API com cores visiveis e legenda compreensivel.

#### Scenario: legenda e cores do calendario
- **WHEN** o calendario recebe itens com `status_visual`
- **THEN** o sistema exibe cada item com a cor correspondente e apresenta uma legenda explicando o significado de cada estado

### Requirement: consulta deve tratar estados de carregamento e vazio
O sistema MUST informar quando a consulta esta carregando e quando nao existem alocacoes para o turno selecionado.

#### Scenario: turno sem registros
- **WHEN** a API retorna lista vazia para a consulta de escala
- **THEN** o sistema exibe um estado vazio compreensivel sem tratar a resposta como erro
