# Guia de aplicacao - Onda 2 (projeto escalas)

Esta pasta contem os arquivos da Onda 2 de melhorias do repositorio
**juarezbamberg-source/escalas**: migracoes de banco (Alembic), CI com GitHub
Actions e lint/formatacao (ESLint + Prettier) + cobertura de testes (pytest-cov).

Os nomes usam hifen no lugar de barra para indicar o caminho de destino.
Exemplo: `alembic-env.py` corresponde a `alembic/env.py`.

---

## 1. Mapa de destino

| Arquivo nesta pasta | Caminho no repositorio | Acao |
|---|---|---|
| alembic.ini | alembic.ini | NOVO |
| alembic-env.py | alembic/env.py | NOVO |
| alembic-script.py.mako | alembic/script.py.mako | NOVO |
| alembic-versions-0001-inicial.py | alembic/versions/0001_inicial.py | NOVO |
| app-main.py | app/main.py | SUBSTITUIR |
| pyproject.toml | pyproject.toml | SUBSTITUIR |
| github-workflows-ci.yml | .github/workflows/ci.yml | NOVO |
| frontend-eslint.config.js | frontend/eslint.config.js | NOVO |
| frontend-prettierrc | frontend/.prettierrc | NOVO |
| frontend-prettierignore | frontend/.prettierignore | NOVO |
| frontend-package.json | frontend/package.json | SUBSTITUIR |

---

## 2. Alembic - migracoes de banco

**Por que.** Hoje o `lifespan` do FastAPI executa `Base.metadata.create_all()`.
Essa chamada so cria tabelas que nao existem - ela nao altera colunas, nao adiciona
indices e nao evolve o schema. Qualquer mudanca de modelo exige apagar o banco
local e recriar, o que perde dados. Alembic resolve isso com migracoes versionadas.

**O que foi criado.**
- `alembic.ini` - configuracao base (script_location = alembic).
- `alembic/env.py` - le a URL do banco de `app.core.config.get_settings()` e usa
  `Base.metadata` como alvo. Nao ha duplicacao de URL.
- `alembic/script.py.mako` - template de novas migracoes.
- `alembic/versions/0001_inicial.py` - migracao inicial que cria as tabelas
  `unidades_curriculares`, `professores`, `turmas` e `alocacoes`, com as mesmas
  constraints do modelo: FK com RESTRICT, CHECK de titular != substituto e o
  indice unico parcial `forcada = 0`. A coluna `forcada` ganhou `server_default=0`
  (o modelo so tinha default no ORM) para proteger inserts diretos via SQL.

**Passos para aplicar.**
1. Instale a dependencia (ja adicionada ao pyproject.toml):
   ```bash
   .\.venv\Scripts\python.exe -m pip install -e ".[dev]"
   ```
2. Substitua `app/main.py` pela versao desta pasta (remove o `create_all`).
3. Rode a migracao inicial:
   ```bash
   .\.venv\Scripts\python.exe -m alembic upgrade head
   ```
4. Confira que o banco foi criado:
   ```bash
   .\.venv\Scripts\python.exe -m alembic current
   ```

**Nota sobre o indice parcial.** O indice unico usa `sqlite_where=text("forcada = 0")`.
Se no futuro o projeto migrar para Postgres, a mesma migracao precisa de uma
variante com `postgresql_where=text("forcada = false")`. Registre isso como ADR.

**Fluxo para mudancas futuras de modelo.**
```bash
# 1. altere o modelo em app/models/*
# 2. gere a migracao
.\.venv\Scripts\python.exe -m alembic revision --autogenerate -m "descricao"
# 3. revise o arquivo gerado em alembic/versions/
# 4. aplique
.\.venv\Scripts\python.exe -m alembic upgrade head
```

---

## 3. CI com GitHub Actions

**O que foi criado.** `.github/workflows/ci.yml` com dois jobs independentes:

- **backend**: Python 3.12, instala `.[dev]` e roda `pytest` (com cobertura, ver item 5).
- **frontend**: Node 22, `npm ci`, `npm run build` (typecheck + build) e `npm run test -- --run`.

