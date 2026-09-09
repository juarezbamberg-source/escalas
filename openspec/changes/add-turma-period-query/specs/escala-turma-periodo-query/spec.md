## Purpose

Permitir uma consulta dirigida por turma e intervalo de datas para responder quem foi alocado em cada dia e turno, inclusive deixando explicitas as lacunas sem professor definido.

## ADDED Requirements

### Requirement: usuario pode consultar professores por turma e periodo
O sistema MUST permitir consultar uma turma em um intervalo de datas e retornar uma lista por data e turno com os professores alocados.

#### Scenario: consulta basica por turma
- **WHEN** o usuario informa uma turma, uma data inicial e uma data final validas
- **THEN** o sistema retorna uma tabela com `data`, `turno`, `turma`, `professor titular`, `substituto` e `situacao` para o periodo consultado

### Requirement: consulta deve explicitar lacunas sem professor
O sistema MUST incluir no resultado os dias e turnos esperados da turma mesmo quando nao existir alocacao salva, sinalizando explicitamente a ausencia de professor.

#### Scenario: dia sem alocacao registrada
- **WHEN** existe um dia do periodo consultado sem alocacao para a turma no turno considerado
- **THEN** o sistema exibe esse dia na tabela com indicacao explicita de ausencia de professor titular

### Requirement: consulta deve aceitar refinamentos opcionais
O sistema MUST permitir refinar a consulta por turno e pela exibicao de substituicoes sem tornar esses filtros obrigatorios.

#### Scenario: filtro opcional de turno
- **WHEN** o usuario informa tambem um turno na consulta
- **THEN** o sistema restringe o resultado aos registros e lacunas daquele turno

#### Scenario: ocultacao de coluna de substituicao
- **WHEN** o usuario desativa a exibicao de substituicoes
- **THEN** o sistema mantem a consulta por turma e periodo sem destacar o substituto como coluna principal do resultado
