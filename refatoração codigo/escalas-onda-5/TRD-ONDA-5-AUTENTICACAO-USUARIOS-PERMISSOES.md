# TRD — Onda 5: Autenticação Real, Usuários e Permissões

## Modelo de dados

### Entidade Usuario
| Campo | Tipo | Regras |
|---|---|---|
| id | int PK | |
| nome | str | obrigatório |
| email | str | único, obrigatório |
| senha_hash | str | hash bcrypt/argon2 |
| funcao | enum | admin, coordenacao, professor |
| ativo | bool | default true |
| trocar_senha_no_proximo_acesso | bool | default true para novos |
| professor_id | int FK nullable | vínculo opcional com Professor |
| created_at / updated_at | datetime | |

### Enum Funcao
- admin
- coordenacao
- professor

## Endpoints

### Autenticação
- POST /auth/login — body {email, senha} → {access_token, token_type, trocar_senha}
- POST /auth/trocar-senha — autenticado; body {senha_atual, nova_senha}
- GET /auth/me — autenticado → {id, nome, email, funcao, professor_id}

### Usuários (admin)
- GET /usuarios — lista (filtros: funcao, ativo, busca)
- POST /usuarios — {nome, email, funcao, professor_id?, senha_temporaria}
- PATCH /usuarios/{id} — ativar/desativar, trocar função, resetar senha
- DELETE /usuarios/{id} — apenas com confirmar (ou apenas desativação)

## Segurança
- Hash de senha com bcrypt (passlib) ou argon2.
- JWT: sub=user_id, claim funcao; expiração via settings (padrão Onda 4).
- Dependência get_current_usuario (decodifica JWT e carrega usuário).
- Dependência require_funcao(*funcoes) para proteger rotas por função.

## Seed do super admin
- Detalhamento completo em SEED-SUPER-ADMIN-ONDA-5.md (app/seed.py).
- Criado por script (python -m app.seed) ou migração de dados.
- Credenciais iniciais definidas em .env (ADMIN_EMAIL, ADMIN_SENHA_INICIAL).
- trocar_senha_no_proximo_acesso=true.

## Frontend
- hasPermission(permissao) passa a consultar /auth/me (usuário + função).
- Proteção por ação: botões de escrita aparecem conforme função.
- Páginas: LoginPage, TrocarSenhaPage, UsuariosPage (admin). Mapeamento em MAPA-TELAS-FRONTEND-ONDA-5-6-7.md.
- Rotas protegidas no AppRoutes (guard por função).

## Migração
- Alembic 0003: tabela usuarios + enum funcao.
