"""adiciona motivo_desativacao e desativado_em em usuarios (Onda 9)"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "usuarios",
        sa.Column("motivo_desativacao", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "usuarios",
        sa.Column("desativado_em", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("usuarios", "desativado_em")
    op.drop_column("usuarios", "motivo_desativacao")
