## Context

See `proposal.md` for motivation. A `EscalaPage` atual ja concentra filtros avancados, grade por turno, calendario sintetico e acoes contextuais, mas a consulta continua orientada ao panorama operacional do turno inteiro. No backend, os endpoints atuais retornam alocacoes por turno e itens de calendario, o que nao cobre diretamente uma lista por turma e periodo com lacunas explicitas em cada data/turno esperado.

## Goals / Non-Goals

**Goals:**
- Introduzir uma consulta dirigida por turma e periodo dentro da propria workbench de `Escala por turno`.
- Retornar linhas explicitas para dias sem alocacao, de modo que a ausencia de professor apareca no resultado.
- Reaproveitar as entidades atuais de turma, professor e alocacao sem criar um fluxo paralelo desconectado da tela principal.
- Preservar compatibilidade com SQLite no desenvolvimento e com PostgreSQL no desenho final.

**Non-Goals:**
- Nao substituir a grade principal orientada por turno; a nova consulta sera complementar.
- Nao introduzir importacao de planilhas ou upload de arquivos nesta mudanca.
- Nao remodelar a regra de negocio de conflitos, override ou limite PF; a consulta apenas consome essas informacoes.

## Decisions

### 1. Criar endpoint dedicado para consulta por turma e periodo
A nova consulta deve usar um endpoint proprio no backend em vez de recombinar apenas os endpoints de turno no frontend.

Rationale:
- a tela precisa receber dias sem alocacao ja normalizados como linhas consultaveis
- evita duplicar no frontend a logica de gerar periodo, cruzar datas e detectar lacunas
- centraliza a regra do que e um turno esperado para a turma no backend

Alternativas consideradas:
- montar a consulta apenas no frontend a partir de `GET /alocacoes` e `GET /alocacoes/calendario`: aumentaria acoplamento, repeticao e chance de divergencia

### 2. Preencher lacunas com base no turno informado ou no turno padrao da turma
Quando a consulta nao informar turno, o sistema deve gerar linhas esperadas usando o `turno_padrao` da turma; quando informar turno, o resultado deve usar somente esse turno.

Rationale:
- atende o caso operacional descrito para a turma `670007074D`, que ja possui turno padrao conhecido
- evita multiplicar linhas desnecessarias para manha, tarde e noite quando a turma opera em um turno definido
- mantem a consulta enxuta e mais proxima da realidade academica atual

Alternativas consideradas:
- listar sempre os tres turnos por dia: deixaria o resultado mais ruidoso e menos aderente ao cadastro da turma

### 3. Situacao deve ser devolvida como semantica pronta para a tabela
O backend deve devolver uma situacao textual simples por linha, como `Confirmada` ou `Sem professor definido`, para reduzir inferencia no frontend.

Rationale:
- melhora consistencia entre tabela, testes e futuros exports
- reduz regras visuais espalhadas na tela

Alternativas consideradas:
- deixar o frontend inferir tudo a partir de campos nulos: mais flexivel, mas menos uniforme

### 4. A entrada da consulta fica como bloco proprio dentro da workbench
Na `Escala por turno`, a nova funcionalidade deve aparecer como um bloco proprio com CTA claro `Consultar professor da turma`, separado dos presets e filtros gerais.

Rationale:
- evita confundir a funcionalidade com atalhos ou recortes salvos
- reforca que o objetivo e responder uma pergunta dirigida por turma e periodo

Alternativas consideradas:
- esconder a consulta dentro de presets do operador: conflita com a linguagem operacional desejada

## Risks / Trade-offs

- [Consulta dedicada aumentar superficie da API] -> Mitigar com endpoint pequeno, de leitura, e testes de contrato no backend.
- [Lacunas geradas a partir do turno padrao nao cobrirem casos atipicos] -> Mitigar aceitando filtro opcional de turno para consultas excepcionais.
- [Mistura de duas formas de consulta na mesma tela aumentar densidade visual] -> Mitigar com bloco proprio, titulo explicito e resultado em tabela separada da grade principal.
- [Situacao textual endurecer vocabulario cedo demais] -> Mitigar mantendo conjunto curto e operacional de estados, alinhado ao que a tela realmente precisa mostrar.

## Migration Plan

1. Adicionar schemas e endpoint de leitura por turma e periodo no backend.
2. Cobrir retorno com alocacao existente e lacuna explicita em testes automatizados.
3. Integrar a consulta na `EscalaPage` com formulario proprio e tabela de resultados.
4. Atualizar estilos e documentacao da tela para refletir a nova capacidade.
