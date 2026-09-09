## Context

See `proposal.md` for motivation. A `EscalaPage` atual ja tem filtros avancados, resumo visivel, grade, calendario, drawer contextual, motivos locais dos sinais e modo compacto. O backlog exibido na tela apontou tres ganhos seguintes de produtividade: atalhos recorrentes, presets de operador e acoes em lote. No backend atual, as operacoes disponiveis para alocacoes continuam essencialmente individuais (`GET`, `POST`, `DELETE`), sem endpoint dedicado para upload de arquivos ou execucao atomica de lote.

## Goals / Non-Goals

**Goals:**
- Entregar atalhos recorrentes e presets salvos sem quebrar a experiencia atual de filtros.
- Introduzir selecao multipla e fluxo seguro de acoes em lote.
- Remover da interface o bloco de backlog desses itens quando eles passarem a existir como funcionalidade real.
- Manter aderencia as regras de integridade da escala durante operacoes coletivas.

**Non-Goals:**
- Nao implementar importacao de planilha Excel nesta mudanca.
- Nao introduzir processamento pesado de arquivos no frontend.
- Nao substituir todas as operacoes individuais por lote; ambas devem coexistir.

## Decisions

### 1. Atalhos e presets podem nascer no frontend
Atalhos recorrentes e presets de filtros podem ser implementados inicialmente no frontend, reaproveitando a estrutura atual de `filters`, `turno`, `calendarMode` e `compactMode`.

Rationale:
- depende apenas de estado local ja existente
- entrega valor rapido sem mudar API
- favorece iteracao curta e validavel por testes de interface

Alternativas consideradas:
- persistir presets no backend desde o inicio: melhor para multiusuario no futuro, mas acima do necessario para a fase 1 atual

### 2. Presets devem usar persistencia local do navegador
Os presets do operador devem usar armazenamento local do navegador, separado do estado efemero da sessao.

Rationale:
- o recorte atual pode continuar em `sessionStorage`
- presets sao preferencias intencionais e duradouras
- evita criar tabelas e endpoints antes de validar a UX

Alternativas consideradas:
- guardar tudo apenas em sessao: ruim para presets que deveriam sobreviver ao fechamento do navegador

### 3. A primeira acao em lote sera remocao segura
A primeira acao coletiva deste pacote sera a remocao em lote, preferencialmente com endpoint proprio no backend, preview de impacto, validacao compartilhada e retorno agregado de sucessos e falhas.

Rationale:
- reduz risco de sucesso parcial silencioso
- reaproveita as regras de integridade ja centralizadas no backend
- prepara o caminho para rollback logico e mensagens consistentes

Alternativas consideradas:
- disparar varias chamadas individuais do frontend: mais simples, mas fragiliza consistencia, feedback e controle de erro

### 4. Importacao Excel e viavel, mas separada
Um botao para importar planilhas Excel e viavel, mas deve ser tratado como fluxo separado com upload, preview, mapeamento de colunas e validacao antes de persistir.

Rationale:
- hoje nao ha endpoint de upload nem parsing de planilha
- importacao em massa muda bastante a superficie de erro e governanca
- merece preview e reconciliacao antes de escrever no banco

Alternativas consideradas:
- botao apenas visual sem backend: geraria expectativa falsa no operador

## Risks / Trade-offs

- [Presets locais nao acompanham o usuario em outra maquina] -> Mitigar deixando claro que sao preferencias do navegador nesta fase.
- [Lote com preview e confirmacao aumenta escopo backend] -> Mitigar limitando a primeira entrega a remocao em lote e cobrindo com testes de servico.
- [Comandos coletivos podem aumentar risco operacional] -> Mitigar com selecao visivel, resumo do impacto e confirmacao explicita.
- [Importacao Excel sem desenho proprio pode causar sujeira de dados] -> Mitigar mantendo fora desta mudanca.

## Migration Plan

1. Implementar atalhos recorrentes sobre o estado atual da workbench.
2. Adicionar presets locais do operador com salvar, reaplicar e excluir.
3. Introduzir selecao multipla na grade e desenhar o fluxo de acao em lote.
4. Criar endpoint de lote se necessario para garantir validacao centralizada.
5. Remover o banner de backlog da interface quando os recursos estiverem ativos.
