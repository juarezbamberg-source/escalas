from fastapi import APIRouter

from app.api.routes.alocacoes import router as alocacoes_router
from app.api.routes.carga import router as carga_router
from app.api.routes.health import router as health_router
from app.api.routes.professores import router as professores_router
from app.api.routes.root import router as root_router
from app.api.routes.turmas import router as turmas_router
from app.api.routes.unidades_curriculares import router as unidades_curriculares_router

api_router = APIRouter()
api_router.include_router(root_router, tags=["root"])
api_router.include_router(health_router, tags=["health"])
api_router.include_router(professores_router, prefix="/professores", tags=["professores"])
api_router.include_router(unidades_curriculares_router, prefix="/ucs", tags=["ucs"])
api_router.include_router(turmas_router, prefix="/turmas", tags=["turmas"])
api_router.include_router(alocacoes_router, prefix="/alocacoes", tags=["alocacoes"])
api_router.include_router(carga_router, tags=["carga"])
