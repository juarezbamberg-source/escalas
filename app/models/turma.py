from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import Turno


class Turma(Base):
    __tablename__ = "turmas"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    turno_padrao: Mapped[Turno] = mapped_column(Enum(Turno), nullable=False)
    uc_id: Mapped[int] = mapped_column(ForeignKey("unidades_curriculares.id", ondelete="RESTRICT"), nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")

    unidade_curricular = relationship("UnidadeCurricular", back_populates="turmas")
    alocacoes = relationship("Alocacao", back_populates="turma", passive_deletes=True)
