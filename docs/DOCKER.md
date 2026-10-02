# Backend em Docker (Fase 2 — full stack)

Todo o sistema roda em containers: backend FastAPI + frontend React servido pelo Nginx.

## Subir

```powershell
docker compose up --build -d
```

O entrypoint do backend aplica migrações, roda o seed do admin (idempotente) e sobe o uvicorn. O frontend é buildado (Vite) e servido pelo Nginx.

## Acessar

- **Sistema: `http://localhost:8080`** (Nginx — use este no dia a dia)
- API direta: `http://localhost:8000/docs`

O Nginx faz o papel do proxy do Vite: chamadas `/api/*` no navegador vão para `backend:8000` dentro da rede do compose — mesma origem, sem CORS.

## Configuração

O `.env` da raiz é lido pelo container do backend. Mínimo para o seed:

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
docker compose logs backend     # migrações + seed + uvicorn
docker compose logs frontend    # nginx pronto
docker compose ps               # ambos "Up"
```

## Conflito de portas

O compose usa **8000** (backend) e **8080** (frontend). Se outro projeto (ex.: encontros-tech) estiver na 8000, pare-o antes — ou edite o mapeamento no `docker-compose.yml` (e o `VITE_API_BASE_URL` não precisa mudar: o proxy é interno ao Nginx).

