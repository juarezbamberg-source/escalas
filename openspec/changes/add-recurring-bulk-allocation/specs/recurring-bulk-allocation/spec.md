## Purpose

Permitir que a equipe registre rapidamente uma nova frente de aulas sem repetir manualmente cada data da escala, usando recorrencia semanal e validacao antes da gravacao.

## ADDED Requirements

### Requirement: sistema deve permitir gerar lote recorrente por dias da semana
O sistema MUST permitir que o usuario informe turma, professor titular, intervalo de datas, dias da semana e turnos para gerar um conjunto recorrente de alocacoes.

#### Scenario: montagem de lote recorrente
- **WHEN** o usuario configura um lote com periodo, dias da semana e ao menos um turno
- **THEN** o sistema calcula as datas elegiveis dentro do intervalo e prepara os lancamentos correspondentes

### Requirement: sistema deve mostrar preview antes de gravar o lote
O sistema MUST apresentar ao usuario um resumo do lote antes da persistencia final, incluindo quantidade total, itens validos e itens bloqueados.

#### Scenario: preview do lote
- **WHEN** o usuario solicita validar o lote antes de salvar
- **THEN** o sistema retorna a lista de ocorrencias geradas e sinaliza quais podem ser gravadas e quais possuem bloqueios

### Requirement: sistema deve preservar regras de integridade no lote
O sistema MUST aplicar as mesmas regras de duplicidade, conflito de professor, titular igual a substituto, turno valido e limite de PF durante a validacao e a gravacao em lote.

#### Scenario: item do lote com conflito
- **WHEN** uma das ocorrencias geradas viola regra de negocio existente
- **THEN** o sistema marca esse item como bloqueado no preview e impede sua gravacao sem override valido

### Requirement: sistema deve permitir override recorrente apenas com justificativa valida
O sistema MUST exigir justificativa minima quando o usuario solicitar que o lote recorrente grave ocorrencias em modo override.

#### Scenario: override recorrente sem justificativa suficiente
- **WHEN** o usuario ativa override no lote e informa justificativa menor que 10 caracteres
- **THEN** o sistema rejeita a operacao antes da gravacao
