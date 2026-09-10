# Guia de aplicacao - Onda 1 (projeto escalas)

Esta pasta contem os arquivos corrigidos da Onda 1 de melhorias do repositorio
**juarezbamberg-source/escalas**. Como o GitHub nao esta conectado a esta conversa,
os arquivos ficam no Google Drive para download e commit manual.

Os nomes usam hifen no lugar de barra para indicar o caminho de destino.
Exemplo: `frontend-src-lib-format.ts` corresponde a `frontend/src/lib/format.ts`.

---

## 1. Mapa de destino

| Arquivo nesta pasta | Caminho no repositorio | Acao |
|---|---|---|
| frontend-src-lib-format.ts | frontend/src/lib/format.ts | SUBSTITUIR |
| frontend-src-types-api.ts | frontend/src/types/api.ts | SUBSTITUIR |
| frontend-src-lib-format.test.ts | frontend/src/lib/format.test.ts | NOVO |
| frontend-src-lib-escalaSignals.test.ts | frontend/src/lib/escalaSignals.test.ts | NOVO |
| app-schemas-alocacao.py | app/schemas/alocacao.py | SUBSTITUIR |
| app-schemas-turma.py | app/schemas/turma.py | SUBSTITUIR |
| frontend-vite.config.ts | frontend/vite.config.ts | SUBSTITUIR |

---

## 2. Correcao 1 - bug de timezone em format.ts

**Problema.** As funcoes `buildFallbackDates` e `buildDateRangeFromBounds` usavam
`toISOString().slice(0, 10)`. O `toISOString` converte para UTC. No fuso do Brasil
(UTC-3), meia-noite local vira o dia anterior em UTC:

    2026-09-01T00:00 (local, UTC-3)  ->  2026-08-31T21:00Z  ->  "2026-08-31"

Resultado pratico: o calendario exibia **um dia a menos** nas datas geradas.
O bug aparecia tambem na virada de mes, porque 31/01 local virava 30/01 em UTC.

**Correcao.** Nova funcao `toIsoDate(date)` que monta a string a partir de
`getFullYear()`, `getMonth()` e `getDate()` - todos em horario local, sem conversao
UTC. Tambem foi criada a funcao interna `parseIsoDate` para leitura segura de
datas no formato ISO, evitando o comportamento do construtor `new Date("yyyy-mm-dd")`,
que tambem interpreta como UTC.

**Impacto.** O calendario passa a exibir as datas corretas em qualquer fuso.

---

## 3. Correcao 2 - tipagem de turno

**Frontend (`frontend/src/types/api.ts`).** Os campos `turno` e `turno_padrao`
estavam tipados como `string`, mesmo existindo o tipo
`Turno = "manha" | "tarde" | "noite"`. Foram alterados para `Turno` nos tipos
`Turma`, `Alocacao`, `CalendarioItem`, `AlocacaoBulkCreateItem`,
`AlocacaoBulkDeleteItem` e `AlocacaoTurmaPeriodoItem`.

Efeito: o TypeScript passa a acusar erro de compilacao para valores invalidos
como `"MANHA"` ou `"manha "`, em vez de deixar o erro chegar ao backend em runtime.

**Backend (`app/schemas/alocacao.py` e `app/schemas/turma.py`).** Os campos
`turno` e `turno_padrao` estavam como `str`. Agora usam o enum `Turno`:

- `TurmaCreate.turno_padrao: Turno`
- `AlocacaoCreate.turno: Turno`
- `AlocacaoBulkCreateRequest.turnos: list[Turno]`

Efeito: a validacao acontece na borda. O FastAPI retorna **422** automaticamente
para valor invalido, antes de chegar a regra de negocio, e o Swagger passa a listar
os valores permitidos no enum. As funcoes `validar_turno` nos servicos continuam
funcionando como segunda camada de defesa.

**Nao ha quebra de contrato.** Como `Turno` herda de `str` (`class Turno(str, Enum)`),
o JSON continua identico - o frontend segue enviando `"manha"`, `"tarde"` ou `"noite"`.

Observacao: os schemas de **resposta** (`AlocacaoRead`, `CalendarioItem`,
`AlocacaoTurmaPeriodoItem`, `AlocacaoBulkCreateItem`, `AlocacaoBulkDeleteItem`)
foram mantidos com `turno: str` de proposito, porque os servicos preenchem esses
campos com `alocacao.turno.value`, que ja e string. Mudar a tipagem ali nao traz
ganho e aumenta o risco sem necessidade.

