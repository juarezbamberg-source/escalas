# Seed do Super Admin — Onda 5 (app/seed.py)

## Objetivo
Criar o primeiro admin (super admin) de forma idempotente: se já existir um usuário com o e-mail do admin, o script não duplica nem altera nada.

## Pré-requisitos no .env
- ADMIN_EMAIL — e-mail do super admin (ex.: admin@senacrs.local)
- ADMIN_SENHA_INICIAL — senha inicial (use `python -c "import secrets; print(secrets.token_urlsafe(16))"` para gerar)
- ADMIN_NOME — nome exibido (opcional, default "Administrador")

## Como rodar
```powershell
python -m app.seed
```
Rodar uma única vez na implantação (local e produção). Em CI, não rodar seed.

## Script (app/seed.py)
```python
"""Cria o super admin (primeiro admin) de forma idempotente."""

from sqlalchemy import select

from app.core.config import get_settings
from app.core.security import gerar_hash_senha  # Onda 5: adicionar ao security.py
from app.db.session import SessionLocal
from app.models import Funcao, Usuario


def seed_super_admin() -> None:
    settings = get_settings()
    if not settings.admin_email or not settings.admin_senha_inicial:
        print("[seed] ADMIN_EMAIL e ADMIN_SENHA_INICIAL obrigatorios no .env")
        return

    with SessionLocal() as db:
        existente = db.scalar(select(Usuario).where(Usuario.email == settings.admin_email))
        if existente:
            print(f"[seed] Super admin ja existe ({existente.email}). Nada a fazer.")
            return

        admin = Usuario(
            nome=settings.admin_nome or "Administrador",
            email=settings.admin_email,
            senha_hash=gerar_hash_senha(settings.admin_senha_inicial),
            funcao=Funcao.admin,
            ativo=True,
            trocar_senha_no_proximo_acesso=True,
        )
        db.add(admin)
        db.commit()
        print(f"[seed] Super admin criado: {admin.email} (troca de senha obrigatoria no 1o acesso).")


if __name__ == "__main__":
    seed_super_admin()
```

## Ajustes necessários na Onda 5 para o seed funcionar
1. `app/models/usuario.py`: model `Usuario` com campos acima + relacionamento opcional com Professor.
2. `app/models/enums.py`: enum `Funcao` (admin, coordenacao, professor).
3. `app/core/security.py`: função `gerar_hash_senha(senha: str) -> str` usando passlib/bcrypt.
4. `app/core/config.py`: campos `admin_email`, `admin_senha_inicial`, `admin_nome`.
5. `.env.example`: documentar as 3 variáveis (sem o valor real).
6. Migração Alembic 0003 criando a tabela `usuarios` antes de rodar o seed.

## Notas de segurança
- A senha inicial é descartável: o login força a troca (trocar_senha_no_proximo_acesso=true).
- Resete via PATCH /usuarios/{id} (admin) gera nova temporária + mesma flag.
- Este fluxo substitui o login simplificado por professor_id (ADR 004 → ADR 005).
