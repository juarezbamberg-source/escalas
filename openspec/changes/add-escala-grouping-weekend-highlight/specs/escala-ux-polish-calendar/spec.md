## MODIFIED Requirements

### Requirement: modo mensal deve mostrar contadores compactos por cor
O sistema MUST exibir mini-contadores por estado visual dentro de cada dia do modo mensal e diferenciar visualmente sabados e domingos.

#### Scenario: leitura mensal sintetica
- **WHEN** o usuario visualiza o calendario mensal
- **THEN** cada dia apresenta marcadores compactos suficientes para identificar volume e tipo de pendencia sem abrir o detalhe
- **AND** sabados e domingos aparecem com destaque visual proprio para leitura rapida do fim de semana

### Requirement: modo semanal deve revelar padrao por turma
O sistema MUST apresentar a semana em matriz por dia e turma para facilitar a leitura do padrao operacional e diferenciar visualmente sabados e domingos.

#### Scenario: leitura semanal por turma
- **WHEN** o usuario abre o modo semanal
- **THEN** o sistema mostra uma matriz que evidencia distribuicao de estados ao longo dos dias para cada turma relevante
- **AND** as colunas de sabado e domingo ficam visualmente destacadas

## ADDED Requirements

### Requirement: dias nao letivos devem ser reconhecidos na operacao
O sistema MUST tratar sabados, domingos e feriados nacionais como dias nao letivos para fins de cadastro e leitura contextual.

#### Scenario: tentativa de cadastro em dia nao letivo
- **WHEN** o usuario tenta criar uma alocacao em sabado, domingo ou feriado nacional
- **THEN** o sistema bloqueia a operacao informando que a data nao e letiva

#### Scenario: consulta inclui dia nao letivo
- **WHEN** uma consulta por periodo inclui sabado, domingo ou feriado nacional
- **THEN** o sistema diferencia esse dia como nao letivo em vez de apresenta-lo apenas como falta de professor
