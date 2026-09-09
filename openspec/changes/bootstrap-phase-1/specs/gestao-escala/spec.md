---
name: gestao-escala
added: 2026-09-09
---

# Gestao de Escala

## ADDED Requirements

### Requirement: duplicidade de alocacao e bloqueada por padrao
O sistema MUST impedir duplicidade de alocacao para a mesma turma na mesma data e turno.

#### Scenario: duplicidade simples e recusada
- **GIVEN** existe uma alocacao da turma `7074D` na data `16/03/2026` no turno `manha`
- **WHEN** o usuario tenta criar outra alocacao com a mesma turma, data e turno
- **THEN** o sistema recusa
- **AND** exibe exatamente: `Ja existe uma alocacao para a turma 7074D na data 16/03/2026 no turno manha.`

### Requirement: conflito de professor e bloqueado por padrao
O sistema MUST impedir que o mesmo professor seja alocado em mais de uma turma na mesma data e turno sem override.

#### Scenario: professor em choque de horario
- **GIVEN** a professora `Maria` esta alocada na turma `7073` na data `16/03/2026` no turno `tarde`
- **WHEN** o usuario tenta aloca-la em outra turma na mesma data e turno
- **THEN** o sistema recusa a operacao
- **AND** exibe: `A professora Maria ja esta alocada na turma 7073 no turno tarde na data 16/03/2026.`

### Requirement: titular e substituto devem ser diferentes
O sistema MUST impedir que o professor titular seja identico ao professor substituto na mesma alocacao.

#### Scenario: titular igual a substituto
- **WHEN** o professor substituto selecionado e identico ao professor titular
- **THEN** o sistema bloqueia o registro
- **AND** exibe: `O professor substituto deve ser diferente do professor titular.`

### Requirement: override de conflito deve ser auditavel
O sistema MUST permitir gravar uma alocacao em conflito somente quando o usuario optar por override e fornecer justificativa valida.

#### Scenario: override com justificativa valida
- **WHEN** uma tentativa de alocacao gera duplicidade ou conflito
- **AND** o usuario escolhe registrar mesmo assim com justificativa de 10 ou mais caracteres
- **THEN** o sistema salva a operacao
- **AND** marca o registro como `forcada = true`
- **AND** armazena a justificativa informada

#### Scenario: override com justificativa invalida
- **WHEN** a justificativa esta vazia ou possui menos de 10 caracteres
- **THEN** o sistema recusa o salvamento
- **AND** exibe: `Informe uma justificativa com pelo menos 10 caracteres.`

### Requirement: consulta da escala e organizada por turno
O sistema MUST retornar a grade da escala filtrada por turno e ordenada cronologicamente por data.

#### Scenario: consulta por turno
- **WHEN** o usuario consulta a escala de um turno especifico
- **THEN** o sistema retorna as alocacoes ordenadas por data
- **AND** inclui turma, professor titular e professor substituto

### Requirement: exclusao de alocacao exige confirmacao
O sistema MUST exigir confirmacao antes de remover uma alocacao existente.

#### Scenario: remocao confirmada de alocacao
- **WHEN** o usuario solicita excluir uma alocacao
- **THEN** o sistema exige confirmacao previa antes da remocao
