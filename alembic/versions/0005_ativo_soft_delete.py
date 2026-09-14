"""adiciona coluna ativo para soft delete (Onda 7)"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABELAS = ["professores", "unidades_curriculares", "turmas"]


def upgrade() -> None:
    for tabela in TABELAS:
        op.add_column(
            tabela,
            sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.true()),
        )


def downgrade() -> None:
    for tabela in reversed(TABELAS):
        op.drop_column(tabela, "ativo")
