"""cria a tabela de atribuicoes da Onda 6"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "atribuicoes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("professor_id", sa.Integer(), nullable=False),
        sa.Column("turma_id", sa.Integer(), nullable=False),
        sa.Column("uc_id", sa.Integer(), nullable=False),
        sa.Column("data_inicio", sa.Date(), nullable=False),
        sa.Column("data_fim", sa.Date(), nullable=False),
        sa.Column("professor_substituto_id", sa.Integer(), nullable=True),
        sa.Column("justificativa_retroativa", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["professor_id"], ["professores.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["turma_id"], ["turmas.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["uc_id"], ["unidades_curriculares.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["professor_substituto_id"], ["professores.id"], ondelete="RESTRICT"),
        sa.CheckConstraint("data_fim >= data_inicio", name="ck_atribuicao_vigencia_valida"),
        sa.CheckConstraint(
            "professor_substituto_id IS NULL OR professor_substituto_id <> professor_id",
            name="ck_atribuicao_titular_diferente_substituto",
        ),
    )
    op.create_index("ix_atribuicoes_professor_id", "atribuicoes", ["professor_id"])
    op.create_index("ix_atribuicoes_turma_id", "atribuicoes", ["turma_id"])


def downgrade() -> None:
    op.drop_index("ix_atribuicoes_turma_id", table_name="atribuicoes")
    op.drop_index("ix_atribuicoes_professor_id", table_name="atribuicoes")
    op.drop_table("atribuicoes")
