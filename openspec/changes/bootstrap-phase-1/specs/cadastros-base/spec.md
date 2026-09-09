---
name: cadastros-base
added: 2026-09-09
---

# Cadastros Base

## ADDED Requirements

### Requirement: cadastro de professores com contratacao
O sistema MUST permitir cadastrar professores com nome e tipo de contratacao `PF`, `CLT` ou `PJ`.

#### Scenario: professor PF possui limite anual de carga
- **WHEN** um professor cadastrado como `PF` atinge 300 horas anuais lancadas
- **THEN** o sistema bloqueia novos lancamentos para esse professor
- **AND** exibe exatamente: `Carga horaria maxima anual de 300 horas atingida para o professor X.`

#### Scenario: professor CLT ou PJ nao usa o teto anual de PF
- **WHEN** um professor cadastrado como `CLT` ou `PJ` recebe novos lancamentos
- **THEN** o limite anual de 300 horas nao se aplica

### Requirement: cadastro de turmas e UCs com integridade referencial
O sistema MUST permitir cadastrar turmas e unidades curriculares mantendo relacionamento consistente entre elas e com as alocacoes.

#### Scenario: exclusao de registros em uso e bloqueada
- **WHEN** o usuario tenta remover turma, professor ou UC vinculados a alocacoes existentes
- **THEN** o sistema impede a exclusao fisica do registro

### Requirement: allowlist de turno
O sistema MUST aceitar apenas os turnos `manha`, `tarde` e `noite` nos fluxos que dependem desse campo.

#### Scenario: turno invalido e rejeitado
- **WHEN** um valor fora da lista permitida e enviado no campo `turno`
- **THEN** o sistema rejeita a requisicao
- **AND** exibe: `Turno invalido. Informe manha, tarde ou noite.`
