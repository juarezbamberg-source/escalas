"""criar tabelas iniciais: professores, unidades_curriculares, turmas e alocacoes

Revision ID: 0001
Revises:
Create Date: 2026-09-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "professores",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column("contratacao", sa.Enum("PF", "CLT", "PJ", name="contratacao"), nullable=False),
        sa.UniqueConstraint("nome", name="uq_professores_nome"),
    )
    op.create_table(
        "unidades_curriculares",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("codigo", sa.String(length=50), nullable=False),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column("carga_horaria", sa.Integer(), nullable=False),
        sa.UniqueConstraint("codigo", name="uq_ucs_codigo"),
    )
    op.create_table(
        "turmas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("codigo", sa.String(length=50), nullable=False),
        sa.Column("nome", sa.String(length=255), nullable=False),
        sa.Column("turno_padrao", sa.Enum("manha", "tarde", "noite", name="turno"), nullable=False),
        sa.Column("uc_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["uc_id"], ["unidades_curriculares.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("codigo", name="uq_turmas_codigo"),
    )
    op.create_table(
        "alocacoes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("turma_id", sa.Integer(), nullable=False),
        sa.Column("data", sa.Date(), nullable=False),
        sa.Column("turno", sa.Enum("manha", "tarde", "noite", name="turno"), nullable=False),
        sa.Column("professor_titular_id", sa.Integer(), nullable=False),
        sa.Column("professor_substituto_id", sa.Integer(), nullable=True),
        sa.Column("forcada", sa.Boolean(), nullable=False),
        sa.Column("justificativa_override", sa.String(length=500), nullable=True),
        sa.CheckConstraint(
            "professor_substituto_id IS NULL OR professor_substituto_id <> professor_titular_id",
            name="ck_alocacao_titular_diferente_substituto",
        ),
        sa.ForeignKeyConstraint(["professor_substituto_id"], ["professores.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["professor_titular_id"], ["professores.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["turma_id"], ["turmas.id"], ondelete="RESTRICT"),
    )
    op.create_index(
        "uq_alocacao_turma_data_turno_quando_nao_forcada",
        "alocacoes",
        ["turma_id", "data", "turno"],
        unique=True,
        sqlite_where=sa.text("forcada = 0"),
    )


def downgrade() -> None:
    op.drop_index("uq_alocacao_turma_data_turno_quando_nao_forcada", table_name="alocacoes")
    op.drop_table("alocacoes")
    op.drop_table("turmas")
    op.drop_table("unidades_curriculares")
    op.drop_table("professores")
