"""compatibilidade do indice parcial com Postgres"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None
INDEX_NAME = "uq_alocacao_turma_data_turno_quando_nao_forcada"


def upgrade() -> None:
    op.drop_index(INDEX_NAME, table_name="alocacoes")
    op.create_index(INDEX_NAME, "alocacoes", ["turma_id", "data", "turno"], unique=True, sqlite_where=sa.text("forcada = 0"), postgresql_where=sa.text("forcada = false"))


def downgrade() -> None:
    op.drop_index(INDEX_NAME, table_name="alocacoes")
    op.create_index(INDEX_NAME, "alocacoes", ["turma_id", "data", "turno"], unique=True, sqlite_where=sa.text("forcada = 0"))
