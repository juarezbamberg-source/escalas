"""Cria o administrador inicial de forma idempotente."""

from sqlalchemy import select

from app.core.config import get_settings
from app.core.security import gerar_hash_senha
from app.db.session import SessionLocal
from app.models import Funcao, Usuario


def seed_super_admin() -> None:
    settings = get_settings()
    if not settings.admin_username or not settings.admin_senha_inicial:
        print("[seed] ADMIN_USERNAME e ADMIN_SENHA_INICIAL obrigatorios no .env")
        return

    with SessionLocal() as db:
        existente = db.scalar(select(Usuario).where(Usuario.username == settings.admin_username))
        if existente:
            print(f"[seed] Super admin ja existe ({existente.username}). Nada a fazer.")
            return

        admin = Usuario(
            nome=settings.admin_nome,
            username=settings.admin_username,
            senha_hash=gerar_hash_senha(settings.admin_senha_inicial),
            funcao=Funcao.ADMIN,
            ativo=True,
            trocar_senha_no_proximo_acesso=True,
        )
        db.add(admin)
        db.commit()
        print(f"[seed] Super admin criado: {admin.username} (troca de senha obrigatoria).")


if __name__ == "__main__":
    seed_super_admin()
