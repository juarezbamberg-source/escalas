## Why

O fluxo atual de `Escala por turno` ajuda na triagem operacional geral, mas ainda nao atende bem quando a pergunta e objetiva: "quem deu aula para esta turma neste periodo?". A operacao precisa de uma consulta dedicada por turma e intervalo de datas, com resposta explicita inclusive quando nao houver professor alocado em um dia/turno esperado.

## What Changes

- Adicionar na tela `Escala por turno` uma acao clara de `Consultar professor da turma`, abrindo um recorte orientado por turma e periodo.
- Permitir filtrar por turma obrigatoria, data inicial, data final, turno opcional e exibicao opcional de substituicoes.
- Exibir uma tabela de resultado com `data`, `turno`, `turma`, `professor titular`, `substituto` e `situacao`, deixando explicito quando nao houver professor definido.
- Gerar retorno consistente para datas do periodo mesmo quando nao existir alocacao salva, preservando a leitura de lacunas da turma consultada.
- Atualizar a documentacao funcional da workbench para incluir a nova consulta dirigida por turma.

## Capabilities

### New Capabilities
- `escala-turma-periodo-query`: cobre a consulta dirigida por turma e intervalo de datas, com tabela explicita de professores e lacunas por dia/turno.

### Modified Capabilities
- `escala-ux-polish-filters`: amplia a workbench para oferecer uma entrada de consulta por turma e periodo sem perder o eixo operacional da tela por turno.

## Impact

- Frontend React em `frontend/src/pages/EscalaPage.tsx` e possiveis componentes auxiliares para formulario de consulta e tabela de resultados.
- Estilos da workbench em `frontend/src/styles/app.css`.
- Cliente HTTP em `frontend/src/lib/api.ts` e tipos em `frontend/src/types/api.ts`.
- Backend FastAPI em rotas, schemas, servicos e testes de alocacoes caso seja necessario um endpoint dedicado para devolver lacunas explicitas por turma e periodo.
- README e especificacoes OpenSpec da experiencia de consulta.
