# Design: Onda 3

## Fatias de implementação

### Fatia 1 — carga no backend

Criar `app/schemas/carga.py`, `app/services/carga.py` e `app/api/routes/carga.py`. O serviço deve consultar alocações uma vez, agregar horas por professor como titular ou substituto e expor `GET /professores/carga`. A constante atual de três horas por alocação deve ficar explícita no serviço nesta onda.

### Fatia 2 — contrato frontend

Adicionar `CargaProfessorItem` em `frontend/src/types/api.ts` e `api.listCargaProfessores()` em `frontend/src/lib/api.ts`. Atualizar o dashboard para consumir somente esse contrato.

### Fatia 3 — helpers e workbench

Extrair erros, contexto de ação, ações, tipos compartilhados, hooks de dados/filtros/persistência/remocão e consulta por turma. Os hooks não devem importar páginas.

### Fatia 4 — componentes

Extrair `WeeklyMatrix`, `ActionStack` e os cinco formulários. Preservar as classes CSS existentes e os nomes dos campos públicos.

### Fatia 5 — composição e remoção segura

Reescrever `EscalaPage` e `CadastrosPage` como orquestradores. Remover duplicações somente depois de os testes das novas unidades passarem.

## Fronteiras

- API: validação de entrada e resposta tipada.
- Serviço: consulta e agregação de carga; regras de negócio permanecem no backend.
- Hooks: estado e efeitos do frontend.
- Componentes: apresentação e eventos, sem duplicar regra de negócio.

## Verificação

Cada fatia deve executar os testes relacionados; ao final, executar pytest, lint, Vitest e build. A migração do banco não é necessária para o endpoint de carga, pois ele usa as tabelas existentes.