O workflow roda em todo push para `main` e em toda pull request. Nenhum merge
entra sem os testes passarem.

**Passos para aplicar.** Crie a pasta `.github/workflows/` e coloque o arquivo
`ci.yml`. Nada mais e necessario - o GitHub Actions detecta o workflow sozinho.

**Nota.** O job do frontend usa `npm ci`, que exige o `package-lock.json`
(ja existe no repositorio). Se o lock ficar desatualizado, rode `npm install`
localmente e commite o lock atualizado.

---

## 4. ESLint + Prettier

**O que foi criado.**
- `frontend/eslint.config.js` - configuracao flat (ESLint 9) com regras
  recomendadas do TypeScript e dos hooks do React.
- `frontend/.prettierrc` - padrao de formatacao (semi, aspas duplas, 100 cols).
- `frontend/.prettierignore` - ignora dist, coverage, node_modules e o lock.
- `frontend/package.json` - scripts novos: `lint`, `lint:fix`, `format`,
  `format:check`; e devDependencies novas: eslint, @eslint/js, typescript-eslint,
  eslint-plugin-react-hooks, eslint-plugin-react-refresh, prettier.

**Passos para aplicar.**
```bash
cd frontend
npm install
npm run lint
npm run format
```

**Nota.** O `npm run format` vai reescrever os arquivos com o padrao do Prettier.
Rode uma vez, revise o diff e commite. O `npm run lint` pode apontar erros
pre-existentes (ex.: `react-refresh/only-export-components` em arquivos que
exportam componentes e constantes juntos) - corrija ou ajuste a regra conforme
o caso.

---

## 5. Cobertura de testes (pytest-cov)

O `pyproject.toml` foi atualizado com:
- `pytest-cov` em `[project.optional-dependencies].dev`
- `addopts = "--cov=app --cov-report=term-missing --cov-fail-under=70"`

O limite inicial e 70% para nao quebrar o CI ja no primeiro commit. Depois de
rodar a suite e ver o relatorio, aumente o limite gradualmente (80% e um bom
objetivo).

---

## 6. Ordem recomendada de aplicacao

1. Backend: pyproject.toml + app/main.py + arquivos alembic -> `pip install -e ".[dev]"` -> `alembic upgrade head` -> `pytest`
2. Frontend: package.json + eslint + prettier -> `npm install` -> `npm run lint` -> `npm run format` -> `npm run test -- --run` -> `npm run build`
3. CI: criar `.github/workflows/ci.yml` e fazer push. O primeiro run valida tudo.

---

## 7. Riscos e rollback

- **Alembic**: se a migracao falhar no meio, rode `alembic downgrade base` para
  desfazer. O banco antigo pode ser recriado com `create_all` manualmente se
  necessario (ou restaurando o app/main.py anterior).
- **CI**: se um job falhar, o outro continua (jobs independentes). O log do
  GitHub Actions mostra exatamente qual etapa falhou.
- **Prettier**: o diff de formatacao pode ser grande na primeira execucao.
  Se preferir, rode `npx prettier --write <arquivo>` arquivo a arquivo.
- **Rollback geral**: todos os arquivos originais estao no historico do Git.

---

## 8. Proximas ondas

**Onda 3 - Refatoracao do frontend**
- Quebrar `EscalaPage.tsx` (75 KB) em hooks e componentes.
- Quebrar `CadastrosPage.tsx` (35 KB) em formularios por entidade.
- Extrair `readErrorMessage` e helpers duplicados para `lib/`.
- Endpoint dedicado de carga por professor (hoje o dashboard agrega no cliente).

**Onda 4 - Evolucao**
- Regras configuraveis: horas por alocacao, limite anual, feriados moveis.
- PATCH para edicao de professores, turmas, UCs e alocacoes.
- Avaliacao de Postgres para uso multiusuario (inclui variante do indice parcial).
- Autenticacao.

---

Gerado a partir da revisao de arquitetura, frontend e testes do repositorio.
