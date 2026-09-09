## Context

See `proposal.md` for motivation. A `EscalaPage` atual ja oferece filtros, grade detalhada, consulta dirigida por turma e calendario sintetico, mas a grade principal ainda rende uma linha por ocorrencia de forma continua. Isso escala mal quando houver muitas datas e professores. Alem disso, o calendario ja diferencia estados operacionais, porem ainda nao sinaliza fins de semana como contexto temporal, e o backend ainda aceita cadastros em datas que a operacao considera nao letivas.

## Goals / Non-Goals

**Goals:**
- Reduzir o comprimento visual inicial da grade por meio de agrupamento por UC e turma.
- Permitir abrir detalhes apenas quando o operador precisar agir naquele conjunto.
- Destacar sabados e domingos nas visoes de calendario sem esconder o semaforo operacional.
- Bloquear sabados, domingos e feriados nacionais em cadastros unitarios e recorrentes.
- Manter a experiencia compativel com os filtros, acoes contextuais e selecao existentes.

**Non-Goals:**
- Nao substituir a grade detalhada por cards ou outro paradigma.
- Nao alterar regras de negocio de alocacao, conflito ou override.
- Nao criar uma nova pagina para essa leitura; a evolucao continua dentro de `Escala por turno`.

## Decisions

### 1. Levar a identificacao da UC para a grade da API existente
Para agrupar com confianca por UC e turma, o frontend deve receber identificacao da UC diretamente na resposta das alocacoes.

Rationale:
- evita inferencia incompleta a partir de turma apenas
- mantem o agrupamento consistente entre grade, selecao e testes
- reaproveita relacionamento ja carregado no backend

Alternativas consideradas:
- buscar UC separadamente no frontend e cruzar por turma: mais acoplamento e mais estado derivado local

### 2. Agrupar no frontend, preservando linhas detalhadas atuais
A API pode continuar retornando linhas individuais, enquanto o frontend constroi grupos por `uc + turma` e controla expansao local.

Rationale:
- minimiza mudanca de contrato
- preserva reuso das acoes e badges atuais dentro das linhas expandidas
- facilita aplicar filtros antes de montar os grupos visiveis

Alternativas consideradas:
- pedir grupos prontos ao backend: reduziria trabalho no cliente, mas engessaria a composicao visual

### 3. Destacar fim de semana como camada de contexto, nao como novo status
Sabado e domingo devem ganhar destaque visual amarelo de contexto no calendario, sem substituir `VERDE`, `VERMELHO`, `AMARELO` ou `ROXO` como semaforo operacional.

Rationale:
- o fim de semana e informacao temporal, nao estado de integridade
- evita conflito conceitual com a legenda atual
- permite combinar semaforo e calendario semanal/mensal com mais clareza

Alternativas consideradas:
- converter fim de semana em novo status: quebraria a semantica atual e confundiria filtros

### 4. Centralizar dias nao letivos no backend
Sabados, domingos e feriados nacionais devem ser validados por uma funcao de dominio unica no backend, reutilizada por cadastro unitario, recorrente e consultas por periodo.

Rationale:
- evita divergencia entre fluxo unitario e lote
- permite devolver mensagens consistentes para bloqueio e leitura contextual
- reduz risco de consultas mostrarem fim de semana como simples lacuna

Alternativas consideradas:
- validar apenas no frontend: inseguro e insuficiente para proteger a API

### 5. Feriados nacionais serao mantidos por regra local deterministica
Nesta fase, a aplicacao pode usar uma lista local de feriados nacionais fixos e moveis necessarios, calculada sem dependencia externa.

Rationale:
- evita acoplamento a API externa para uma regra basica da operacao
- mantem funcionamento identico em desenvolvimento com SQLite e em producao com PostgreSQL

Alternativas consideradas:
- consultar servico externo de calendario: adicionaria dependencia e risco operacional desnecessarios nesta fase

## Risks / Trade-offs

- [Adicionar UC ao payload de alocacao tocar frontend e backend] -> Mitigar com campos opcionais compatíveis e testes de contrato.
- [Grupo recolhido esconder problemas relevantes] -> Mitigar exibindo resumo com quantidade e sinais no cabecalho do grupo.
- [Amarelo de fim de semana competir com amarelo de lacuna] -> Mitigar usando amarelo contextual mais suave e mantendo badges/contadores operacionais intactos.
- [Lista local de feriados exigir manutencao anual] -> Mitigar isolando a regra em utilitario unico e cobrindo com testes das datas conhecidas.

## Migration Plan

1. Estender resposta da API com identificacao de UC necessaria para agrupamento.
2. Implementar validacao de dias nao letivos no backend para cadastro unitario, recorrente e consultas por periodo.
3. Implementar agrupamento expansivel da grade no frontend e verificar preservacao das acoes atuais.
4. Aplicar destaque visual de sabado e domingo nas visoes semanal e mensal.
5. Atualizar testes e README com o novo comportamento.
