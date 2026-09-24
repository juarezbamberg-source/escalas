# ADR-010 — Navegação por sidebar, dashboards com período e exportação universal

**Status**: proposta (2026-09-24)
**Contexto**: Onda 11 — feedback de usabilidade do dono do produto.

## Decisão

1. **Navegação muda de top-nav para sidebar agrupada por tarefa** (Operação / Cadastros / Administração), com drawer hambúrguer no mobile. A top-nav atual será removida.
2. **Cadastros é dividido em 3 páginas** (Professores, Turmas, UCs) com rotas próprias; a rota antiga `/cadastros` faz redirect para `/cadastros/professores`. Nenhuma URL externa depende das rotas antigas (sistema interno, sem bookmarks de terceiros), então o redirect é cortesia, não requisito.
3. **Período vira cidadão de primeira classe no Dashboard**: a carga realizada ganha filtro `data_inicio`/`data_fim` no backend (retrocompatível — sem parâmetros, comportamento atual). O resumo operacional já aceitava; passa a ser usado. A carga prevista continua sendo um recorte pontual (`vigente_em` = data final do período), pois atribuições têm vigência, não fatiamento diário.
4. **Exportação universal**: Dashboard e Carga passam a exportar PDF/Excel com o período no cabeçalho, reutilizando os chunks lazy de jspdf/xlsx da Onda 10 (sem regressão no code-split).
5. **EscalaPage não é dividida nesta onda** — apesar de grande (1.940 linhas), é a tela mais usada e estável; mexer nela junto com navegação amplia o risco sem ganho proporcional. Split fica no backlog com gatilho: dor de manutenção comprovada.

## Alternativas consideradas

- **Manter top-nav e só reorganizar itens**: rejeitado — o problema relatado é descoberta de funcionalidade; agrupamento vertical com rótulos resolve melhor com 8+ itens de menu.
- **Abas dentro de Cadastros (status quo aprimorado)**: rejeitado — o monólito de 1.400 linhas é difícil de manter e testar; páginas separadas isolam escopo e permitem deep-link direto.
- **Envelope de paginação server-side junto com os filtros de período**: rejeitado — escopo diferente (listagens, não dashboard); segue adiado conforme decisão da Onda 10.
- **Gráfico de linha temporal (carga por dia/semana)**: adiado — exigiria endpoint novo de série temporal; o seletor de período atende a dor relatada (números do período escolhido).

## Consequências

- Backend: 1 endpoint estendido com parâmetros opcionais retrocompatíveis; sem migração.
- Frontend: refactor de navegação + split de uma página grande — maior risco de regressão visual, mitigado por testes de rota e validação manual.
- Usuários precisam se reacostumar com a sidebar (mudança deliberada, solicitada).
- Testes de cadastros são divididos em 3 arquivos — mesma cobertura, melhor isolamento.
