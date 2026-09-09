from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class UnidadeCurricular(Base):
    __tablename__ = "unidades_curriculares"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    carga_horaria: Mapped[int] = mapped_column(Integer, nullable=False)

    turmas = relationship("Turma", back_populates="unidade_curricular", passive_deletes=True)
