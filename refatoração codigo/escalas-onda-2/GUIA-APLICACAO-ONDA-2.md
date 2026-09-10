# Guia de aplicacao - Onda 2 (infraestrutura) - projeto escalas

Esta pasta contem os arquivos da Onda 2 de melhorias do repositorio
**juarezbamberg-source/escalas**: Alembic (migracoes), CI com GitHub Actions,
ESLint + Prettier e cobertura de testes (pytest-cov).

Os nomes usam hifen no lugar de barra para indicar o caminho de destino.
Exemplo: `alembic-env.py` corresponde a `alembic/env.py`.

---

## 1. Mapa de destino

| Arquivo nesta pasta | Caminho no repositorio | Acao |
|---|---|---|
| alembic-ini | alembic.ini | NOVO |
| alembic-env.py | alembic/env.py | NOVO |
| alembic-script.py.mako | alembic/script.py.mako | NOVO |
| alembic-versions-0001_initial.py | alembic/versions/0001_initial.py | NOVO |
| app-main.py | app/main.py | SUBSTITUIR |
| github-workflows-ci.yml | .github/workflows/ci.yml | NOVO |
| frontend-eslint.config.js | frontend/eslint.config.js | NOVO |
| frontend-.prettierrc.json | frontend/.prettierrc.json | NOVO |
| frontend-package.json | frontend/package.json | SUBSTITUIR |
| pyproject.toml | pyproject.toml | SUBSTITUIR |

---

## 2. Alembic - migracoes de banco

**Problema que resolve.** Hoje o app usa `Base.metadata.create_all(bind=engine)`
no lifespan (app/main.py). Isso cria as tabelas se nao existirem, mas NAO evolui
o schema: qualquer mudanca de coluna exige apagar o banco (perda de dados).
Para um sistema que substitui planilhas reais, isso e risco alto.

**O que foi feito.**
- `alembic.ini`, `alembic/env.py`, `alembic/script.py.mako`: estrutura padrao
  do Alembic. O env.py le o URL do banco de `app.core.config.get_settings()`,
  ou seja, respeita o mesmo `.env` do FastAPI (variavel DATABASE_URL).
- `alembic/versions/0001_initial.py`: migracao inicial criando as 4 tabelas
  com as mesmas constraints dos modelos: UNIQUE de nome/codigo, CHECK titular
  != substituto, FKs com ondelete RESTRICT e o indice unico parcial forcada = 0.
- `app-main.py`: versao nova de app/main.py SEM o create_all no lifespan.

**Comandos.**

    .\.venv\Scripts\python.exe -m pip install -e .[dev]
    .\.venv\Scripts\python.exe -m alembic upgrade head

Para as proximas mudancas de modelo (ex.: nova coluna):

    .\.venv\Scripts\python.exe -m alembic revision --autogenerate -m "descricao"
    .\.venv\Scripts\python.exe -m alembic upgrade head

**Nota SQLite.** O env.py usa `render_as_batch=True`, necessario para o SQLite
suportar ALTER TABLE em migracoes futuras. Nao remova essa opcao.

**Nota sobre testes.** O tests/conftest.py continua criando as tabelas em
memoria com create_all - correto para os testes. O Alembic e para o banco de
desenvolvimento/producao.

---

## 3. CI - GitHub Actions

`github-workflows-ci.yml` (caminho real: `.github/workflows/ci.yml`) roda em
todo push para main e em todo pull request:

- Job backend: Python 3.12, `pip install -e ".[dev]"`, roda `pytest` (com cov).
- Job frontend: Node 22, `npm ci`, roda `npm run lint`, `npm run build` e
  `npm run test -- --run`.

Depois do push, o GitHub executa o workflow. Acompanhe na aba Actions.

---

## 4. ESLint + Prettier

**eslint.config.js** (flat config do ESLint 9): regras recomendadas do JS e
TypeScript (typescript-eslint), regras do React Hooks
(rules-of-hooks = error, exhaustive-deps = warn) e ignores para dist/coverage.

**frontend/.prettierrc.json**: 2 espacos, aspas duplas, printWidth 100,
trailingComma all - alinhado ao estilo atual do codigo.

**frontend-package.json**: adiciona scripts (lint, lint:fix, format,
format:check) e as dependencias novas (eslint, typescript-eslint, prettier,
@eslint/js, eslint-plugin-react-hooks, globals).

Comandos:

    cd frontend
    npm install
    npm run format
    npm run lint

Crie tambem `frontend/.prettierignore` com:

    dist
    coverage
    node_modules
    package-lock.json

---

## 5. Cobertura de testes (pytest-cov)

**pyproject.toml** atualizado:
- dev = ["alembic", "httpx", "pytest", "pytest-cov"]
- addopts = "--cov=app --cov-report=term-missing --cov-fail-under=70"

Isso faz o pytest mostrar a cobertura por arquivo e falhar se ficar abaixo de
70%. Ajuste o numero se a suite atual ainda nao alcancar - e referencia.
Caminhos para subir depois: testes unitarios dos servicos
(criar_alocacoes_recorrentes, calculo de carga), dividir
tests/test_escalas_api.py por dominio e mover helpers para fixtures.

---

## 6. Ordem de aplicacao recomendada

1. Backend: substitua app/main.py e pyproject.toml; crie a pasta alembic/.
2. Instale e migre:
       .\.venv\Scripts\python.exe -m pip install -e .[dev]
       .\.venv\Scripts\python.exe -m alembic upgrade head
       .\.venv\Scripts\python.exe -m pytest
3. Frontend: substitua frontend/package.json; crie eslint.config.js e
   .prettierrc.json; rode npm install, npm run format, npm run lint,
   npm run test -- --run e npm run build.
4. CI: crie a pasta .github/workflows/ e coloque o ci.yml. Push e confira
   a aba Actions.

---

## 7. Riscos e rollback

- Se ja existir escalas.db criado pelo create_all, a migracao 0001 pode falhar
  com "table already exists". Solucao para dev: apague o banco local e rode
  alembic upgrade head de novo (os dados de producao ainda nao existem).
- Se o --cov-fail-under=70 quebrar o pytest, reduza o valor no pyproject.toml.
- Rollback: os arquivos originais continuam no historico do git.

---

## 8. Proximas ondas

Onda 3 - Refatoracao do frontend
- Quebrar EscalaPage.tsx (75 KB) em hooks e componentes.
- Quebrar CadastrosPage.tsx (35 KB) em formularios por entidade.
- Extrair helpers duplicados (readErrorMessage, buildRecentAllocation).
- Endpoint dedicado de carga por professor (hoje o dashboard agrega no cliente).

Onda 4 - Evolucao
- Regras configuraveis: horas por alocacao, limite anual, feriados moveis.
- PATCH para edicao de professores, turmas, UCs e alocacoes.
- Postgres para uso multiusuario.
- Autenticacao.

---

Gerado a partir da revisao de arquitetura, frontend e testes do repositorio.
