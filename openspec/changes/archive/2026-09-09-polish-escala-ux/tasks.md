## 1. Hierarquia Visual

- [x] 1.1 Refinar espacamento, agrupamento e destaque dos filtros para melhorar leitura da workbench e verificar responsividade em desktop e mobile
- [x] 1.2 Unificar o tratamento visual de badges de conflito, lacuna, substituicao, override e padrao, e verificar consistencia entre grade, resumo e drill-down
- [x] 1.3 Reduzir a carga visual das acoes por linha, com hierarquia entre acao principal e secundaria, e verificar escaneabilidade na grade

## 2. Calendario

- [x] 2.1 Transformar `Agenda`, `Semanal` e `Mensal` em abas destacadas de navegacao do calendario e verificar alternancia visivel sem perder filtros ativos
- [x] 2.2 Adicionar cabecalho-resumo do periodo com contadores consolidados de conflito, lacuna, substituicao e override, e verificar atualizacao conforme o recorte
- [x] 2.3 Evoluir o modo mensal para mostrar mini-contadores por cor em cada dia e verificar leitura sintetica sem depender de texto corrido
- [x] 2.4 Evoluir o modo semanal para matriz por turma e dia, e verificar identificacao mais rapida de padrao operacional
- [x] 2.5 Reorganizar o drill-down do dia para exibir primeiro o resumo consolidado e depois a lista de ocorrencias, e verificar separacao clara entre diagnostico e acao

## 3. Insercao Contextual

- [x] 3.1 Implementar drawer ou modal lateral para `Alocar`, `Substituir` e `Justificar override`, e verificar que o usuario consegue agir sem sair da tela de escala
- [x] 3.2 Pre-preencher no fluxo contextual todos os campos ja conhecidos, como turno, data, turma e titular, e verificar coerencia com o item de origem
- [x] 3.3 Exibir validacoes preventivas de conflito, ausencia de substituto e exigencia de justificativa antes do submit, e verificar manutencao das mensagens finais da API
- [x] 3.4 Manter um caminho secundario para abrir o formulario completo quando o drawer nao bastar, e verificar preservacao do contexto nessa transicao

## 4. Qualidade

- [x] 4.1 Adicionar testes de interface para layout refinado, resumo do periodo e navegacao dos modos do calendario, e verificar com `npm run test -- --run`
- [x] 4.2 Adicionar testes para drawer contextual, pre-preenchimento e avisos preventivos, e verificar com `npm run test -- --run`
- [x] 4.3 Atualizar a documentacao funcional da tela de escala com o novo wireframe e o fluxo contextual assistido, e verificar clareza do roadmap para a proxima aplicacao
