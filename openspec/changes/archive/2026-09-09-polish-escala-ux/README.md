# polish-escala-ux

Refinar a workbench de escala com hierarquia visual melhor, modos de calendario mais legiveis e insercao contextual menos abrupta.

## Entregas aplicadas

- barra de filtros avancados com agrupamento mais legivel, chips e combinacao visivel do recorte
- badges visuais consistentes entre grade, calendario e drill-down
- calendario com abas destacadas para `Agenda`, `Semanal` e `Mensal`
- resumo do periodo antes do calendario detalhado
- modo semanal em matriz por turma e dia
- modo mensal com mini-contadores por cor em cada dia
- drawer contextual para `Alocar`, `Substituir` e `Justificar override`
- pre-preenchimento de `turno`, `data`, `turma` e `titular` no fluxo contextual
- avisos preventivos antes do submit e fallback para o formulario completo

## Wireframe resumido

```text
[ Escala por turno ]
  [Manha] [Tarde] [Noite]

[ Filtros avancados ]
  Contexto            Status operacional         Busca direta
  [de ____ ate ____]  [Conflito] [Lacuna]        [Titular v]
  [Turma v]           [Sem substituto]           [Substituto v]
                      [Override] [Padrao]        [Busca livre________]
  Atalhos: [Hoje] [Esta semana] [Overrides]
  Recorte ativo: chips removiveis

[ Grade da escala ]
  Data | Turma | Professores | Sinais | Acao principal | Acoes secundarias

[ Calendario ]
  [Agenda] [Semanal] [Mensal]
  Resumo do periodo: [conflitos] [lacunas] [substituicoes] [overrides]
  Drill-down: resumo do dia -> ocorrencias acionaveis

[ Drawer contextual ]
  Campos pre-preenchidos
  Validacoes preventivas
  [Abrir formulario completo] [Salvar]
```
