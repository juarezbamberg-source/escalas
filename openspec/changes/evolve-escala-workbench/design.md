## Context

Ver `proposal.md` para a motivação. Hoje a página [EscalaPage.tsx](C:\Users\Juarez\Documents\002 - SENAC\WebSiteEscalas\frontend\src\pages\EscalaPage.tsx) oferece apenas seleção de turno, uma grade simples e um calendário em cards de ocorrência. O frontend já tem roteamento, estado global leve de feedback, cliente `fetch` centralizado e estilos globais suficientes para suportar uma evolução incremental sem trocar de stack.

## Goals / Non-Goals

**Goals:**
- Transformar a tela de escala em uma workbench operacional com triagem rápida e recorte explícito.
- Priorizar primeiro uma barra de filtros avançados compatível com os dados e endpoints já disponíveis.
- Preparar a UI para evoluir depois para calendário agregado e ações contextuais sem reescrever a estrutura principal da página.
- Preservar a leitura por turno como eixo central da experiência.

**Non-Goals:**
- Entregar nesta primeira mudança importação em lote, replicação de escala ou sugestões automáticas completas de substituto.
- Reescrever os fluxos de cadastro já existentes na página de alocações.
- Exigir novas dependências pesadas de estado global ou grid enterprise no frontend.

## Decisions

### 1. Separar filtros em três grupos visuais
Racional: o texto do problema já distingue contexto, status operacional e busca direta; espelhar isso na UI melhora descobribilidade e reduz ambiguidade.
Alternativas consideradas:
- Uma barra única longa: mais rápida de montar, pior de escanear.
- Filtros em modal: economiza espaço, mas esconde o recorte ativo.

### 2. Implementar a primeira entrega inteiramente no frontend
Racional: a barra de filtros avançados pode operar sobre os dados já retornados por `GET /alocacoes` e `GET /alocacoes/calendario`, permitindo validar a UX antes de pedir novos endpoints.
Alternativas consideradas:
- Esperar filtros server-side completos: mais eficiente no longo prazo, mas mais lento para aprender com uso real.
- Duplicar endpoints novos já nesta rodada: adiciona custo backend antes de provar a necessidade.

### 3. Tratar chips e legenda como controles de filtro
Racional: a interface já trabalha com semáforo visual; transformar cores e chips em controles clicáveis reduz o salto mental entre diagnóstico e ação.
Alternativas consideradas:
- Manter legenda passiva: mais simples, porém perde affordance operacional.

### 4. Adotar modelo progressivo de calendário
Racional: a primeira implementação pode sair com agregação mais sintética e drill-down básico, deixando visões mensal/semanal completas em ondas seguintes da mesma mudança.
Alternativas consideradas:
- Construir um calendário completo já de saída: alto custo para validar múltiplas hipóteses de UX de uma vez.

### 5. Planejar inserção de dados como capability separada
Racional: wizard, edição inline, modal contextual e importação em lote têm implicações diferentes de backend, estados e validação; separar evita misturar um ajuste rápido com uma reforma maior de interação.
Alternativas consideradas:
- Entregar tudo junto com filtros: escopo grande demais para uma iteração segura.

## Risks / Trade-offs

- [Filtros client-side em listas maiores] -> Mitigar validando primeiro a UX e introduzindo filtros server-side quando o volume justificar.
- [Interface ficar visualmente carregada] -> Mitigar com agrupamento claro, chips colapsáveis e resumo explícito dos filtros ativos.
- [Calendário agregado exigir mais dados do backend] -> Mitigar definindo fallback progressivo com base no payload atual.
- [Mistura entre consulta e inserção crescer cedo demais] -> Mitigar tratando inserção operacional como segunda frente da mudança, depois da barra de filtros.

## Migration Plan

1. Implementar a barra de filtros avançados e o resumo dos critérios ativos na página de escala.
2. Refinar grade e chips rápidos sem alterar contratos obrigatórios do backend.
3. Evoluir calendário para agregação e drill-down progressivos.
4. Planejar e implementar novos modos de inserção conforme os gaps reais identificados na consulta.

## Open Questions

- A agregação mensal e semanal do calendário provavelmente ficará melhor com endpoints dedicados no futuro. Nesta mudança, a primeira prioridade assume agregação local no frontend até evidência contrária.
