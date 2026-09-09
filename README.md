# WebSiteEscalas

Escalas de servico para a operacao de professores do SENAC-RS, com backend FastAPI, frontend React e planejamento apoiado por OpenSpec.

## OpenSpec

O projeto usa `openspec/` como fonte de planejamento. A primeira mudanca ativa esta em `openspec/changes/bootstrap-phase-1`.

## Backend

Estrutura inicial:

- `app/main.py`: entrada da API FastAPI
- `app/api/`: rotas HTTP
- `app/models/`: entidades SQLAlchemy
- `app/schemas/`: contratos Pydantic
- `app/services/`: regras de negocio
- `app/db/`: engine e sessao

## Comandos esperados

Depois de criar a virtualenv e instalar as dependencias:

```bash
.\.venv\Scripts\python.exe -m pip install -e .[dev]
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
.\.venv\Scripts\python.exe -m pytest
```

## Frontend

O SPA React fica em `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

O frontend sobe em `http://127.0.0.1:5173` e usa proxy local para falar com a API FastAPI em `http://127.0.0.1:8000`.

### Escala por turno

A tela `Escala por turno` funciona como uma workbench operacional:

- filtros avancados em blocos visuais por contexto, status operacional e busca direta
- atalhos de triagem recorrente como `Conflitos de hoje`, `Lacunas de cobertura` e `Overrides da semana`
- presets do operador salvos no navegador para restaurar turno, filtros e modo de leitura
- consulta por turma e periodo com botao `Consultar professor da turma`
- combinacao visivel dos filtros ativos com limpeza individual
- semaforo clicavel para recortar `VERDE`, `VERMELHO`, `AMARELO` e `ROXO`
- badges consistentes entre grade, resumo do periodo e drill-down
- explicacao local dos sinais com motivos operacionais no ponto de uso
- coluna de professores separada por papel entre titular e substituto
- grade agrupada por UC e turma, com expansao sob demanda para reduzir o comprimento visual
- calendario com abas destacadas nos modos `agenda`, `semanal` e `mensal`
- sabados e domingos destacados visualmente no calendario e na grade
- liberacao explicita de fim de semana para atividade extracurricular
- resumo consolidado do periodo com contadores de conflitos, lacunas, substituicoes e overrides
- modo semanal em matriz por turma e dia para leitura de padrao operacional
- modo mensal com mini-contadores por cor dentro de cada dia
- drill-down do dia selecionado com resumo primeiro e ocorrencias acionaveis logo abaixo
- drawer contextual para `Alocar`, `Substituir` e `Override`, com pre-preenchimento e validacoes preventivas
- hierarquia mais clara entre acao principal e acoes secundarias, com `Remover` em camada secundaria
- selecao multipla na grade com preview e confirmacao explicita antes da remocao em lote
- `Modo compacto` e retomada do recorte atual na mesma sessao do navegador
- atalho secundario para abrir o formulario completo preservando o contexto pela URL

### Dashboard

- rota dedicada em `/dashboard`
- primeiro grafico com total de horas por professor
- consolidacao de 3 horas por alocacao, somando manha, tarde e noite

## Subindo tudo localmente

Em um terminal:

```bash
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Em outro terminal:

```bash
cd frontend
npm run dev
```

## Endpoints iniciais

- `GET /health`
- `GET/POST/DELETE /professores`
- `GET/POST/DELETE /ucs`
- `GET/POST/DELETE /turmas`
- `GET/POST/DELETE /alocacoes`
- `GET /alocacoes/calendario`
- `GET /alocacoes/turma-periodo`
- `POST /alocacoes/remocao-lote`
- `POST /alocacoes/recorrente`

### Cadastros e lancamento recorrente

A tela `Cadastros e Alocacoes` suporta dois modos de entrada:

- cadastro unitario de alocacao para ajustes pontuais
- cadastro recorrente em lote por turma, professor, intervalo de datas, dias da semana e turnos

No fluxo recorrente, o operador pode:

- validar um preview antes de gravar
- ver quantos itens ficaram validos e quantos foram bloqueados
- identificar conflitos e duplicidades antes da confirmacao final
- confirmar apenas depois de revisar o cronograma gerado
- contar 3 horas de carga por alocacao gravada no limite anual de professores PF
- bloquear feriados nacionais
- bloquear sabados e domingos por padrao, com liberacao explicita apenas para atividade extracurricular
