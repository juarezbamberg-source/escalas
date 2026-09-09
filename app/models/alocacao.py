from datetime import date

from sqlalchemy import Boolean, CheckConstraint, Date, Enum, ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import Turno


class Alocacao(Base):
    __tablename__ = "alocacoes"
    __table_args__ = (
        CheckConstraint(
            "professor_substituto_id IS NULL OR professor_substituto_id <> professor_titular_id",
            name="ck_alocacao_titular_diferente_substituto",
        ),
        Index(
            "uq_alocacao_turma_data_turno_quando_nao_forcada",
            "turma_id",
            "data",
            "turno",
            unique=True,
            sqlite_where=text("forcada = 0"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    turma_id: Mapped[int] = mapped_column(ForeignKey("turmas.id", ondelete="RESTRICT"), nullable=False)
    data: Mapped[date] = mapped_column(Date, nullable=False)
    turno: Mapped[Turno] = mapped_column(Enum(Turno), nullable=False)
    professor_titular_id: Mapped[int] = mapped_column(ForeignKey("professores.id", ondelete="RESTRICT"), nullable=False)
    professor_substituto_id: Mapped[int | None] = mapped_column(ForeignKey("professores.id", ondelete="RESTRICT"))
    forcada: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    justificativa_override: Mapped[str | None] = mapped_column(String(500))

    turma = relationship("Turma", back_populates="alocacoes")
    professor_titular = relationship(
        "Professor",
        back_populates="alocacoes_titulares",
        foreign_keys=[professor_titular_id],
    )
    professor_substituto = relationship(
        "Professor",
        back_populates="alocacoes_substitutas",
        foreign_keys=[professor_substituto_id],
    )
