## Why

Com o crescimento da base de alocacoes, a grade de `Escala por turno` tende a ficar longa demais para leitura continua. Ao mesmo tempo, o calendario ainda nao diferencia visualmente sabados e domingos, o que dificulta reconhecer rapidamente fins de semana no recorte.

## What Changes

- Agrupar a grade da escala por UC e turma, com controle de expandir e recolher para reduzir o tamanho visual inicial da listagem.
- Exibir um resumo por grupo antes da expansao, permitindo identificar rapidamente quantas ocorrencias existem em cada UC/turma.
- Manter o acesso as linhas detalhadas e as acoes operacionais dentro do grupo expandido, sem perder os sinais atuais.
- Destacar sabados e domingos com tratamento visual amarelo no calendario, preservando a leitura dos estados operacionais dentro das celulas.
- Bloquear criacao de alocacoes em sabados, domingos e feriados nacionais, tratando essas datas como nao letivas.
- Atualizar a documentacao funcional da tela de escala para refletir a leitura agrupada e o destaque de fim de semana.

## Capabilities

### New Capabilities
- `escala-collapsible-grade-groups`: cobre o agrupamento da grade por UC e turma com expansao e recolhimento sob demanda.

### Modified Capabilities
- `escala-ux-polish-calendar`: amplia o calendario para diferenciar visualmente sabados e domingos no recorte.

## Impact

- Frontend React em `frontend/src/pages/EscalaPage.tsx` e possiveis componentes auxiliares para agrupamento e resumo da grade.
- Tipos e cliente HTTP do frontend se a grade precisar receber metadados adicionais de UC.
- Backend FastAPI, schemas e servicos para devolver identificacao da UC para agrupamento confiavel e bloquear datas nao letivas.
- Estilos em `frontend/src/styles/app.css`.
- Testes de interface e documentacao em `README.md`.
