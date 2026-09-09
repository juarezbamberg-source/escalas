## Purpose

Disponibilizar formularios iniciais para alimentar o sistema com professores, UCs, turmas e alocacoes, preservando no frontend as mensagens de validacao ja definidas pela API.

## ADDED Requirements

### Requirement: usuario pode cadastrar entidades basicas
O sistema MUST oferecer formularios iniciais para cadastrar professores, unidades curriculares e turmas consumindo a API existente.

#### Scenario: cadastro bem-sucedido
- **WHEN** o usuario preenche um formulario valido e envia os dados
- **THEN** o sistema persiste o registro pela API e atualiza a interface com confirmacao visual

### Requirement: usuario pode criar alocacoes pela interface
O sistema MUST oferecer um formulario inicial de alocacao com selecao de turno, turma, professor titular e professor substituto opcional.

#### Scenario: criacao de alocacao simples
- **WHEN** o usuario envia uma alocacao valida
- **THEN** o sistema salva o registro, limpa ou atualiza o formulario e reflete a nova alocacao na consulta correspondente

### Requirement: frontend deve exibir mensagens exatas de erro de negocio
O sistema MUST preservar e exibir ao usuario as mensagens de erro retornadas pela API para conflito, validacao e limite de carga.

#### Scenario: erro de duplicidade retornado pela API
- **WHEN** a API responde com erro de negocio ao tentar salvar uma alocacao
- **THEN** o sistema exibe a mensagem retornada sem substituir seu texto por uma mensagem generica

### Requirement: formulario deve suportar override de alocacao
O sistema MUST permitir que o usuario tente registrar uma alocacao com override, informando justificativa obrigatoria quando essa opcao estiver ativa.

#### Scenario: override sem justificativa suficiente
- **WHEN** o usuario ativa override e informa uma justificativa invalida
- **THEN** o sistema bloqueia o envio ou destaca a resposta de erro da API deixando claro que a justificativa minima e obrigatoria
