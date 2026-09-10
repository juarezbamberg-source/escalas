from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.errors import install_exception_handlers
from app.api.router import api_router


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    # As tabelas agora sao gerenciadas pelo Alembic (alembic upgrade head).
    # Remover o create_all evita perda de dados quando o schema evoluir.
    yield


app = FastAPI(
    title="Sistema de Escala de Professores",
    version="0.1.0",
    lifespan=lifespan,
)

install_exception_handlers(app)
app.include_router(api_router)
