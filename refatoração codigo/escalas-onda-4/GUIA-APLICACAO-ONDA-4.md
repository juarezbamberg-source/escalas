# Guia de aplicação - Onda 4 (evolução) - projeto escalas

Esta pasta contém os arquivos da Onda 4 do repositório **juarezbamberg-source/escalas**.
O foco é a evolução do sistema: regras de negócio configuráveis, operações de
atualização (PATCH), compatibilidade com Postgres e autenticação.

Os nomes usam hífen no lugar de barra para indicar o caminho de destino.

---

## 1. Mapa de destino

| Arquivo nesta pasta | Caminho no repositório | Ação |
|---|---|---|
| app-core-config.py | app/core/config.py | SUBSTITUIR |
| app-services-regras.py | app/services/regras.py | NOVO |
| app-services-feriados.py | app/services/feriados.py | NOVO |
| app-services-professores.py | app/services/professores.py | SUBSTITUIR |
| app-services-turmas.py | app/services/turmas.py | SUBSTITUIR |
| app-services-unidade_curricular.py | app/services/unidade_curricular.py | SUBSTITUIR |
| app-schemas-professor.py | app/schemas/professor.py | SUBSTITUIR |
| app-schemas-turma.py | app/schemas/turma.py | SUBSTITUIR |
| app-schemas-unidade_curricular.py | app/schemas/unidade_curricular.py | SUBSTITUIR |
| app-schemas-alocacao.py | app/schemas/alocacao.py | SUBSTITUIR |
| app-api-routes-professores.py | app/api/routes/professores.py | SUBSTITUIR |
| app-api-routes-turmas.py | app/api/routes/turmas.py | SUBSTITUIR |
| app-api-routes-unidades_curriculares.py | app/api/routes/unidades_curriculares.py | SUBSTITUIR |
| app-api-routes-alocacoes.py | app/api/routes/alocacoes.py | SUBSTITUIR |
| app-api-router.py | app/api/router.py | SUBSTITUIR |
| app-core-security.py | app/core/security.py | NOVO |
| app-schemas-auth.py | app/schemas/auth.py | NOVO |
| app-api-routes-auth.py | app/api/routes/auth.py | NOVO |

---

## 2. Regras de negócio configuráveis

**Problema.** As constantes HORAS_POR_ALOCACAO (3), o limite anual de 300h e a
lista de feriados estavam fixas no código. Alterar qualquer uma exigia editar o
código-fonte e reimplantar.

**Solução.**
- `app/core/config.py` agora expõe `horas_por_alocacao`, `limite_anual_carga_horas`,
  `limite_anual_carga_alocacoes`, além das novas configurações de autenticação e CORS.
- `app/services/regras.py` centraliza o acesso a essas regras.
- `app/services/feriados.py` calcula feriados móveis (Páscoa, Sexta-feira Santa,
  Corpus Christi e Carnaval) pelo algoritmo de Gauss e inclui os fixos nacionais.

**Como configurar.** Adicione ao `.env`:
```
HORAS_POR_ALOCACAO=3
LIMITE_ANUAL_CARGA_HORAS=300
LIMITE_ANUAL_CARGA_ALOCACOES=100
SECRET_KEY=uma-chave-forte-aleatoria
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173
```

---

## 3. Operações de atualização (PATCH)

**Problema.** O CRUD era incompleto: não havia como editar professor, turma, UC
e alocação. Corrigir um dado exigia excluir e recriar, o que violava integridade
referencial quando havia vínculos.

**Solução.** Novos endpoints PATCH:
- `PATCH /professores/{id}`
- `PATCH /turmas/{id}`
- `PATCH /ucs/{id}`
- `PATCH /alocacoes/{id}`

Cada um usa `exclude_unset=True` para atualizar apenas os campos enviados, e
reusa a hierarquia de erros de domínio (ConflitoDeNegocioError para unicidade,
EntidadeNaoEncontradaError para 404).

---

## 4. Autenticação

**Problema.** O sistema não tinha controle de acesso. Para uso multiusuário em
produção, é necessário autenticar.

**Solução.** Autenticação JWT simplificada:
- `app/core/security.py` - geração e validação de tokens, dependência
  `get_current_professor`.
- `app/schemas/auth.py` - schemas de login e token.
- `app/api/routes/auth.py` - `POST /auth/login` emite token para um professor.

**Nota importante.** Este é um fluxo simplificado para o contexto acadêmico: o
login recebe o `professor_id`. Em produção, substitua por autenticação por senha
ou SSO. A dependência `get_current_professor` pode ser adicionada a qualquer rota
que exija autenticação.

---

## 5. Compatibilidade com Postgres

O índice parcial da migração Alembic usa `sqlite_where`. Para Postgres, crie uma
migração que adicione o índice com `postgresql_where=text("forcada = false")`.

Exemplo de migração (alembic/versions/0002_postgres.py):
```python
op.create_index(
    "uq_alocacao_turma_data_turno_quando_nao_forcada",
    "alocacoes",
    ["turma_id", "data", "turno"],
    unique=True,
    postgresql_where=sa.text("forcada = false"),
)
```

---

## 6. Ordem de aplicação

1. Substitua `app/core/config.py` e adicione as variáveis ao `.env`.
2. Crie `app/services/regras.py` e `app/services/feriados.py`.
3. Substitua os schemas e serviços de professores, turmas, UCs e alocações.
4. Substitua as rotas e o `app/api/router.py`.
5. Crie os arquivos de autenticação (`security.py`, `schemas/auth.py`, `routes/auth.py`).
6. Instale a dependência PyJWT: `pip install pyjwt` (adicione adiciona ao pyproject).
7. Rode os testes: `pytest`.

---

## 7. Riscos e rollback

- **PyJWT** é uma dependência nova; adicione-a ao `pyproject.toml`.
- A autenticação simplificada não deve ir a produção sem senha/SSO.
- O `exclude_unset=True` garante que PATCH não sobrescreva campos não enviados.
- Rollback: arquivos originais no histórico do git.

---

Gerado a partir da revisão de arquitetura, frontend e testes do repositório.
