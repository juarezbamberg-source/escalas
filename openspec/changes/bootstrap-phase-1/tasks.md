## 1. Estrutura do projeto

- [x] 1.1 Criar a estrutura inicial do backend FastAPI com organizacao por `api`, `schemas`, `models`, `services` e `db`.
- [x] 1.2 Configurar dependencias base para FastAPI, SQLAlchemy, Pydantic e driver de banco.
- [x] 1.3 Adicionar configuracao de ambiente para SQLite local e PostgreSQL alvo.

## 2. Modelo relacional

- [x] 2.1 Implementar entidades de professores, UCs, turmas e alocacoes.
- [x] 2.2 Aplicar chaves estrangeiras e restricoes basicas de integridade.
- [x] 2.3 Garantir protecao contra exclusao fisica de registros ainda em uso.

## 3. Regras de negocio da escala

- [x] 3.1 Implementar validacao de allowlist para turno.
- [x] 3.2 Bloquear duplicidade de alocacao por turma, data e turno com a mensagem definida.
- [x] 3.3 Bloquear conflito de professor no mesmo turno e data com a mensagem definida.
- [x] 3.4 Bloquear professor titular igual ao substituto com a mensagem definida.
- [x] 3.5 Implementar fluxo de override com justificativa minima de 10 caracteres e `forcada = true`.
- [x] 3.6 Implementar bloqueio de carga horaria anual para professores PF.

## 4. API e visualizacao

- [x] 4.1 Expor CRUD basico para professores, UCs e turmas.
- [x] 4.2 Expor criacao, listagem por turno e exclusao confirmada de alocacoes.
- [x] 4.3 Retornar a grade da escala ordenada por data com titular e substituto.
- [x] 4.4 Implementar calculo de `status_visual` para o calendario.

## 5. Qualidade

- [x] 5.1 Criar testes automatizados para CA-01 a CA-09.
- [x] 5.2 Criar testes para o semaforo visual do calendario em verde, vermelho, amarelo e roxo.
- [x] 5.3 Documentar como executar a API e a suite de testes localmente.