---

## 4. Testes novos

**`frontend/src/lib/format.test.ts`**
- `formatDate` converte ISO para dd/mm/aaaa.
- `toIsoDate` serializa data local sem deslocamento de fuso.
- `buildDateRangeFromBounds` gera intervalo inclusivo.
- Caso de regressao: intervalo de 31/01 a 02/02 deve devolver exatamente os tres dias.
- Intervalo invalido devolve lista vazia.
- `buildFallbackDates` devolve 5 datas.

**`frontend/src/lib/escalaSignals.test.ts`**
- Semáforo: rotulos `Padrao`, `Conflito`, `Lacuna`, `Sem substituto`,
  `Substituicao` e `Override`.
- Justificativa de override aparece nos motivos.
- Resumo com multiplos motivos usa o formato `+N motivo(s)`.
- `buildPrimaryActionReason` prioriza: sem titular > conflito sem cobertura > override.

Como rodar:

    cd frontend
    npm run test -- --run

---

## 5. Limpeza da configuracao do Vite

O repositorio tem **tres** arquivos de configuracao do Vite na pasta `frontend/`:

- `vite.config.ts`  (fonte, correto)
- `vite.config.js`  (sobra de compilacao, versionada por engano)
- `vite.config.d.ts` (sobra de compilacao, versionada por engano)

O `vite.config.js` e o `vite.config.d.ts` devem sair do repositorio. O
`frontend-vite.config.ts` desta pasta e a versao consolidada e tambem corrige a
regex do proxy (`path.replace(/^\/api/, "")` - na versao atual a barra nao esta
escapada).

Comandos:

    git rm frontend/vite.config.js frontend/vite.config.d.ts

Adicione ao `.gitignore` dentro de `frontend/`:

    vite.config.js
    vite.config.d.ts

---

## 6. Como aplicar

1. Baixe os arquivos desta pasta do Drive.
2. Renomeie e mova para os caminhos da tabela do item 1.
3. Remova `frontend/vite.config.js` e `frontend/vite.config.d.ts`.
4. Rode os testes do frontend:

       cd frontend
       npm run test -- --run

5. Rode o build para validar a tipagem nova:

       npm run build

6. Rode a suite do backend:

       .\.venv\Scripts\python.exe -m pytest

7. Commit.

**Ordem recomendada:** aplique primeiro os schemas do backend e rode o pytest;
depois o frontend e rode vitest e o build. Assim, se algo quebrar, fica claro em
qual camada esta o problema.

---

## 7. Riscos e rollback

- A mudanca de tipagem no frontend pode acusar erro em algum ponto que montava
turno como `string` generica. Se ocorrer, o proprio `tsc` aponta a linha exata.
- Se o pytest falhar apos a troca para enum, verifique se `app/models/enums.py`
  ja define `Turno(str, Enum)` - ele ja define, entao a importacao nos schemas
ao cria ciclo.
- Rollback: os arquivos originais continuam disponiveis no historico do Git.

---

## 8. Proximas ondas

**Onda 2 - Infraestrutura**
- Alembic para migracoes (hoje o `lifespan` usa `Base.metadata.create_all`, que
  nao evolui schema e arrisca dados).
- CI com GitHub Actions rodando `pytest` e `vitest` em push/pull request.
- ESLint e Prettier no frontend.
- `pytest-cov` com cobertura minima.

**Onda 3 - Refatoracao do frontend**
- Quebrar `EscalaPage.tsx` (75 KB) em hooks e componentes.
- Quebrar `CadastrosPage.tsx` (35 KB) em formularios por entidade.
- Extrair `readErrorMessage` e helpers duplicados entre paginas para `lib/`.
- Endpoint dedicado de carga por professor (hoje o dashboard agrega no cliente).

**Onda 4 - Evolucao**
- Regras configuraveis: horas por alocacao, limite anual, feriados moveis.
- PATCH para edicao de professores, turmas, UCs e alocacoes.
- Avaliacao de Postgres para uso multiusuario.
- Autenticacao.

---

Gerado a partir da revisao de arquitetura, frontend e testes do repositorio.
