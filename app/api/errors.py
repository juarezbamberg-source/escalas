from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.services.errors import ConflitoDeNegocioError, EntidadeNaoEncontradaError, ValidacaoDeNegocioError


def install_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ValidacaoDeNegocioError)
    async def handle_validation_error(_request: Request, exc: ValidacaoDeNegocioError) -> JSONResponse:
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    @app.exception_handler(ConflitoDeNegocioError)
    async def handle_conflict_error(_request: Request, exc: ConflitoDeNegocioError) -> JSONResponse:
        return JSONResponse(status_code=409, content={"detail": str(exc)})

    @app.exception_handler(EntidadeNaoEncontradaError)
    async def handle_not_found_error(_request: Request, exc: EntidadeNaoEncontradaError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": str(exc)})
