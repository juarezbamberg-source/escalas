# Backend em Docker (Fase 1)

O backend FastAPI roda em container; o frontend continua em modo dev na máquina (`npm run dev`).

## Subir

```powershell
docker compose up --build -d
```

O entrypoint aplica as migrações (`alembic upgrade head`), roda o seed do admin (idempotente) e sobe o uvicorn na porta 8000.

## Acessar

- API: `http://localhost:8000/docs`
- Frontend: `npm run dev` em `frontend/` (proxy `/api` → `127.0.0.1:8000` já configurado)

## Configuração

O `.env` da raiz é lido pelo container (`env_file`). Mínimo para o seed:

```
ADMIN_USERNAME=admin
ADMIN_SENHA_INICIAL=troque-esta-senha
ADMIN_NOME=Administrador
```

O banco SQLite vive no volume nomeado `escalas_data` (montado em `/data`) — sobrevive a `down` e rebuild. Para resetar tudo:

```powershell
docker compose down -v
```

## Verificar

```powershell
docker compose logs backend        # ver entrypoint (migrações + seed)
docker compose exec backend alembic current   # revisão aplicada
```
