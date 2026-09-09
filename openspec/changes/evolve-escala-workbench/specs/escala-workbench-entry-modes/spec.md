## Purpose

Preparar a evolucao da insercao de dados para modelos mais proximos da operacao real, reduzindo a distancia entre identificar um problema na escala e corrigi-lo na mesma experiencia.

## ADDED Requirements

### Requirement: sistema deve suportar evolucao para fluxo assistido de alocacao
O sistema MUST permitir evoluir de formulario simples para um fluxo assistido orientado por contexto operacional.

#### Scenario: fluxo assistido a partir do recorte atual
- **WHEN** o usuario inicia uma nova alocacao a partir de um turno e data ja filtrados
- **THEN** o sistema preenche ou restringe automaticamente os campos coerentes com esse contexto

### Requirement: sistema deve prever acoes contextuais de insercao
O sistema MUST prever acoes como `Alocar`, `Substituir`, `Remover` e `Justificar override` a partir da grade ou do calendario.

#### Scenario: acao contextual em pendencia
- **WHEN** o usuario abre o detalhe de uma lacuna ou conflito
- **THEN** o sistema oferece acoes diretas relacionadas a esse caso

### Requirement: sistema deve preservar validacoes de negocio na experiencia de insercao
O sistema MUST continuar exibindo e respeitando os erros de duplicidade, conflito, diferenca entre titular/substituto e override sem justificativa.

#### Scenario: tentativa de override sem justificativa
- **WHEN** o usuario tenta registrar override sem justificativa valida
- **THEN** o sistema bloqueia a conclusao da operacao ou exibe a mensagem exata retornada pela API

### Requirement: backlog de entrada em lote deve ficar explicitado
O sistema MUST manter como evolucao planejada a importacao em lote e a replicacao de escala sem confundir essas capacidades com a entrega inicial de filtros.

#### Scenario: roadmap visivel de insercao
- **WHEN** a equipe revisa a mudanca de workbench
- **THEN** o backlog futuro de importacao e replicacao permanece especificado separadamente da primeira iteracao
