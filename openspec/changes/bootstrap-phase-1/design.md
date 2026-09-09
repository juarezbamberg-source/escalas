# Design: base tecnica da fase 1

## Visao geral
A fase 1 sera implementada como uma API REST em FastAPI com separacao simples entre camadas:

- `app/api`: rotas e contratos HTTP.
- `app/schemas`: modelos Pydantic de entrada e saida.
- `app/models`: entidades SQLAlchemy.
- `app/services`: regras de negocio e validacoes de alocacao.
- `app/db`: sessao, engine e migracoes futuras.

Essa separacao permite validar regras de dominio fora das rotas e facilita testar conflitos sem depender da interface.

## Modelo de dados inicial

### Professor
- `id`
- `nome`
- `contratacao` com allowlist `PF`, `CLT`, `PJ`

### UnidadeCurricular
- `id`
- `codigo`
- `nome`
- `carga_horaria`

### Turma
- `id`
- `codigo`
- `nome`
- `turno_padrao`
- `uc_id`

### Alocacao
- `id`
- `turma_id`
- `data`
- `turno`
- `professor_titular_id`
- `professor_substituto_id` opcional
- `forcada` boolean
- `justificativa_override` opcional

## Restricoes e validacoes
- `turno` aceita apenas `manha`, `tarde` e `noite`.
- Deve existir no maximo uma alocacao por `turma_id + data + turno` quando o fluxo nao usar override.
- O mesmo professor nao pode aparecer em duas turmas na mesma `data + turno` sem override.
- `professor_titular_id` deve ser diferente de `professor_substituto_id`.
- Override so e aceito com justificativa de 10 ou mais caracteres; nesse caso o registro grava `forcada = true`.
- Professores PF nao podem ultrapassar 300 horas anuais somadas a partir das UCs associadas as turmas das alocacoes.

## Estrategia de integridade
As restricoes simples ficam no banco e as regras contextuais ficam na camada de servico:

- Banco:
  - chaves estrangeiras para integridade referencial
  - `CHECK` para enums textuais simples
  - protecao de exclusao de entidades ainda referenciadas
- Servico:
  - deteccao de conflitos com mensagens exatas do PRD
  - validacao do limite anual de carga para PF
  - calculo do estado visual do calendario

## Contratos de API iniciais
- `GET /health`
- `GET /professores`
- `POST /professores`
- `GET /ucs`
- `POST /ucs`
- `GET /turmas`
- `POST /turmas`
- `GET /alocacoes?turno=manha`
- `POST /alocacoes`
- `DELETE /alocacoes/{id}`

## Semaforo do calendario
O endpoint de visualizacao deve retornar cada item com um `status_visual`:

- `verde`: turma com exatamente um professor e sem conflito
- `vermelho`: professor em duas turmas no mesmo horario
- `amarelo`: turma sem professor em dia letivo
- `roxo`: titular e substituto validos na mesma turma e horario

## Persistencia e ambiente
- Desenvolvimento local: SQLite compativel para acelerar bootstrap.
- Alvo principal: PostgreSQL, mantendo tipos e consultas simples para nao criar divergencias cedo.
- Migracoes podem iniciar com Alembic quando a estrutura base da API estiver pronta.

## Testes
- Testes unitarios para servicos de validacao de alocacao e carga horaria.
- Testes de API para mensagens de erro definidas nos criterios de aceite.
- Testes de integridade para exclusao bloqueada e consulta por turno ordenada por data.
