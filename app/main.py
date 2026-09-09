from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.errors import install_exception_handlers
from app.api.router import api_router
from app.db.session import engine
from app.models import Base


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Sistema de Escala de Professores",
    version="0.1.0",
    lifespan=lifespan,
)
install_exception_handlers(app)
app.include_router(api_router)
