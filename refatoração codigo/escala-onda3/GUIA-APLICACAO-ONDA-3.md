# Guia de aplicacao - Onda 3 (refatoracao do frontend + endpoint de carga)

Esta pasta contem os arquivos da Onda 3 do repositorio **juarezbamberg-source/escalas**.
O foco e decompor os monolitos do frontend (EscalaPage.tsx com 75 KB e
CadastrosPage.tsx com 35 KB) em hooks e componentes, eliminar helpers duplicados
e criar um endpoint dedicado de carga por professor para o dashboard.

Os nomes usam hifen no lugar de barra para indicar o caminho de destino.
Exemplo: `frontend-src-hooks-useEscalaData.ts` corresponde a
`frontend/src/hooks/useEscalaData.ts`.

---

## 1. Mapa de destino

| Arquivo nesta pasta | Caminho no repositorio | Acao |
|---|---|---|
| frontend-src-hooks-useEscalaData.ts | frontend/src/hooks/useEscalaData.ts | NOVO |
| frontend-src-hooks-useEscalaFilters.ts | frontend/src/hooks/useEscalaFilters.ts | NOVO |
| frontend-src-hooks-useEscalaPersistence.ts | frontend/src/hooks/useEscalaPersistence.ts | NOVO |
| frontend-src-hooks-useBulkRemoval.ts | frontend/src/hooks/useBulkRemoval.ts | NOVO |
| frontend-src-hooks-useTurmaPeriodo.ts | frontend/src/hooks/useTurmaPeriodo.ts | NOVO |
| frontend-src-types-workbench.ts | frontend/src/types/workbench.ts | NOVO |
| frontend-src-components-WeeklyMatrix.tsx | frontend/src/components/WeeklyMatrix.tsx | NOVO |
| frontend-src-components-ActionStack.tsx | frontend/src/components/ActionStack.tsx | NOVO |
| frontend-src-lib-errors.ts | frontend/src/lib/errors.ts | NOVO |
| frontend-src-lib-actionContext.ts | frontend/src/lib/actionContext.ts | NOVO |
| frontend-src-lib-escalaActions.ts | frontend/src/lib/escalaActions.ts | NOVO |
| frontend-src-types-api.ts | frontend/src/types/api.ts | SUBSTITUIR (adiciona CargaProfessorItem) |
| frontend-src-lib-api.ts | frontend/src/lib/api.ts | SUBSTITUIR (adiciona listCargaProfessores) |
| frontend-src-components-forms-ProfessorForm.tsx | frontend/src/components/forms/ProfessorForm.tsx | NOVO |
| frontend-src-components-forms-UcForm.tsx | frontend/src/components/forms/UcForm.tsx | NOVO |
| frontend-src-components-forms-TurmaForm.tsx | frontend/src/components/forms/TurmaForm.tsx | NOVO |
| frontend-src-components-forms-AlocacaoForm.tsx | frontend/src/components/forms/AlocacaoForm.tsx | NOVO |
| frontend-src-components-forms-BulkRecurringForm.tsx | frontend/src/components/forms/BulkRecurringForm.tsx | NOVO |
| app-schemas-carga.py | app/schemas/carga.py | NOVO |
| app-services-carga.py | app/services/carga.py | NOVO |
| app-api-routes-carga.py | app/api/routes/carga.py | NOVO |
| app-api-router.py | app/api/router.py | SUBSTITUIR (registra rota de carga) |

---

## 2. O que muda no EscalaPage.tsx

O arquivo de 75 KB deve ser reescrito como uma composicao dos hooks e
componentes abaixo. O resultado esperado: EscalaPage cai para ~10-15 KB e
passa a orquestrar, em vez de implementar tudo.

- **useEscalaData(turno, reloadKey)** - carrega alocacoes, calendario,
  professores e turmas; expoe `reload()` para recarregar apos salvar.
- **useEscalaFilters()** - estado de filtros, presets, atalhos, modo de
  calendario e modo compacto; expoe `updateFilter`, `clearAllFilters`,
  `applyPreset`, `deletePreset`.
- **useEscalaPersistence(state)** - grava o estado da workbench no
  sessionStorage; use `readPersistedWorkbenchState()` e `readStoredPresets()`
  para hidratar o estado inicial.
- **useBulkRemoval()** - selecao em lote, preview e confirmacao da remocao.
- **useTurmaPeriodo()** - consulta por turma e periodo.
- **WeeklyMatrix** e **ActionStack** - componentes de UI movidos para
  frontend/src/components/.
- **types/workbench.ts** - tipos compartilhados (WorkbenchRow, AggregatedDay,
  etc.) que antes viviam dentro da pagina.

### Exemplo de composicao (EscalaPage reescrita)

