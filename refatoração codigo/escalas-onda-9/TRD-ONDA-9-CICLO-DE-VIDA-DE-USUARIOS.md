# TRD — Onda 9: Gestão de Ciclo de Vida de Usuários

## 1. Modelo de dados (migração Alembic 0006)

- `usuarios.motivo_desativacao`: String(255), nullable, default NULL.
- `usuarios.desativado_em`: DateTime(timezone=True), nullable — gravado automaticamente quando `ativo` passa de true para false; limpo na reativação.
- Sem alteração em outras tabelas.

## 2. Endpoints (backend)

### PATCH /usuarios/{id} (desativação — RF-02, RF-04, RF-05)
- Se payload `ativo=false`:
  - **Trava de último admin**: se alvo é admin e é o único admin ativo → 409 "Nao e possivel desativar o unico admin ativo."
  - **Bloqueio de escala futura**: se alvo tem `professor_id` e existem alocações com `data >= hoje` onde ele é titular ou substituto → 409 com lista de datas (máx. 10 na mensagem).
  - Grava `motivo_desativacao` (campo `motivo_desativacao` do payload, opcional) e `desativado_em=now()`.
- Se `ativo=true` (reativação): limpa `motivo_desativacao` e `desativado_em`.
- Novo schema `UsuarioUpdate`: campos `motivo_desativacao: str | None`, validação de tamanho 255.

### DELETE /usuarios/{id} (exclusão física — RF-01, RF-02)
- **Novo comportamento** (hoje o DELETE faz soft delete): passa a excluir fisicamente.
- Pré-condições (todas em uma transação):
  1. Alvo não pode ser o único admin ativo → 409;
  2. Alvo não pode ter alocações (passadas ou futuras) como titular/substituto → 409 com contagem;
  3. Alvo não pode ter atribuições ativas (vigência atual) → 409 com contagem.
- Professor vinculado: o vínculo é removido (`professor_id=NULL` no Professor não existe — a FK é em Usuario; exclusão do usuário simplesmente libera o professor, que permanece no cadastro).
- Frontend: botão "Excluir" só habilitado quando a API indica elegibilidade (ver seção 4) + confirmação obrigatória.

### GET /usuarios (RF-06, RF-08)
- Mantém `?ativo=true|false` e `?busca=`; a tela passa a pedir as duas listas conforme a aba (ou `incluir_inativos` padrão dos cadastros — decisão: usar `ativo` como filtro direto, já existente).
- Resposta passa a incluir `motivo_desativacao` e `desativado_em` (UsuarioRead já tem from_attributes; adicionar campos).

### POST /alocacoes e /alocacoes/recorrente (RF-03)
- Em `_validar_dependencias_da_alocacao`, após localizar titular/substituto:
  - `Professor.ativo == false` → 409 "Professor X esta inativo no cadastro."
  - `Usuario` vinculado (via `professor_id`) com `ativo == false` → 409 "Professor X esta desligado do sistema."
- Aplicar a titular e substituto; mensagem identifica o professor pelo nome.

## 3. Frontend

### Menu (RF-07)
- `coordenacaoNavItems`: remover `{ to: "/usuarios" }` (1 linha).

### UsuariosPage (RF-05, RF-06, RF-08, RF-01)
- Abas de status (Ativos/Inativos/Todos) no padrão da CadastrosPage, com contadores; busca por username preservada.
- Ao desativar: modal/inline com campo opcional "Motivo" (placeholder "desligado, afastamento..."); envia `ativo=false` + `motivo_desativacao`.
- Aba Inativos: colunas Motivo e Desativado em (dd/mm/aaaa); ação Reativar existente.
- Botão "Excluir" por linha: habilitado apenas quando a listagem indica ausência de vínculos — implementação: tentativa de exclusão com tratamento de 409 exibindo o motivo retornado pela API (fonte única de verdade no backend); confirmação via `window.confirm` nesta onda.
- 409 de desativação com escala futura: exibir as datas retornadas na mensagem de erro.

## 4. Decisões
- **Elegibilidade de exclusão**: validada no backend (fonte única); a UI não pré-calcula — evita duplicar regra e divergir.
- **Motivo como campo simples** (não tabela de eventos) — conforme consolidação do brainstorm.
- **DELETE físico** muda de comportamento (era soft): os botões da UI passam a ser "Desativar" (soft) e "Excluir" (físico, restrito).

## 5. Migração
- Alembic 0006: `motivo_desativacao` (String 255, nullable) e `desativado_em` (DateTime nullable) em `usuarios`.

## 6. Testes
- Backend: trava último admin (desativar/excluir); exclusão com alocação passada/futura/atribuição vigente (409); exclusão sem vínculos (200 + registro some); alocação com professor inativo (cadastro) e com usuário desligado (409, nome na mensagem); desativação com alocação futura (409 + datas); motivo gravado e limpo na reativação; login genérico mantido.
- Frontend: menu admin-only; abas com contadores; fluxo desativar com motivo; aba Inativos com motivo/data; exclusão com confirmação e erro 409 exibido.
