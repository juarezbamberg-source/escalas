## Why

O backend da fase 1 ja esta funcional, mas ainda nao existe uma interface para operar a escala no navegador de forma orientada ao fluxo do SENAC-RS. Iniciar o frontend agora permite validar a experiencia por turno, reduzir o uso direto da documentacao Swagger e preparar a base visual para o uso da coordenacao.

## What Changes

- Criar um frontend React com Vite e TypeScript no mesmo repositorio.
- Entregar um shell inicial com cabecalho, navegacao e layout principal responsivo.
- Implementar uma visao da escala por turno com consumo de `GET /alocacoes` e `GET /alocacoes/calendario`.
- Implementar formularios iniciais para cadastrar professores, UCs, turmas e alocacoes.
- Exibir estados de carregamento, vazio e erro para as chamadas principais da API.
- Apresentar o semaforo visual do calendario com legenda e cores coerentes com o backend.

## Capabilities

### New Capabilities
- `frontend-shell`: cobre a estrutura base do SPA, navegacao, layout responsivo e configuracao de integracao com a API.
- `frontend-consulta-escala`: cobre filtros por turno, grade cronologica da escala e calendario com semaforo visual.
- `frontend-cadastros-e-alocacoes`: cobre formularios iniciais para CRUD basico e criacao de alocacoes com exibicao de mensagens de erro da API.

### Modified Capabilities
- Nenhuma.

## Impact

- Novo app frontend em React + Vite + TypeScript.
- Novas dependencias Node para build e desenvolvimento do SPA.
- Consumo direto dos endpoints FastAPI ja existentes.
- Atualizacao da documentacao de execucao local para subir backend e frontend juntos.