```tsx
const persisted = readPersistedWorkbenchState();
const [turno, setTurno] = useState<Turno>(() => persisted?.turno ?? "manha");
const [reloadKey, setReloadKey] = useState(0);
const { alocacoes, calendario, professores, turmas, loading, reload } = useEscalaData(turno, reloadKey);
const filtersApi = useEscalaFilters({
  filters: persisted?.filters,
  calendarMode: persisted?.calendarMode,
  compactMode: persisted?.compactMode,
});
useEscalaPersistence({ turno, ...filtersApi, source: filtersApi.workbenchSource });
const bulkApi = useBulkRemoval();
const turmaPeriodoApi = useTurmaPeriodo();
// ... renderizacao usando os retornos dos hooks
```

---

## 3. O que muda no CadastrosPage.tsx

O arquivo de 35 KB deve ser reescrito como composicao dos cinco formularios:

- **ProfessorForm** - cadastro de professor.
- **UcForm** - cadastro de unidade curricular.
- **TurmaForm** - cadastro de turma (recebe a lista de UCs).
- **AlocacaoForm** - alocacao unitaria; recebe professores, turmas e o
  `actionContext` lido da URL (deep link da escala).
- **BulkRecurringForm** - lote recorrente com preview + confirmacao.

Alem disso:
- `readErrorMessage` agora vive em `lib/errors.ts` (fonte unica).
- `readActionContext`, `parseNumericParam` e `isTurno` vivem em
  `lib/actionContext.ts` (fonte unica).
- O sentinela de substituto ausente passou de `0` para `null` nos formularios
  novos (AlocacaoForm e BulkRecurringForm).

---

## 4. Endpoint de carga por professor

**Problema.** O DashboardPage carregava todas as alocacoes dos tres turnos e
agregava horas no cliente (`Promise.all` + `summarizeHoursByProfessor`).
Isso nao escala e duplica a regra de negocio (3 horas por alocacao) no
TypeScript.

**Solucao.** Novo endpoint `GET /professores/carga` que consolida no banco:

- `app/schemas/carga.py` - schema CargaProfessorItem.
- `app/services/carga.py` - consulta unica de alocacoes e agregacao por
  professor (titular e substituto), com HORAS_POR_ALOCACAO = 3.
- `app/api/routes/carga.py` - rota GET /professores/carga.
- `app/api/router.py` - registra a rota com tag "carga".

No frontend: `api.listCargaProfessores()` (adicionado em lib/api.ts) e o tipo
`CargaProfessorItem` (adicionado em types/api.ts).

### DashboardPage atualizado (exemplo)

```tsx
const [rows, setRows] = useState<CargaProfessorItem[]>([]);
useEffect(() => {
  let active = true;
  api.listCargaProfessores()
    .then((data) => { if (active) setRows(data); })
    .catch((error) => showError(readErrorMessage(error)))
    .finally(() => { if (active) setLoading(false); });
  return () => { active = false; };
}, []);
```

---

## 5. Ordem de aplicacao recomendada

1. Backend primeiro (a rota de carga nao depende do frontend):
   - Crie app/schemas/carga.py, app/services/carga.py, app/api/routes/carga.py.
   - Substitua app/api/router.py.
   - Rode: `.\.venv\Scripts\python.exe -m pytest`
   - Teste manual: `curl http://127.0.0.1:8000/professores/carga`

2. Frontend - helpers e tipos:
   - Crie lib/errors.ts, lib/actionContext.ts, lib/escalaActions.ts.
   - Substitua types/api.ts e lib/api.ts.

3. Frontend - hooks e componentes:
   - Crie hooks/ (5 arquivos) e types/workbench.ts.
   - Crie components/WeeklyMatrix.tsx e components/ActionStack.tsx.
   - Reescreva EscalaPage.tsx usando os hooks (remova as funcoes movidas).

4. Frontend - formularios:
   - Crie components/forms/ (5 arquivos).
   - Reescreva CadastrosPage.tsx como composicao dos formularios.

5. Valide tudo:
   - `cd frontend && npm run lint && npm run build && npm run test -- --run`
   - `pytest`

---

## 6. Riscos e rollback

- **Ciclos de importacao**: WorkbenchRow agora vive em types/workbench.ts e
  importa EscalaDrawerRow de EscalaActionDrawer. Nao importe EscalaPage a
  partir de types/workbench.ts.
- **EscalaPage reescrita**: preserve os nomes de classes CSS existentes
  (calendar-day-card, action-stack, etc.) para nao quebrar o app.css.
- **AlocacaoForm**: o sentinela mudou de 0 para null. Confira que nenhum
  codigo restante compara `professor_substituto_id === 0`.
- **Rollback**: os arquivos originais continuam no historico do git.

---

## 7. Proximas ondas

Onda 4 - Evolucao
- Regras configuraveis: horas por alocacao, limite anual, feriados moveis.
- PATCH para edicao de professores, turmas, UCs e alocacoes.
- Postgres para uso multiusuario (inclui variante do indice parcial).
- Autenticacao.

---

Gerado a partir da revisao de arquitetura, frontend e testes do repositorio.
