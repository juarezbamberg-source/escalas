"""compatibilidade do indice parcial com Postgres

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INDEX_NAME = "uq_alocacao_turma_data_turno_quando_nao_forcada"


def upgrade() -> None:
    """Recria o indice unico parcial de forma compativel com Postgres.

    A migracao 0001 criou o indice com clausula exclusiva do SQLite
    (sqlite_where=text("forcada = 0")). Este passo remove o indice e o
    recria declarando as duas variantes de dialeto: sqlite_where para
    SQLite e postgresql_where para Postgres. Assim o mesmo codigo de
    migracao funciona nos dois bancos.
    """
    op.drop_index(INDEX_NAME, table_name="alocacoes")
    op.create_index(
        INDEX_NAME,
        "alocacoes",
        ["turma_id", "data", "turno"],
        unique=True,
        sqlite_where=sa.text("forcada = 0"),
        postgresql_where=sa.text("forcada = false"),
    )


def downgrade() -> None:
    """Reverte para o indice exclusivo do SQLite."""
    op.drop_index(INDEX_NAME, table_name="alocacoes")
    op.create_index(
        INDEX_NAME,
        "alocacoes",
        ["turma_id", "data", "turno"],
        unique=True,
        sqlite_where=sa.text("forcada = 0"),
    )
