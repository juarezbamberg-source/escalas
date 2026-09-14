# TRD — Onda 8: Privacidade por Função, Gráficos e Polimento

## 1. Privacidade por função (RF-01 a RF-03)

### Backend
- `GET /professores/carga`: nova dependência `get_current_usuario` já disponível; quando `funcao == professor`, o serviço filtra pelo `usuario.professor_id`:
  - professor sem `professor_id` vinculado → lista vazia (não é erro);
  - parâmetro `professor_id` não é aceito via query para função professor (ignorado/403).
- Escala/alocações (`GET /alocacoes*`): para função professor, retornar 403 (professor consulta a própria escala via "Minhas Atribuições" e carga própria).
- Cadastros (GET professores/ucs/turmas): 403 para professor (o professor não gerencia cadastros).
- `GET /professores/{id}/atribuicoes`: professor só pode consultar o próprio id (403 caso contrário).
- Respostas 403 com mensagem padrão "Usuario sem permissao para esta acao."

### Frontend
- `DashboardPage`: busca `usuario.funcao` da sessão;
  - professor → usa endpoint de carga com filtro próprio (backend já filtra) e título "Meu Dashboard";
  - coordenação/admin → dashboard completo atual + novos gráficos.
- Rotas `/cadastros`, `/atribuicoes`, `/usuarios` já condicionadas por função na navegação; adicionar guarda de rota (redirect para `/` se professor tentar acessar por URL).

## 2. Novos gráficos (RF-04)

- Novo endpoint `GET /dashboard/resumo?data_inicio=&data_fim=` (coordenação/admin):
  - `alocacoes_por_turno`: contagem por turno no período;
  - `alocacoes_por_turma`: top turmas por nº de alocações;
  - `substituicoes`: nº de alocações com `professor_substituto_id` preenchido.
- Frontend: cards com `BarChart` (turno), `HorizontalBarChart` (turmas) e KPI de substituições.
- Período padrão: mês corrente.

## 3. UX Cadastros (RF-05, RF-06)

- Mensagens de sucesso: "Professor desativado. Use o filtro 'Inativos' para reativar." (idem UC/turma).
- Contadores nas abas: `Ativos (12) · Inativos (2) · Todos (14)` — backend retorna totais por status (novo parâmetro `?com_totais=true` ou contagem client-side a partir de `incluir_inativos=true` + filtro local; decisão: contagem client-side, sem mudança de API).

## 4. Edição de cadastros (RF-07)

- Frontend: botão "Editar" na linha (professor/UC/turma) → formulário do card é preenchido e entra em modo edição; salvar chama PATCH; cancelar restaura criação.
- Backend: nada a fazer (PATCH já existe).

## 5. Paginação (RF-08)

- Backend: `?page=1&page_size=20` em GET /professores, /ucs, /turmas, /usuarios; resposta vira envelope `{ items, total, page, page_size }` — **breaking change**; manter `incluir_inativos=true`.
- Alternativa sem breaking change (escolhida): manter listas como array e adicionar paginação **client-side** nas telas (listas atuais são pequenas); backend envelope fica para onda futura se a base crescer.
- Frontend: controle de paginação nas 4 listas (20/page), preservando filtro de status e busca.

## 6. Exportação (RF-09)

- Biblioteca: `jsPDF` + `autotable` (PDF) e `xlsx` (Excel) no frontend — sem novo endpoint; usa dados já carregados da escala.
- Tela Escala: botões "Exportar PDF" e "Exportar Excel" com período/turno correntes; nome do arquivo `escala-<turno>-<periodo>.pdf|xlsx`.

## Migrações
- Nenhuma (sem mudança de schema).

## Testes
- Backend: professor recebe só própria carga; professor 403 em escala/cadastros; atribuições alheias 403; resumo do dashboard com período.
- Frontend: dashboard do professor (mock de sessão professor), contadores nas abas, mensagem de desativação, modo edição, paginação, exportação (smoke).
