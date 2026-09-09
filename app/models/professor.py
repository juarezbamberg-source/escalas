from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import Contratacao


class Professor(Base):
    __tablename__ = "professores"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    contratacao: Mapped[Contratacao] = mapped_column(Enum(Contratacao), nullable=False)

    alocacoes_titulares = relationship(
        "Alocacao",
        back_populates="professor_titular",
        foreign_keys="Alocacao.professor_titular_id",
        passive_deletes=True,
    )
    alocacoes_substitutas = relationship(
        "Alocacao",
        back_populates="professor_substituto",
        foreign_keys="Alocacao.professor_substituto_id",
        passive_deletes=True,
    )
