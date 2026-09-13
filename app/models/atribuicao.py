from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Atribuicao(Base):
    __tablename__ = "atribuicoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    professor_id: Mapped[int] = mapped_column(
        ForeignKey("professores.id", ondelete="RESTRICT"), nullable=False
    )
    turma_id: Mapped[int] = mapped_column(
        ForeignKey("turmas.id", ondelete="RESTRICT"), nullable=False
    )
    uc_id: Mapped[int] = mapped_column(
        ForeignKey("unidades_curriculares.id", ondelete="RESTRICT"), nullable=False
    )
    data_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    data_fim: Mapped[date] = mapped_column(Date, nullable=False)
    professor_substituto_id: Mapped[int | None] = mapped_column(
        ForeignKey("professores.id", ondelete="RESTRICT"), nullable=True
    )
    justificativa_retroativa: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[date] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    professor = relationship("Professor", foreign_keys=[professor_id])
    professor_substituto = relationship("Professor", foreign_keys=[professor_substituto_id])
    turma = relationship("Turma")
    unidade_curricular = relationship("UnidadeCurricular")
