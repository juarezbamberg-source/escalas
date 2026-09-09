## 1. Filtros Avancados

- [x] 1.1 Reestruturar a tela `EscalaPage` para incluir uma barra de filtros em blocos de contexto, status operacional e busca direta, e verificar visualmente que a pagina continua responsiva
- [x] 1.2 Adicionar filtros por turno, intervalo de datas, turma, professor titular, professor substituto e texto livre, e verificar que a grade responde ao recorte combinado
- [x] 1.3 Adicionar chips rapidos como `Hoje`, `Esta semana`, `Com conflito`, `Sem substituto` e `Overrides`, e verificar que o clique atualiza os resultados
- [x] 1.4 Exibir um resumo dos filtros ativos, como `Turno: noite + Status: conflito + Professor: Juarez`, e verificar que o usuario consegue limpar criterios individualmente
- [x] 1.5 Permitir que a legenda/cores do semaforo atuem como filtro clicavel e verificar o recorte por `VERMELHO`, `AMARELO`, `ROXO` e `VERDE`

## 2. Grade Operacional

- [x] 2.1 Sintetizar a grade para reduzir repeticao e destacar conflito, override, substituicao e lacuna operacional, e verificar leitura rapida por linha
- [x] 2.2 Adicionar estados vazios mais especificos para combinacoes de filtro sem resultado e verificar que a pagina informa claramente o recorte sem ocorrencias
- [x] 2.3 Garantir que filtros e grade permaneçam consistentes ao trocar de turno e ao recarregar os dados da API, e verificar com testes de interface

## 3. Calendario de Triagem

- [x] 3.1 Substituir a lista atual de cards repetidos por uma visao mais sintetica com agregacao por dia ou agrupamento claro, e verificar menor repeticao visual
- [x] 3.2 Adicionar drill-down basico ao clicar em um dia/bloco para listar as alocacoes daquele recorte, e verificar que a interacao nao exige sair da tela
- [x] 3.3 Preparar a fundacao para modos `mensal`, `semanal` e `agenda`, e verificar que a arquitetura da pagina suporta novos modos sem reescrita ampla

## 4. Insercao Operacional

- [x] 4.1 Mapear a primeira evolucao do formulario assistido de alocacao a partir do recorte ativo da tela, e verificar a coerencia com as regras atuais de negocio
- [x] 4.2 Planejar acoes contextuais a partir da grade ou calendario para `Alocar`, `Substituir`, `Remover` e `Justificar override`, e verificar clareza do fluxo proposto
- [x] 4.3 Especificar backlog futuro para importacao em lote e replicacao de escala, e verificar alinhamento com a operacao descrita no PRD

## 5. Qualidade

- [x] 5.1 Adicionar testes de interface para combinacao de filtros, chips e resumo de criterios ativos, e verificar execucao com `npm run test -- --run`
- [x] 5.2 Adicionar testes para filtros por status do semaforo e estados vazios/erro, e verificar cobertura dos cenarios principais
- [x] 5.3 Atualizar a documentacao da tela de escala e do roadmap de evolucao, e verificar que a proxima iteracao de implementacao esta clara para a equipe
