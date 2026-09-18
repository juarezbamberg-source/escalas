"""Testes da Onda 9 — G1: ciclo de vida de usuários (backend)."""

from datetime import date, timedelta

from app.core.security import criar_token_acesso, gerar_hash_senha
from app.db.session import get_db
from app.models import Alocacao, Atribuicao, Funcao, Professor, Usuario


def _db(client):
    return next(client.app.dependency_overrides[get_db]())


def _criar_usuario_db(db, funcao: Funcao, username: str, professor_id: int | None = None, ativo: bool = True) -> Usuario:
    usuario = Usuario(
        nome=f"Usuario {username}",
        username=username,
        senha_hash=gerar_hash_senha("Senha-Usuario-123!"),
        funcao=funcao,
        ativo=ativo,
        trocar_senha_no_proximo_acesso=False,
        professor_id=professor_id,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def _criar_professor(client, nome: str) -> dict:
    resposta = client.post("/professores", json={"nome": nome, "contratacao": "CLT"})
    assert resposta.status_code == 201, resposta.text
    return resposta.json()


def _criar_uc(client, codigo: str) -> dict:
    resposta = client.post(
        "/ucs", json={"codigo": codigo, "nome": f"UC {codigo}", "carga_horaria": 60}
    )
    assert resposta.status_code == 201, resposta.text
    return resposta.json()


def _criar_turma(client, codigo: str, uc_id: int) -> dict:
    resposta = client.post(
        "/turmas",
        json={"codigo": codigo, "nome": f"Turma {codigo}", "turno_padrao": "manha", "uc_id": uc_id},
    )
    assert resposta.status_code == 201, resposta.text
    return resposta.json()


def _criar_alocacao(client, turma_id: int, titular_id: int, data: str, substituto_id: int | None = None) -> dict:
    resposta = client.post(
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
    assert resposta.status_code == 201, resposta.text
    return resposta.json()


def _criar_atribuicao(client, professor_id: int, turma_id: int, uc_id: int, data_inicio: str, data_fim: str) -> dict:
    hoje = date.today().isoformat()
    payload = {
        "professor_id": professor_id,
        "turma_id": turma_id,
        "uc_id": uc_id,
        "data_inicio": data_inicio,
        "data_fim": data_fim,
    }
    if data_inicio < hoje:
        payload["justificativa_retroativa"] = "Teste: atribuicao retroativa de fixture"
    resposta = client.post("/atribuicoes", json=payload)
    assert resposta.status_code == 201, resposta.text
    return resposta.json()


# --- Trava de último admin (RF-02) ---


def test_nao_desativa_unico_admin(client) -> None:
    db = _db(client)
    admin = db.query(Usuario).filter_by(funcao=Funcao.ADMIN).first()

    resposta = client.patch(f"/usuarios/{admin.id}", json={"ativo": False})
    assert resposta.status_code == 409, resposta.text
    assert "unico admin" in resposta.json()["detail"]


def test_nao_exclui_unico_admin(client) -> None:
    db = _db(client)
    admin = db.query(Usuario).filter_by(funcao=Funcao.ADMIN).first()

    resposta = client.delete(f"/usuarios/{admin.id}")
    assert resposta.status_code == 409, resposta.text
    assert "unico admin" in resposta.json()["detail"]


def test_desativa_admin_quando_existe_outro(client) -> None:
    db = _db(client)
    admin = db.query(Usuario).filter_by(funcao=Funcao.ADMIN).first()
    outro = _criar_usuario_db(db, Funcao.ADMIN, "admin_segundo")

    resposta = client.patch(f"/usuarios/{outro.id}", json={"ativo": False})
    assert resposta.status_code == 200, resposta.text
    assert resposta.json()["ativo"] is False
    assert resposta.json()["desativado_em"] is not None

    # Reativação limpa motivo/data
    reativar = client.patch(f"/usuarios/{outro.id}", json={"ativo": True})
    assert reativar.status_code == 200
    corpo = reativar.json()
    assert corpo["ativo"] is True
    assert corpo["desativado_em"] is None

    client.patch(f"/usuarios/{admin.id}", json={"ativo": True})


# --- Bloqueio de desativação com escala futura (RF-04) ---


def test_desativacao_bloqueada_com_alocacao_futura(client) -> None:
    db = _db(client)
    professor = _criar_professor(client, "Prof Futuro")
    uc = _criar_uc(client, "UC1")
    turma = _criar_turma(client, "T1", uc["id"])
    data_futura = (date.today() + timedelta(days=7)).isoformat()
    _criar_atribuicao(client, professor["id"], turma["id"], uc["id"], data_futura, "2099-12-31")
    _criar_alocacao(client, turma["id"], professor["id"], data_futura)

    usuario = _criar_usuario_db(db, Funcao.PROFESSOR, "prof_futuro", professor_id=professor["id"])

    resposta = client.patch(f"/usuarios/{usuario.id}", json={"ativo": False})
    assert resposta.status_code == 409, resposta.text
    assert data_futura in resposta.json()["detail"]


def test_desativacao_permitida_sem_alocacao_futura(client) -> None:
    db = _db(client)
    professor = _criar_professor(client, "Prof Passado")
    uc = _criar_uc(client, "UC2")
    turma = _criar_turma(client, "T2", uc["id"])
    data_passada = (date.today() - timedelta(days=7)).isoformat()
    _criar_atribuicao(client, professor["id"], turma["id"], uc["id"], data_passada, "2099-12-31")
    _criar_alocacao(client, turma["id"], professor["id"], data_passada)

    usuario = _criar_usuario_db(db, Funcao.PROFESSOR, "prof_passado", professor_id=professor["id"])

    resposta = client.patch(f"/usuarios/{usuario.id}", json={"ativo": False, "motivo_desativacao": "desligado"})
    assert resposta.status_code == 200, resposta.text
    corpo = resposta.json()
    assert corpo["ativo"] is False
    assert corpo["motivo_desativacao"] == "desligado"
    assert corpo["desativado_em"] is not None


# --- Exclusão física criteriosa (RF-01) ---


def test_exclui_usuario_sem_vinculos(client) -> None:
    db = _db(client)
    usuario = _criar_usuario_db(db, Funcao.COORDENACAO, "sem_vinculos")
    usuario_id = usuario.id

    resposta = client.delete(f"/usuarios/{usuario_id}")
    assert resposta.status_code == 204, resposta.text

    db.expire_all()
    assert db.query(Usuario).filter_by(id=usuario_id).first() is None


def test_nao_exclui_usuario_com_alocacao(client) -> None:
    db = _db(client)
    professor = _criar_professor(client, "Prof Historico")
    uc = _criar_uc(client, "UC3")
    turma = _criar_turma(client, "T3", uc["id"])
    _criar_alocacao(client, turma["id"], professor["id"], "2026-03-16")

    usuario = _criar_usuario_db(db, Funcao.PROFESSOR, "prof_historico", professor_id=professor["id"])

    resposta = client.delete(f"/usuarios/{usuario.id}")
    assert resposta.status_code == 409, resposta.text
    assert "alocacao" in resposta.json()["detail"]


def test_nao_exclui_usuario_com_atribuicao_vigente(client) -> None:
    db = _db(client)
    professor = _criar_professor(client, "Prof Vigente")
    uc = _criar_uc(client, "UC4")
    turma = _criar_turma(client, "T4", uc["id"])
    hoje = date.today()
    resposta_atribuicao = client.post(
        "/atribuicoes",
        json={
            "professor_id": professor["id"],
            "turma_id": turma["id"],
            "uc_id": uc["id"],
            "data_inicio": hoje.isoformat(),
            "data_fim": (hoje + timedelta(days=60)).isoformat(),
        },
    )
    assert resposta_atribuicao.status_code == 201, resposta_atribuicao.text

    usuario = _criar_usuario_db(db, Funcao.PROFESSOR, "prof_vigente", professor_id=professor["id"])

    resposta = client.delete(f"/usuarios/{usuario.id}")
    assert resposta.status_code == 409, resposta.text
    assert "atribuicao" in resposta.json()["detail"]


# --- Bloqueio de alocação com professor inativo/desligado (RF-03) ---


def test_alocacao_recusa_professor_inativo_no_cadastro(client) -> None:
    db = _db(client)
    professor = _criar_professor(client, "Prof Desativado")
    resposta_patch = client.patch(f"/professores/{professor['id']}", json={"ativo": False})
    assert resposta_patch.status_code == 200, resposta_patch.text

    uc = _criar_uc(client, "UC5")
    turma = _criar_turma(client, "T5", uc["id"])

    resposta = client.post(
        "/alocacoes",
        json={
            "turma_id": turma["id"],
            "data": "2026-03-16",
            "turno": "manha",
            "professor_titular_id": professor["id"],
            "professor_substituto_id": None,
            "liberar_fim_de_semana": False,
            "override": False,
            "justificativa_override": None,
        },
    )
    assert resposta.status_code == 409, resposta.text
    assert "inativo no cadastro" in resposta.json()["detail"]


def test_alocacao_recusa_professor_com_usuario_desligado(client) -> None:
    db = _db(client)
    professor = _criar_professor(client, "Prof Desligado")
    _criar_usuario_db(db, Funcao.PROFESSOR, "desligado", professor_id=professor["id"], ativo=False)

    uc = _criar_uc(client, "UC6")
    turma = _criar_turma(client, "T6", uc["id"])

    resposta = client.post(
        "/alocacoes",
        json={
            "turma_id": turma["id"],
            "data": "2026-03-16",
            "turno": "manha",
            "professor_titular_id": professor["id"],
            "professor_substituto_id": None,
            "liberar_fim_de_semana": False,
            "override": False,
            "justificativa_override": None,
        },
    )
    assert resposta.status_code == 409, resposta.text
    assert "desligado do sistema" in resposta.json()["detail"]


def test_alocacao_recusa_substituto_inativo(client) -> None:
    db = _db(client)
    titular = _criar_professor(client, "Prof Titular OK")
    substituto = _criar_professor(client, "Prof Subst Inativo")
    client.patch(f"/professores/{substituto['id']}", json={"ativo": False})

    uc = _criar_uc(client, "UC7")
    turma = _criar_turma(client, "T7", uc["id"])

    resposta = client.post(
        "/alocacoes",
        json={
            "turma_id": turma["id"],
            "data": "2026-03-16",
            "turno": "manha",
            "professor_titular_id": titular["id"],
            "professor_substituto_id": substituto["id"],
            "liberar_fim_de_semana": False,
            "override": False,
            "justificativa_override": None,
        },
    )
    assert resposta.status_code == 409, resposta.text
    assert "inativo no cadastro" in resposta.json()["detail"]
