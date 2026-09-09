from enum import Enum


class Turno(str, Enum):
    MANHA = "manha"
    TARDE = "tarde"
    NOITE = "noite"


class Contratacao(str, Enum):
    PF = "PF"
    CLT = "CLT"
    PJ = "PJ"
