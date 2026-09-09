## Context

Ver `proposal.md` para a motivacao. A tela de escala ja possui filtros avancados, grade sintetica, calendario agregado, drill-down lateral e acoes contextuais que encaminham para `CadastrosPage` via URL. O proximo ganho relevante nao vem de novas capacidades grandes, e sim de reduzir atrito perceptivo entre diagnostico e acao, alem de fortalecer a semantica visual do calendario.

## Goals / Non-Goals

**Goals:**
- Tornar o recorte ativo mais escaneavel com melhor espacamento, agrupamento e consistencia de badges.
- Promover os modos `Agenda`, `Semanal` e `Mensal` a uma navegacao mais evidente dentro da area de calendario.
- Aumentar a densidade informacional do calendario sem perder clareza, principalmente nas visoes semanal e mensal.
- Abrir acoes de insercao em contexto local da pagina de escala, evitando a sensacao de mudanca brusca de modulo.
- Antecipar validacoes operacionais na propria acao contextual, antes do submit final.

**Non-Goals:**
- Reescrever integralmente `CadastrosPage` ou remover seu uso como fallback de operacao.
- Criar novos endpoints obrigatorios para a primeira iteracao de polimento.
- Introduzir biblioteca de calendario externa ou sistema de design pesado.

## Decisions

### 1. Tratar o calendario como sub-workbench com navegacao primaria propria
Racional: `Agenda`, `Semanal` e `Mensal` sao modos centrais de leitura e devem parecer abas de primeira classe, nao chips secundarios.
Alternativas consideradas:
- Manter chips pequenos no topo: mais barato, menos legivel.
- Separar cada modo em rota propria: mais claro, mas fragmenta demais a consulta.

### 2. Adotar resumo consolidado do periodo acima do calendario
Racional: antes de entrar em dias especificos, o operador deve enxergar o saldo do recorte atual, como conflitos, lacunas, substituicoes e overrides.
Alternativas consideradas:
- Resumo apenas no drill-down: chega tarde demais.
- Resumo apenas textual no rodape: pouca visibilidade.

### 3. Modelar o modo semanal como matriz por turma e dia
Racional: como o turno ja e filtro primario da pagina, a melhor segunda dimensao para revelar padrao operacional e a turma.
Alternativas consideradas:
- Linhas por turno: redundante com o escopo atual da tela.
- Continuar listando dias agrupados por semana: melhora pouco em relacao ao estado atual.

### 4. Abrir acoes contextuais em drawer lateral reutilizando o formulario atual
Racional: um drawer preserva o pano de fundo da analise, reduz deslocamento mental e reaproveita boa parte do formulario de alocacao existente.
Alternativas consideradas:
- Modal central: mais simples, mas pior para formularios maiores e leitura simultanea do contexto.
- Navegacao imediata para `CadastrosPage`: funcional, porem abrupta.

### 5. Fazer validacoes preventivas no frontend a partir do dataset ja carregado
Racional: conflitos, ausencia de substituto em fluxo de substituicao e obrigatoriedade de justificativa podem ser antecipados com os dados disponiveis antes de depender da resposta da API.
Alternativas consideradas:
- Confiar apenas nas validacoes da API: preserva integridade, mas entrega feedback tardio.
- Criar endpoint de prevalidacao agora: mais completo, mas prematuro para esta rodada.

## Risks / Trade-offs

- [Drawer contextual crescer demais] -> Mitigar restringindo a primeira versao a `Alocar`, `Substituir` e `Justificar override`, com fallback de navegacao completa se necessario.
- [Validacoes preventivas divergirem da API] -> Mitigar exibindo-as como aviso preliminar e preservando a mensagem exata do backend como fonte final.
- [Modo semanal exigir muita largura] -> Mitigar com scroll horizontal controlado e fallback compacto no mobile.
- [Modo mensal ficar denso em excesso] -> Mitigar usando mini-contadores por cor em vez de texto corrido.

## Migration Plan

1. Refinar layout de filtros, badges e hierarquia visual sem mudar fluxo de dados.
2. Reestruturar o calendario com abas visuais claras, resumo do periodo e celulas mais informativas.
3. Introduzir drawer contextual para insercao assistida reaproveitando o formulario atual.
4. Manter `CadastrosPage` como rota operacional completa e fallback para casos mais amplos.

## Wireframe Textual

```text
[ Escala por turno ]
  [Manha] [Tarde] [Noite]

[ Filtros avancados ]
  Contexto            Status operacional         Busca direta
  [de ____ ate ____]  [Conflito] [Lacuna]        [Titular v]
  [Turma v]           [Sem substituto]           [Substituto v]
                      [Override] [Padrao]        [Busca livre________]

  Atalhos: [Hoje] [Esta semana] [Overrides]
  Recorte ativo: Turno: noite • Semana atual • Titular: Juarez • Semaforo: vermelho

[ Grade da escala ]
  Data      Turma   Professores                 Sinais                 Acao
  12/09     7074D   Juarez / sem substituto     [VERMELHO] [Conflito] [Acao principal v]

[ Calendario ]
  [Agenda] [Semanal] [Mensal]
  Resumo do periodo: [1 conflito] [0 lacunas] [1 substituicao] [1 override]

  Agenda:
    [Dia 12] total 3 | conflito 1 | lacuna 0 | override 1

  Semanal:
             Seg   Ter   Qua   Qui   Sex
    7074D    V1    R1    -     -     P1
    8080N    -     O1    A1    -     -

  Mensal:
    [12]
    R:1 A:0 O:1 V:1

  Drill-down do dia selecionado
    Resumo do dia: [VERMELHO] [1 conflito] [0 lacunas] [1 override]
    Ocorrencias:
      7074D  Juarez  sem substituto  [Substituir] [Override] [Remover]

[ Drawer contextual ]
  Substituir turma 7074D em 12/09 - turno noite
  Turno: noite
  Data: 12/09
  Turma: 7074D
  Titular: Juarez
  Substituto: [selecionar]
  Avisos preventivos:
    - Professor titular ja esta em conflito neste turno
    - Informe um substituto para concluir a acao
  [Salvar] [Abrir formulario completo]
```

## Open Questions

- Se a equipe quiser manter o redirecionamento completo como alternativa visivel, vale decidir depois se isso aparece como link secundario dentro do drawer ou apenas em casos de erro.
