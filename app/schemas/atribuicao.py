from datetime import date

from pydantic import BaseModel, Field, model_validator

from app.models.atribuicao import Atribuicao


class AtribuicaoCreate(BaseModel):
    professor_id: int
    turma_id: int
    uc_id: int
    data_inicio: date
    data_fim: date
    professor_substituto_id: int | None = None
    justificativa_retroativa: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validar_vigencia(self) -> "AtribuicaoCreate":
        if self.data_fim < self.data_inicio:
            raise ValueError("data_fim deve ser maior ou igual a data_inicio.")
        return self


class AtribuicaoUpdate(BaseModel):
    data_inicio: date | None = None
    data_fim: date | None = None
    professor_substituto_id: int | None = None
    justificativa_retroativa: str | None = Field(default=None, max_length=500)


class AtribuicaoRead(BaseModel):
    id: int
    professor_id: int
    professor_nome: str
    turma_id: int
    turma_codigo: str
    uc_id: int
    uc_codigo: str
    uc_nome: str
    data_inicio: date
    data_fim: date
    professor_substituto_id: int | None = None
    professor_substituto_nome: str | None = None
    justificativa_retroativa: str | None = None

    model_config = {"from_attributes": True}

    @classmethod
    def de_entidade(cls, atribuicao: Atribuicao) -> "AtribuicaoRead":
        return cls(
            id=atribuicao.id,
            professor_id=atribuicao.professor_id,
            professor_nome=atribuicao.professor.nome,
            turma_id=atribuicao.turma_id,
            turma_codigo=atribuicao.turma.codigo,
            uc_id=atribuicao.uc_id,
            uc_codigo=atribuicao.unidade_curricular.codigo,
            uc_nome=atribuicao.unidade_curricular.nome,
            data_inicio=atribuicao.data_inicio,
            data_fim=atribuicao.data_fim,
            professor_substituto_id=atribuicao.professor_substituto_id,
            professor_substituto_nome=(
                atribuicao.professor_substituto.nome if atribuicao.professor_substituto else None
            ),
            justificativa_retroativa=atribuicao.justificativa_retroativa,
        )
