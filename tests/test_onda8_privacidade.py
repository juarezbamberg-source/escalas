"""Testes da Onda 8 — F1: privacidade por função (ADR-008)."""

from datetime import date, timedelta

from app.core.security import criar_token_acesso, gerar_hash_senha
from app.db.session import get_db
from app.models import Funcao, Professor, Usuario


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


def _criar_alocacao(client, turma_id: int, titular_id: int, data: str = "2026-03-16") -> dict:
    response = client.post(
        "/alocacoes",
        json={
            "turma_id": turma_id,
            "data": data,
            "turno": "manha",
            "professor_titular_id": titular_id,
            "professor_substituto_id": None,
            "liberar_fim_de_semana": False,
            "override": False,
            "justificativa_override": None,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def _criar_alocacao_com_substituto(
    client, turma_id: int, titular_id: int, substituto_id: int, data: str
) -> dict:
    response = client.post(
        "/alocacoes",
        json={
            "turma_id": turma_id,
            "data": data,
            "turno": "manha",
            "professor_titular_id": titular_id,
            "professor_substituto_id": substituto_id,
            "liberar_fim_de_semana": False,
            "override": False,
            "justificativa_override": None,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def _criar_atribuicao(client, professor_id: int, turma_id: int, uc_id: int) -> dict:
    # Vigencia ampla a partir de ontem: cobre alocações de hoje e de datas
    # passadas do mes corrente sem cair na regra de retroatividade.
    ontem = date.today() - timedelta(days=1)
    response = client.post(
        "/atribuicoes",
        json={
            "professor_id": professor_id,
            "turma_id": turma_id,
            "uc_id": uc_id,
            "data_inicio": ontem.isoformat(),
            "data_fim": "2099-12-31",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


# --- Carga: professor ve somente a propria ---


def test_professor_ve_apenas_proprias_cargas_realizada_e_prevista(client) -> None:
    prof_a = _criar_professor(client, "Prof A")
    prof_b = _criar_professor(client, "Prof B")
    uc = _criar_uc(client, "UC1")
    turma = _criar_turma(client, "T1", uc["id"])
    _criar_alocacao(client, turma["id"], prof_a["id"])
    _criar_atribuicao(client, prof_a["id"], turma["id"], uc["id"])

    headers = _criar_usuario_funcao(client, Funcao.PROFESSOR, "prof_a", professor_id=prof_a["id"])

    realizada = client.get("/professores/carga?tipo=realizada", headers=headers)
    assert realizada.status_code == 200, realizada.text
    itens = realizada.json()
    assert len(itens) == 1
    assert itens[0]["professor_id"] == prof_a["id"]

    prevista = client.get("/professores/carga?tipo=prevista", headers=headers)
    assert prevista.status_code == 200, prevista.text
    itens_prev = prevista.json()
    assert len(itens_prev) == 1
    assert itens_prev[0]["professor_id"] == prof_a["id"]


def test_professor_sem_vinculo_recebe_lista_vazia(client) -> None:
    prof_a = _criar_professor(client, "Prof A")
    uc = _criar_uc(client, "UC1")
    turma = _criar_turma(client, "T1", uc["id"])
    _criar_alocacao(client, turma["id"], prof_a["id"])

    headers = _criar_usuario_funcao(client, Funcao.PROFESSOR, "sem_vinculo", professor_id=None)

    resposta = client.get("/professores/carga", headers=headers)
    assert resposta.status_code == 200
    assert resposta.json() == []


def test_coordenacao_ve_carga_completa(client) -> None:
    prof_a = _criar_professor(client, "Prof A")
    prof_b = _criar_professor(client, "Prof B")
    uc = _criar_uc(client, "UC1")
    turma = _criar_turma(client, "T1", uc["id"])
    _criar_alocacao(client, turma["id"], prof_a["id"])
    _criar_alocacao(client, turma["id"], prof_b["id"], data="2026-03-17")

    headers = _criar_usuario_funcao(client, Funcao.COORDENACAO, "coord")

    resposta = client.get("/professores/carga", headers=headers)
    assert resposta.status_code == 200
    ids = {item["professor_id"] for item in resposta.json()}
    assert ids == {prof_a["id"], prof_b["id"]}


# --- Escala e cadastros: 403 para professor ---


def test_professor_recebe_403_na_escala(client) -> None:
    headers = _criar_usuario_funcao(client, Funcao.PROFESSOR, "prof_escala")

    resposta = client.get("/alocacoes?turno=manha", headers=headers)
    assert resposta.status_code == 403


def test_professor_recebe_403_nos_cadastros(client) -> None:
    headers = _criar_usuario_funcao(client, Funcao.PROFESSOR, "prof_cad")

    for rota in ("/professores", "/ucs", "/turmas"):
        resposta = client.get(rota, headers=headers)
        assert resposta.status_code == 403, rota


def test_coordenacao_acessa_escala_e_cadastros(client) -> None:
    _criar_professor(client, "Prof A")
    headers = _criar_usuario_funcao(client, Funcao.COORDENACAO, "coord2")

    assert client.get("/alocacoes?turno=manha", headers=headers).status_code == 200
    assert client.get("/professores", headers=headers).status_code == 200


# --- Atribuicoes: professor so consulta o proprio id ---


def test_professor_consulta_proprias_atribuicoes(client) -> None:
    prof_a = _criar_professor(client, "Prof A")
    uc = _criar_uc(client, "UC1")
    turma = _criar_turma(client, "T1", uc["id"])
    _criar_atribuicao(client, prof_a["id"], turma["id"], uc["id"])

    headers = _criar_usuario_funcao(client, Funcao.PROFESSOR, "prof_attr", professor_id=prof_a["id"])

    propria = client.get(f"/professores/{prof_a['id']}/atribuicoes", headers=headers)
    assert propria.status_code == 200
    assert len(propria.json()) == 1

    via_lista = client.get("/atribuicoes", headers=headers)
    assert via_lista.status_code == 200
    assert len(via_lista.json()) == 1


def test_professor_recebe_403_em_atribuicoes_de_terceiros(client) -> None:
    prof_a = _criar_professor(client, "Prof A")
    prof_b = _criar_professor(client, "Prof B")
    uc = _criar_uc(client, "UC1")
    turma = _criar_turma(client, "T1", uc["id"])
    _criar_atribuicao(client, prof_b["id"], turma["id"], uc["id"])

    headers = _criar_usuario_funcao(client, Funcao.PROFESSOR, "prof_attr2", professor_id=prof_a["id"])

    resposta = client.get(f"/professores/{prof_b['id']}/atribuicoes", headers=headers)
    assert resposta.status_code == 403

    filtrada = client.get(f"/atribuicoes?professor_id={prof_b['id']}", headers=headers)
    assert filtrada.status_code == 403


# --- Dashboard resumo (Onda 8, RF-04) ---


def test_resumo_dashboard_padrao_mes_corrente(client) -> None:
    # Periodo padrao e o mes corrente: calculado a partir de hoje para o
    # teste nao depender de data fixa (falharia na virada do mes).
    hoje = date.today()
    uc = _criar_uc(client, "UC1")
    turma = _criar_turma(client, "T1", uc["id"])
    prof = _criar_professor(client, "Prof Resumo")
    _criar_alocacao(client, turma["id"], prof["id"], data=hoje.isoformat())
    _criar_alocacao(client, turma["id"], prof["id"], data=(hoje - timedelta(days=1)).isoformat())

    resposta = client.get("/dashboard/resumo")
    assert resposta.status_code == 200, resposta.text
    corpo = resposta.json()
    assert corpo["data_inicio"] == hoje.replace(day=1).isoformat()
    assert corpo["data_fim"] == hoje.isoformat()
    assert corpo["total_alocacoes"] >= 2
    assert corpo["total_substituicoes"] == 0
    assert "manha" in corpo["alocacoes_por_turno"]
    assert corpo["alocacoes_por_turma"][0]["turma_codigo"] == "T1"


def test_resumo_dashboard_respeita_periodo_e_substituicoes(client) -> None:
    uc = _criar_uc(client, "UC1")
    turma = _criar_turma(client, "T1", uc["id"])
    prof = _criar_professor(client, "Prof Resumo2")
    subst = _criar_professor(client, "Prof Subst")
    _criar_alocacao(client, turma["id"], prof["id"], data="2026-03-16")
    _criar_alocacao_com_substituto(client, turma["id"], prof["id"], subst["id"], data="2026-03-17")

    resposta = client.get("/dashboard/resumo?data_inicio=2026-03-01&data_fim=2026-03-31")
    assert resposta.status_code == 200, resposta.text
    corpo = resposta.json()
    assert corpo["data_inicio"] == "2026-03-01"
    assert corpo["data_fim"] == "2026-03-31"
    assert corpo["total_alocacoes"] == 2
    assert corpo["total_substituicoes"] == 1
    assert corpo["alocacoes_por_turno"] == {"manha": 2}


def test_professor_recebe_403_no_resumo_dashboard(client) -> None:
    headers = _criar_usuario_funcao(client, Funcao.PROFESSOR, "prof_dash")

    resposta = client.get("/dashboard/resumo", headers=headers)
    assert resposta.status_code == 403
