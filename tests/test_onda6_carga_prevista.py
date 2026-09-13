"""Testes da Onda 6 fatia 3: atribuicoes do professor e carga prevista (RF-04/RF-05)."""

from tests.test_escalas_api import _criar_atribuicao, _criar_professor, _criar_turma, _criar_uc


def _base(client) -> tuple[dict, dict, dict]:
    professor = _criar_professor(client, "Maria Prevista")
    uc = _criar_uc(client, "UCPREV", carga_horaria=120)
    turma = _criar_turma(client, "PREV1", uc["id"])
    return professor, uc, turma


def test_atribuicoes_do_professor_na_vigencia(client) -> None:
    professor, uc, turma = _base(client)
    _criar_atribuicao(client, professor["id"], turma["id"], uc["id"])

    resposta = client.get(f"/professores/{professor['id']}/atribuicoes")
    assert resposta.status_code == 200, resposta.text
    corpo = resposta.json()
    assert len(corpo) == 1
    assert corpo[0]["turma_codigo"] == "PREV1"
    assert corpo[0]["uc_codigo"] == "UCPREV"

    dentro = client.get(f"/professores/{professor['id']}/atribuicoes?vigente_em=2026-11-01")
    assert len(dentro.json()) == 1

    fora = client.get(f"/professores/{professor['id']}/atribuicoes?vigente_em=2028-06-01")
    assert len(fora.json()) == 0


def test_carga_prevista_soma_carga_cheia_das_ucs(client) -> None:
    professor, uc, turma = _base(client)
    uc2 = _criar_uc(client, "UCPREV2", carga_horaria=60)
    _criar_atribuicao(client, professor["id"], turma["id"], uc["id"])

    resposta = client.get("/professores/carga?tipo=prevista")
    assert resposta.status_code == 200, resposta.text
    item = next(i for i in resposta.json() if i["professor_id"] == professor["id"])
    assert item["horas"] == 120
    assert item["atribuicoes"] == 1
    assert item["turmas"] == 1

    _criar_atribuicao(client, professor["id"], turma["id"], uc2["id"])
    resposta = client.get("/professores/carga?tipo=prevista")
    item = next(i for i in resposta.json() if i["professor_id"] == professor["id"])
    assert item["horas"] == 180
    assert item["atribuicoes"] == 2
    assert item["turmas"] == 1


def test_carga_prevista_respeita_recorte_de_data(client) -> None:
    professor, uc, turma = _base(client)
    _criar_atribuicao(client, professor["id"], turma["id"], uc["id"])

    dentro = client.get("/professores/carga?tipo=prevista&vigente_em=2026-11-01")
    item = next(i for i in dentro.json() if i["professor_id"] == professor["id"])
    assert item["horas"] == 120

    fora = client.get("/professores/carga?tipo=prevista&vigente_em=2028-06-01")
    item = next(i for i in fora.json() if i["professor_id"] == professor["id"])
    assert item["horas"] == 0


def test_carga_realizada_continua_disponivel(client) -> None:
    professor, uc, turma = _base(client)

    resposta = client.get("/professores/carga")
    assert resposta.status_code == 200, resposta.text
    item = next(i for i in resposta.json() if i["professor_id"] == professor["id"])
    assert item["horas"] == 0
    assert item["alocacoes"] == 0


def test_tipo_invalido_e_rejeitado(client) -> None:
    resposta = client.get("/professores/carga?tipo=inexistente")
    assert resposta.status_code == 422
