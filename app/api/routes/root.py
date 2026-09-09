from fastapi import APIRouter


router = APIRouter()


@router.get("/")
def root() -> dict[str, str]:
    return {
        "app": "Sistema de Escala de Professores",
        "status": "ok",
        "docs": "/docs",
        "health": "/health",
    }
