"""Testes da Onda 6: CRUD de atribuicoes, vigencia e regras de negocio."""

from datetime import date, timedelta

from app.core.security import criar_token_acesso, gerar_hash_senha
from app.db.session import get_db
from app.models import Funcao, Usuario


def _criar_base(client) -> tuple[dict, dict, dict]:
    professor = client.post("/professores", json={"nome": "Maria Titular", "contratacao": "CLT"}).json()
    uc = client.post(
        "/ucs",
        json={"codigo": "UC6", "nome": "UC Onda 6", "carga_horaria": 60},
    ).json()
    turma = client.post(
        "/turmas",
        json={"codigo": "T6", "nome": "Turma Onda 6", "turno_padrao": "manha", "uc_id": uc["id"]},
    ).json()
    return professor, uc, turma


def _payload(professor_id: int, turma_id: int, uc_id: int, **extras) -> dict:
    dados = {
        "professor_id": professor_id,
        "turma_id": turma_id,
        "uc_id": uc_id,
        "data_inicio": "2026-10-01",
        "data_fim": "2026-12-31",
        "professor_substituto_id": None,
        "justificativa_retroativa": None,
    }
    dados.update(extras)
    return dados


def test_criar_e_listar_atribuicao(client) -> None:
    professor, uc, turma = _criar_base(client)

    criada = client.post("/atribuicoes", json=_payload(professor["id"], turma["id"], uc["id"]))
    assert criada.status_code == 201, criada.text
    corpo = criada.json()
    assert corpo["professor_nome"] == "Maria Titular"
    assert corpo["turma_codigo"] == "T6"
    assert corpo["uc_codigo"] == "UC6"

    lista = client.get("/atribuicoes")
    assert lista.status_code == 200
    assert lista.json()[0]["id"] == corpo["id"]


def test_listar_por_professor_e_vigencia(client) -> None:
    professor, uc, turma = _criar_base(client)
    client.post("/atribuicoes", json=_payload(professor["id"], turma["id"], uc["id"]))

    por_professor = client.get(f"/atribuicoes?professor_id={professor['id']}")
    assert por_professor.status_code == 200
    assert len(por_professor.json()) == 1

    dentro = client.get("/atribuicoes?vigente_em=2026-11-01")
    assert dentro.status_code == 200
    assert len(dentro.json()) == 1

    fora = client.get("/atribuicoes?vigente_em=2027-01-01")
    assert fora.status_code == 200
    assert len(fora.json()) == 0


def test_atribuicao_retroativa_exige_justificativa(client) -> None:
    professor, uc, turma = _criar_base(client)

    sem_justificativa = client.post(
        "/atribuicoes",
        json=_payload(
            professor["id"],
            turma["id"],
            uc["id"],
            data_inicio="2020-01-01",
            data_fim="2020-12-31",
        ),
    )
    assert sem_justificativa.status_code == 400

    com_justificativa = client.post(
        "/atribuicoes",
        json=_payload(
            professor["id"],
            turma["id"],
            uc["id"],
            data_inicio="2020-01-01",
            data_fim="2020-12-31",
            justificativa_retroativa="Regularizacao de historico",
        ),
    )
    assert com_justificativa.status_code == 201, com_justificativa.text


def test_substituto_igual_ao_titular_e_bloqueado(client) -> None:
    professor, uc, turma = _criar_base(client)

    resposta = client.post(
        "/atribuicoes",
        json=_payload(professor["id"], turma["id"], uc["id"], professor_substituto_id=professor["id"]),
    )
    assert resposta.status_code == 400


def test_patch_atualiza_vigencia_e_delete_exige_confirmar(client) -> None:
    professor, uc, turma = _criar_base(client)
    criada = client.post("/atribuicoes", json=_payload(professor["id"], turma["id"], uc["id"])).json()

    atualizada = client.patch(
        f"/atribuicoes/{criada['id']}",
        json={"data_fim": "2026-11-30"},
    )
    assert atualizada.status_code == 200
    assert atualizada.json()["data_fim"] == "2026-11-30"

    sem_confirmar = client.delete(f"/atribuicoes/{criada['id']}")
    assert sem_confirmar.status_code == 400

    com_confirmar = client.delete(f"/atribuicoes/{criada['id']}?confirmar=true")
    assert com_confirmar.status_code == 204

    lista = client.get("/atribuicoes")
    assert len(lista.json()) == 0


def test_professor_nao_pode_gerenciar_atribuicoes(client) -> None:
    professor, uc, turma = _criar_base(client)

    db = next(client.app.dependency_overrides[get_db]())
    try:
        usuario = Usuario(
            nome="Professor Restrito",
            username="prof_onda6",
            senha_hash=gerar_hash_senha("Senha-Professor-123!"),
            funcao=Funcao.PROFESSOR,
            ativo=True,
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
        token = criar_token_acesso(usuario.id, usuario.funcao.value)
    finally:
        db.close()

    resposta = client.post(
        "/atribuicoes",
        json=_payload(professor["id"], turma["id"], uc["id"]),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resposta.status_code == 403
