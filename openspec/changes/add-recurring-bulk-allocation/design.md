## Context

See `proposal.md` for motivation. O sistema hoje possui cadastro unitario de alocacao no `CadastrosPage`, acao contextual vinda da workbench e remocao em lote, mas ainda nao possui entrada recorrente para criar varias datas da mesma UC/turma. As regras de negocio ja estao concentradas no backend em `app/services/alocacoes.py`, o que favorece reaproveitar validacoes no lote em vez de duplicar logica no frontend.

## Goals / Non-Goals

**Goals:**
- Entregar um fluxo de cadastro recorrente por dias da semana com preview antes de salvar.
- Reaproveitar validacoes de negocio existentes tanto na simulacao quanto na gravacao do lote.
- Manter a experiencia simples para o operador que acabou de cadastrar UC, turma e professor.

**Non-Goals:**
- Nao implementar importacao por arquivo Excel nesta mudanca.
- Nao suportar edicao em lote de registros ja existentes; o foco e geracao inicial de alocacoes.
- Nao substituir o formulario unitario atual; os dois fluxos devem coexistir.

## Decisions

### 1. O lote recorrente tera endpoint proprio de preview e persistencia
Criar um endpoint dedicado para validar e outro para confirmar o lote recorrente, com contrato estruturado por item.

Rationale:
- evita disparar dezenas de `POST /alocacoes` no frontend
- centraliza a regra de geracao de datas e a resposta agregada
- permite feedback claro de validos, bloqueados e persistidos

Alternativas consideradas:
- usar apenas varias chamadas unitarias: mais simples, mas pior para confiabilidade e UX

### 2. A recorrencia sera modelada por intervalo + dias da semana + turnos
O formulario deve pedir data inicial, data final, dias da semana marcados e um ou mais turnos.

Rationale:
- corresponde ao uso operacional descrito pelo usuario
- resolve a maior parte dos cadastros iniciais sem exigir upload
- permite reaproveitar turma e professor ja escolhidos

Alternativas consideradas:
- lista manual de datas: flexivel, mas volta a ser trabalho repetitivo

### 3. Preview e gravacao devem usar o mesmo motor de validacao
O backend deve gerar todas as ocorrencias candidatas e executar as validacoes item a item com um caminho compartilhado, diferenciando apenas entre simular e persistir.

Rationale:
- reduz divergencia entre o que o preview promete e o que a confirmacao grava
- facilita testes automatizados de regras criticas

Alternativas consideradas:
- preview superficial no frontend: rapido, mas inseguro e inconsistente

### 4. O frontend de cadastros ganha um bloco proprio de lancamento recorrente
Adicionar na tela de cadastros um card ou secao especifica para lote recorrente, separado do formulario unitario.

Rationale:
- mantem claro quando o operador esta criando uma data isolada ou uma agenda recorrente
- permite mostrar resumo, bloqueios e confirmacao sem poluir o formulario simples

Alternativas consideradas:
- encaixar tudo no formulario atual com um checkbox de modo lote: economiza espaco, mas tende a confundir os dois fluxos

## Risks / Trade-offs

- [Intervalos longos podem gerar volume alto de ocorrencias] -> Mitigar com preview resumido e limite inicial de faixa razoavel se necessario.
- [Conflitos parciais no lote podem gerar expectativa de gravacao parcial silenciosa] -> Mitigar mostrando claramente itens validos, bloqueados e politica de confirmacao.
- [Duplicar geracao de datas entre frontend e backend] -> Mitigar deixando o backend como fonte de verdade e usando o frontend apenas para coleta e exibicao.
- [Override em lote aumenta risco operacional] -> Mitigar exigindo justificativa valida e confirmacao explicita.

## Migration Plan

1. Adicionar schemas e servico de geracao recorrente no backend.
2. Expor endpoints de preview e confirmacao do lote.
3. Implementar a secao de cadastro recorrente no frontend com selecao de dias da semana.
4. Cobrir preview, conflitos e persistencia com testes backend e frontend.
5. Atualizar a documentacao funcional da tela de cadastros.
