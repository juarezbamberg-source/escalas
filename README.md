# WebSiteEscalas

Sistema de escala de professores para operacao academica, com foco em consulta rapida por turno, alocacao assistida, cadastro recorrente e visao gerencial de carga horaria.

## Visao geral

O projeto substitui controles dispersos em planilhas por um fluxo unico de operacao:

- consulta de escala por turno com filtros avancados
- semaforo visual para conflitos, lacunas, substituicoes e overrides
- agrupamento por UC e turma para reduzir ruido na grade
- cadastro unitario e recorrente de alocacoes
- consulta por turma e periodo
- dashboard inicial com total de horas por professor

## Principais funcionalidades

### Escala por turno

- filtros por periodo, turma, professor e status
- chips com combinacao visivel dos filtros ativos
- atalhos de triagem recorrente
- leitura em agenda, semanal e mensal
- destaque de sabados e domingos
- liberacao explicita de fim de semana para atividade extracurricular
- acoes contextuais para alocar, substituir, justificar override e remover

### Cadastros e lancamentos

- cadastro de professores, UCs e turmas
- alocacao manual com validacoes de conflito
- lancamento recorrente por intervalo, turno e dia da semana
- preview do lote antes de confirmar gravacao
- bloqueio de feriados nacionais
- controle de carga anual para professores PF

### Dashboard

- consolidacao de horas por professor
- leitura comparativa por barras
- distribuicao por manha, tarde e noite

## Stack

- Backend: FastAPI, SQLAlchemy, Pydantic
- Frontend: React, TypeScript, Vite
- Planejamento funcional: OpenSpec
- Banco local atual: SQLite

## Como rodar

### Backend

```bash
.\.venv\Scripts\python.exe -m pip install -e .[dev]
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

API local: `http://127.0.0.1:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend local: `http://127.0.0.1:5173`

## Testes

### Backend

```bash
.\.venv\Scripts\python.exe -m pytest
```

### Frontend

```bash
cd frontend
npm run test -- --run
npm run build
```

### Infraestrutura e qualidade (Onda 2)

A Onda 2 está integrada à `main` e é validada pelo workflow `.github/workflows/ci.yml`.

#### Banco e migrações

```bash
python -m pip install -e ".[dev]"
python -m alembic upgrade head
python -m alembic current
```

O banco local usa SQLite por padrão (`DATABASE_URL` em `.env`). O schema de desenvolvimento/produção deve ser alterado por migrações Alembic; o `create_all` não é executado no lifespan da API.

#### Qualidade e testes

```bash
# backend, na raiz
python -m pytest

# frontend
cd frontend
npm install
npm run lint
npm run test -- --run
npm run build
```

A meta de cobertura backend é 70% (`pytest-cov`); a validação pós-merge da Onda 2 atingiu 92,67%. O CI executa backend e frontend em todo pull request e push para `main`. Warnings de `react-hooks/exhaustive-deps` não bloqueiam o lint; devem ser tratados durante a refatoração da Onda 3.

### Onda 3 — etapa entregue

A primeira etapa da Onda 3 foi integrada à `main` e está documentada em `openspec/changes/refactor-onda-3/verification.md`.

#### Entregue

- `GET /professores/carga`, com agregação de titular e substituto no backend;
- dashboard consumindo o endpoint dedicado;
- helpers compartilhados de erro e contexto de ação;
- testes de backend e frontend atualizados;
- correção de seletores ambíguos no drill-down;
- CI verde após o merge.

#### Validação

- Backend: 26/26 testes, cobertura 93,09%;
- Frontend: 40/40 testes e build aprovado;
- ESLint: 0 erros e 6 warnings não bloqueantes;
- Alembic: 0002 (head).

A decomposição estrutural completa de `EscalaPage.tsx` e `CadastrosPage.tsx` permanece pendente e não deve ser considerada entregue nesta etapa. As tarefas continuam em `openspec/changes/refactor-onda-3/tasks.md`.


- `app/`: API, modelos, schemas e regras de negocio
- `frontend/`: SPA operacional
- `tests/`: testes do backend
- `openspec/`: propostas, design e historico das mudancas

## Endpoints atuais

- `GET /health`
- `GET/POST/DELETE /professores`
- `GET/POST/DELETE /ucs`
- `GET/POST/DELETE /turmas`
- `GET/POST/DELETE /alocacoes`
- `GET /professores/carga`
- `GET /alocacoes/calendario`
- `GET /alocacoes/turma-periodo`
- `POST /alocacoes/remocao-lote`
- `POST /alocacoes/recorrente`

## Roadmap proximo

- novos graficos operacionais no dashboard
- importacao assistida de planilhas Excel
- refinamento de indicadores de carga por UC e turma
