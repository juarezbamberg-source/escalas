---
name: visualizacao-calendario
added: 2026-09-09
---

# Visualizacao do Calendario

## ADDED Requirements

### Requirement: semaforo visual do calendario
O sistema MUST classificar visualmente a grade da escala com quatro estados de cor.

#### Scenario: celula verde
- **WHEN** um dia letivo possui uma turma preenchida por exatamente um professor sem conflito de horario
- **THEN** a celula e exibida em `VERDE`

#### Scenario: celula vermelha
- **WHEN** o mesmo professor esta alocado em duas turmas no mesmo horario
- **THEN** as duas alocacoes sao exibidas em `VERMELHO`

#### Scenario: celula amarela
- **WHEN** uma turma nao possui professor alocado em um dia letivo
- **THEN** a celula e exibida em `AMARELO`

#### Scenario: celula roxa
- **WHEN** dois professores estao alocados na mesma turma no mesmo horario
- **AND** um deles e titular e o outro e substituto
- **THEN** a celula e exibida em `ROXO`
