"""Testes da Onda 11 — F1: filtro de periodo na carga realizada (RF-01)."""

from datetime import date

from app.core.security import criar_token_acesso, gerar_hash_senha
from app.db.session import get_db
from app.models import Funcao, Usuario


def _criar_usuario_funcao(client, funcao: Funcao, username: str, professor_id: int | None = None):
    get_db_override = client.app.dependency_overrides[get_db]
    db = next(get_db_override())
    try:
        usuario = Usuario(
            nome=f"Usuario {username}",
            username=username,
            senha_hash=gerar_hash_senha("Senha-Usuario-123!"),
            funcao=funcao,
            ativo=True,
            trocar_senha_no_proximo_acesso=False,
            professor_id=professor_id,
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
        token = criar_token_acesso(usuario.id, usuario.funcao.value)
    finally:
        db.close()
    return {"Authorization": f"Bearer {token}"}


def _criar_professor(client, nome: str) -> dict:
    response = client.post("/professores", json={"nome": nome, "contratacao": "CLT"})
    assert response.status_code == 201, response.text
    return response.json()


def _criar_uc(client, codigo: str) -> dict:
    response = client.post(
        "/ucs", json={"codigo": codigo, "nome": f"UC {codigo}", "carga_horaria": 60}
    )
    assert response.status_code == 201, response.text
    return response.json()


def _criar_turma(client, codigo: str, uc_id: int) -> dict:
    response = client.post(
        "/turmas",
        json={"codigo": codigo, "nome": f"Turma {codigo}", "turno_padrao": "manha", "uc_id": uc_id},
    )
    assert response.status_code == 201, response.text
    return response.json()


def _criar_alocacao(
    client, turma_id: int, titular_id: int, data: str, turno: str = "manha"
) -> dict:
    response = client.post(
        "/alocacoes",
        json={
            "turma_id": turma_id,
            "data": data,
            "turno": turno,
            "professor_titular_id": titular_id,
            "professor_substituto_id": None,
            "liberar_fim_de_semana": False,
            "override": False,
            "justificativa_override": None,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def _cenario_base(client):
    """Professor com 3 alocacoes: 2 dentro do periodo, 1 fora."""
    professor = _criar_professor(client, "Rosa Periodo")
    uc = _criar_uc(client, "UC-PERIODO")
    turma = _criar_turma(client, "TP-1", uc["id"])
    _criar_alocacao(client, turma["id"], professor["id"], "2026-05-04", "manha")
    _criar_alocacao(client, turma["id"], professor["id"], "2026-05-05", "tarde")
    _criar_alocacao(client, turma["id"], professor["id"], "2026-06-15", "noite")
    return professor


def _headers_coordenacao(client):
    return _criar_usuario_funcao(client, Funcao.COORDENACAO, "coord.onda11")


def test_carga_realizada_com_periodo_filtra_alocacoes(client) -> None:
    _cenario_base(client)
    headers = _headers_coordenacao(client)

    resposta = client.get(
        "/professores/carga?tipo=realizada&data_inicio=2026-05-01&data_fim=2026-05-31",
        headers=headers,
    )

    assert resposta.status_code == 200, resposta.text
    itens = resposta.json()
    rosa = next(item for item in itens if item["professor_nome"] == "Rosa Periodo")
    assert rosa["alocacoes"] == 2
    assert rosa["horas"] == 6
    assert rosa["manha"] == 3
    assert rosa["tarde"] == 3
    assert rosa["noite"] == 0


def test_carga_realizada_sem_periodo_mantem_historico_completo(client) -> None:
    _cenario_base(client)
    headers = _headers_coordenacao(client)

    resposta = client.get("/professores/carga?tipo=realizada", headers=headers)

    assert resposta.status_code == 200, resposta.text
    itens = resposta.json()
    rosa = next(item for item in itens if item["professor_nome"] == "Rosa Periodo")
    assert rosa["alocacoes"] == 3
    assert rosa["horas"] == 9


def test_carga_realizada_periodo_sem_dados_retorna_zero(client) -> None:
    _cenario_base(client)
    headers = _headers_coordenacao(client)

    resposta = client.get(
        "/professores/carga?tipo=realizada&data_inicio=2020-01-01&data_fim=2020-01-31",
        headers=headers,
    )

    assert resposta.status_code == 200, resposta.text
    itens = resposta.json()
    rosa = next(item for item in itens if item["professor_nome"] == "Rosa Periodo")
    assert rosa["alocacoes"] == 0
    assert rosa["horas"] == 0


def test_carga_realizada_periodo_aplicada_ao_professor(client) -> None:
    professor = _cenario_base(client)
    headers = _criar_usuario_funcao(
        client, Funcao.PROFESSOR, "prof.onda11", professor_id=professor["id"]
    )

    resposta = client.get(
        "/professores/carga?tipo=realizada&data_inicio=2026-05-01&data_fim=2026-05-31",
        headers=headers,
    )

    assert resposta.status_code == 200, resposta.text
    itens = resposta.json()
    assert [item["professor_nome"] for item in itens] == ["Rosa Periodo"]
    assert itens[0]["alocacoes"] == 2


def test_carga_prevista_ignora_periodo_da_realizada(client) -> None:
    """data_inicio/data_fim nao afetam a carga prevista (que usa vigente_em)."""
    _cenario_base(client)
    headers = _headers_coordenacao(client)

    resposta = client.get(
        "/professores/carga?tipo=prevista&data_inicio=2026-05-01&data_fim=2026-05-31",
        headers=headers,
    )

    assert resposta.status_code == 200, resposta.text
    itens = resposta.json()
    rosa = next(
        (item for item in itens if item["professor_nome"] == "Rosa Periodo"), None
    )
    assert rosa is None or rosa["horas"] == 0
