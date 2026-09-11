# Mapa de Telas do Frontend — Ondas 5, 6 e 7

*Onde cada tela entra, o que cada botão faz e quem pode ver (hasPermission real via GET /auth/me).*

## Rotas (AppRoutes.tsx)
| Rota | Página | Acesso |
|---|---|---|
| /login | LoginPage | público |
| /trocar-senha | TrocarSenhaPage | autenticado c/ flag trocar_senha |
| /escala | EscalaPage | admin, coordenacao, professor |
| /cadastros | CadastrosPage | admin, coordenacao |
| /atribuicoes | AtribuicoesPage | admin, coordenacao |
| /admin/usuarios | UsuariosPage | admin |
| * (fallback) | → /login | |

Guard: componente RequireAuth (checa token + funcao); RequireFuncao(['admin','coordenacao']) nas rotas de escrita.

## hasPermission real
- `src/lib/api.ts` → `GET /auth/me` no boot (contexto AuthContext com { usuario, funcao }).
- `hasPermission(acao)` em `src/lib/permissions.ts` (novo): tabela ação × funções.
  Ex.: `cadastrar: ['admin','coordenacao']`, `gerenciar_usuarios: ['admin']`, `visualizar_escala: ['admin','coordenacao','professor']`.
- Usado para exibir/ocultar botões (UX); a segurança real continua no backend (403).

## 1. LoginPage (Onda 5)
- Campos: e-mail, senha.
- Botão **Entrar** → POST /auth/login; se trocar_senha=true → navigate('/trocar-senha').
- Sem botões de cadastro (não há auto-registro).

## 2. TrocarSenhaPage (Onda 5)
- Campos: senha atual, nova senha, confirmar nova senha.
- Botão **Salvar nova senha** → POST /auth/trocar-senha → logout → /login.
- Mensagem: "Senha alterada. Faça login novamente."

## 3. EscalaPage (todas)
- Professor: exibe apenas turmas/UCs atribuídas na vigência (GET /professores/{id}/atribuicoes).
- Sem botões de escrita para professor (ocultos via hasPermission).
- Coordenação/admin: botões de alocação conforme já existe (AlocacaoForm, BulkRecurringForm).

## 4. CadastrosPage (admin, coordenacao)
Abas existentes + botões novos (Onda 7):
- Professores: ações por linha **Editar** (PATCH) e **Desativar/Ativar** (PATCH ativo). Badge "Inativo".
- Unidades Curriculares: **Editar**, **Desativar/Ativar**.
- Turmas: **Editar**, **Desativar/Ativar**.
- Alocações (isoladas): **Editar** (PATCH), **Excluir** (confirmar=true), já existente**Excluir em lote**.
- Filtros no topo de cada aba: status (Ativos/Inativos/Todos) + busca por nome/código + paginação.
- Botão **+ Novo** abre os formulários existentes (ProfessorForm, UcForm, TurmaForm, AlocacaoForm).

## 5. AtribuicoesPage (Onda 6 — nova)
- Tabela: professor, turma, UC, início, fim, substituto, status vigência (ativa/encerrada).
- Botão **+ Nova atribuição** → modal: professor, turma, UC, data_inicio, data_fim, substituto; se retroativa (início < hoje) exige justificativa obrigatória.
- Ações por linha: **Editar** (vigência/substituto), **Encerrar vigência** (define fim), **Excluir** (confirmar).
- Filtro: por professor, por turma, por vigência (ativas/futuras/encerradas).

## 6. UsuariosPage (Onda 5 — nova, somente admin)
- Tabela: nome, e-mail, função, status (Ativo/Inativo), professor vinculado.
- Botão **+ Novo usuário** → modal: nome, e-mail, função, professor vinculado (opcional), senha temporária; ao salvar, POST /usuarios.
- Ações por linha: **Editar** (dados/função), **Resetar senha** (nova temporária + força troca), **Desativar/Ativar**.
- Filtros: função, status, busca por nome/e-mail. Badge "Inativo".
- Regras: usuário não pode desativar a si mesmo; só admin acessa esta página.

## Componentes novos sugeridos (src/)
- `components/ActionCell.tsx` — ações por linha (editar/desativar) reutilizável nas tabelas.
- `components/StatusBadge.tsx` — badge Ativo/Inativo + opacidade.
- `components/FiltrosLista.tsx` — filtro de status + busca + paginação.
- `components/modais/UsuarioModal.tsx`, `AtribuicaoModal.tsx` — formulários em modal.
- `pages/TrocarSenhaPage.tsx`, `pages/UsuariosPage.tsx`, `pages/AtribuicoesPage.tsx`.
- `lib/permissions.ts` — matriz ação × função (fonte única para hasPermission).

## Resumo dos botões por função
| Ação | Admin | Coordenação | Professor |
|---|---|---|---|
| Entrar/trocar senha | ✅ | ✅ | ✅ |
| Visualizar escala | ✅ | ✅ | ✅ (só o que lhe é atribuído) |
| Cadastrar/editar professor, UC, turma | ✅ | ✅ | — |
| Alocações (criar/editar/excluir) | ✅ | ✅ | — |
| Atribuições (Onda 6) | ✅ | ✅ | — |
| Desativar/ativar professor, UC, turma (Onda 7) | ✅ | ✅ | — |
| Usuários (criar/editar/resetar/desativar) (Onda 5) | ✅ | — | — |
