## Context

See `proposal.md` for motivation. A tela `EscalaPage` ja concentra grade, calendario, drill-down e drawer contextual em um unico fluxo React, com dados vindos principalmente de `GET /alocacoes` e `GET /alocacoes/calendario`. O estado visual atual ja cobre badges, filtros, resumo de periodo e acoes contextuais, mas a explicacao do sinal ainda esta implicita na combinacao de cor e rótulos curtos, e a coluna de acoes ainda pode evoluir para cenarios de uso repetitivo com mais volume.

## Goals / Non-Goals

**Goals:**
- Tornar o motivo dos sinais visivel no proprio ponto de uso, sem exigir navegacao adicional.
- Reforcar a separacao visual entre titular e substituto e entre acao principal e acao secundaria.
- Planejar um pacote de produtividade que reutilize os dados e componentes atuais da workbench.
- Preservar compatibilidade com as regras de integridade existentes e com a API atual sempre que possivel.

**Non-Goals:**
- Nao introduzir nova dependencia pesada de tooltip, popover ou grid.
- Nao alterar regras de negocio do backend nesta primeira etapa, exceto se uma explicacao realmente exigir novo dado no futuro.
- Nao transformar a tela em visao multi-turno global; o eixo principal continua sendo um turno por vez.

## Decisions

### 1. Explicabilidade primeiro com composicao local de motivos
Os motivos do sinal devem ser derivados no frontend a partir dos dados ja carregados para cada `WorkbenchRow`, reutilizando as mesmas regras visuais da grade e do drill-down.

Rationale:
- reduz dependencias com a API
- permite implementar rapidamente tooltip, texto auxiliar ou popover local
- mantem alinhamento com os badges e com o drawer contextual

Alternativas consideradas:
- pedir ao backend uma lista pronta de motivos por item: mais preciso no longo prazo, mas aumenta escopo e dependencia para uma melhoria que pode nascer no frontend
- apenas alongar os badges atuais: melhora pouco a explicabilidade quando houver mais de um motivo

### 2. Hierarquia de acao por camadas, nao por remocao de opcoes
A acao principal continua visivel, enquanto acoes destrutivas ou menos frequentes devem migrar para camada secundaria, idealmente overflow, dropdown simples ou agrupamento discreto.

Rationale:
- reduz poluicao visual sem esconder capacidade
- preserva o fluxo contextual ja entregue
- combina melhor com linhas mais densas e repetitivas

Alternativas consideradas:
- manter todas as acoes abertas lado a lado: escala mal com volume maior
- esconder tudo dentro de menu: piora velocidade da acao principal

### 3. Pacote de produtividade como evolucao incremental da workbench
O backlog seguinte deve reutilizar os componentes existentes e atacar tres frentes: modo compacto, retomada de contexto e aceleradores de triagem.

Rationale:
- evita reescrever a tela
- permite aplicar melhorias em fatias pequenas com testes de interface
- mantem a workbench aderente ao uso recorrente sem romper a navegacao atual

Alternativas consideradas:
- redesenho amplo da pagina inteira: alto risco e pouco foco
- backlog difuso sem prioridades: dificulta aplicacao incremental

## Risks / Trade-offs

- [Motivos derivados no frontend podem simplificar demais conflitos complexos] -> Mitigar com textos objetivos agora e avaliar endpoint dedicado se surgirem excecoes recorrentes.
- [Mais texto na grade pode aumentar ruido visual] -> Mitigar usando resumo curto e detalhe sob interacao, nao explicacoes longas permanentes.
- [Overflow de acoes pode esconder funcoes pouco usadas] -> Mitigar mantendo rotulo claro e cobertura de teste para acesso as acoes secundarias.
- [Persistencia de contexto pode surpreender em recortes antigos] -> Mitigar com indicacao visivel do recorte ativo e limpeza facil.

## Migration Plan

1. Introduzir primeiro a explicabilidade dos sinais e os ajustes de hierarquia visual sem alterar a API.
2. Atualizar testes de interface cobrindo tooltip ou detalhe local, leitura por papel e camada secundaria de acoes.
3. Validar a ergonomia no fluxo atual de `EscalaPage`.
4. Em iteracao seguinte, aplicar o pacote de produtividade priorizado, mantendo o mesmo conjunto de endpoints enquanto possivel.

## Open Questions

- Vale persistir contexto recente apenas em memoria de sessao do navegador ou como preferencia mais duradoura do operador.
- Se o volume crescer para multiplos turnos simultaneos, a matriz semanal deve continuar por turma ou ganhar um modo adicional por dia e turno.
