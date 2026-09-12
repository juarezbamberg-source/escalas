"""cria a tabela de usuarios da Onda 5"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=80), nullable=False),
        sa.Column("senha_hash", sa.String(length=255), nullable=False),
        sa.Column("funcao", sa.Enum("admin", "coordenacao", "professor", name="funcao"), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("trocar_senha_no_proximo_acesso", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("professor_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["professor_id"], ["professores.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("username", name="uq_usuarios_username"),
    )
    op.create_index("ix_usuarios_username", "usuarios", ["username"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_usuarios_username", table_name="usuarios")
    op.drop_table("usuarios")
