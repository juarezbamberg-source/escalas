#!/bin/sh
set -e

echo "[entrypoint] Aplicando migracoes (alembic upgrade head)..."
alembic upgrade head

echo "[entrypoint] Seed do super admin (idempotente)..."
python -m app.seed

echo "[entrypoint] Subindo uvicorn..."
exec "$@"
