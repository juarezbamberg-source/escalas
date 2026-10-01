FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Dependencias primeiro (camada cacheavel) — dev extras incluem pytest/httpx
COPY pyproject.toml README.md ./
COPY app ./app
RUN pip install --no-cache-dir ".[dev]"

# Codigo restante (alembic, migrations)
COPY alembic.ini ./
COPY alembic ./alembic

# Banco SQLite vive fora da imagem (volume montado em /data)
ENV DATABASE_URL=sqlite:////data/escalas.db
VOLUME /data

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
