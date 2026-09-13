"""Testes da Onda 6 fatia 2: exigir atribuicao para alocacoes novas (RF-02/RF-03)."""

from app.core.security import gerar_hash_senha
from app.db.session import get_db
from app.models import Funcao, Usuario
from tests.test_escalas_api import _criar_alocacao, _criar_atribuicao, _criar_professor, _criar_turma, _criar_uc


def _base(client) -> tuple[dict, dict, dict]:
    professor = _criar_professor(client, "Maria Atribuida")
    uc = _criar_uc(client, "UCATTR")
    turma = _criar_turma(client, "ATTR1", uc["id"])
    return professor, uc, turma


def test_alocacao_futura_sem_atribuicao_e_bloqueada(client) -> None:
    professor, uc, turma = _base(client)

    resposta = _criar_alocacao(client, turma["id"], professor["id"], data="2026-12-14")
    assert resposta.status_code == 400
    assert "sem atribuicao ativa" in resposta.json()["detail"]


def test_alocacao_futura_com_atribuicao_e_liberada(client) -> None:
    professor, uc, turma = _base(client)
    _criar_atribuicao(client, professor["id"], turma["id"], uc["id"])

    resposta = _criar_alocacao(client, turma["id"], professor["id"], data="2026-12-14")
    assert resposta.status_code == 201, resposta.text


def test_alocacao_historica_nao_exige_atribuicao(client) -> None:
    professor, uc, turma = _base(client)

    resposta = _criar_alocacao(client, turma["id"], professor["id"], data="2026-03-16")
    assert resposta.status_code == 201, resposta.text


def test_substituto_sem_atribuicao_e_bloqueado(client) -> None:
    professor, uc, turma = _base(client)
    substituto = _criar_professor(client, "Carlos Substituto")
    _criar_atribuicao(client, professor["id"], turma["id"], uc["id"])

    resposta = _criar_alocacao(
        client,
        turma["id"],
        professor["id"],
        data="2026-12-14",
        professor_substituto_id=substituto["id"],
    )
    assert resposta.status_code == 400
    assert "substituto" in resposta.json()["detail"]


def test_substituto_atribuido_como_substituto_e_liberado(client) -> None:
    professor, uc, turma = _base(client)
    substituto = _criar_professor(client, "Carlos Substituto")
    _criar_atribuicao(
        client,
        professor["id"],
        turma["id"],
        uc["id"],
        professor_substituto_id=substituto["id"],
    )

    resposta = _criar_alocacao(
        client,
        turma["id"],
        professor["id"],
        data="2026-12-14",
        professor_substituto_id=substituto["id"],
    )
    assert resposta.status_code == 201, resposta.text
