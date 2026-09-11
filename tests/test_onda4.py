"""Testes da Onda 4: autenticacao (login/token), PATCH, feriados e regras."""

from datetime import date, datetime, timedelta, timezone

import jwt
import pytest
from fastapi import HTTPException

from app.core.config import get_settings
from app.core.security import criar_token_acesso, get_current_professor
from app.services import feriados, regras


# --- Helpers (mesmo padrao dos testes existentes) ---

def _criar_professor(client, nome: str, contratacao: str = "CLT") -> dict:
    response = client.post("/professores", json={"nome": nome, "contratacao": contratacao})
    assert response.status_code == 201, response.text
    return response.json()


def _criar_uc(client, codigo: str, carga_horaria: int = 60) -> dict:
    response = client.post(
        "/ucs",
        json={"codigo": codigo, "nome": f"UC {codigo}", "carga_horaria": carga_horaria},
    )
    assert response.status_code == 201, response.text
    return response.json()


def _criar_turma(client, codigo: str, uc_id: int, turno_padrao: str = "manha") -> dict:
    response = client.post(
        "/turmas",
        json={"codigo": codigo, "nome": f"Turma {codigo}", "turno_padrao": turno_padrao, "uc_id": uc_id},
    )
    assert response.status_code == 201, response.text
    return response.json()


def _criar_alocacao(
    client,
    turma_id: int,
    professor_titular_id: int,
    data: str = "2026-03-16",
    turno: str = "manha",
) -> dict:
    payload = {
        "turma_id": turma_id,
        "data": data,
        "turno": turno,
        "professor_titular_id": professor_titular_id,
        "professor_substituto_id": None,
        "liberar_fim_de_semana": False,
        "override": False,
        "justificativa_override": None,
    }
    return client.post("/alocacoes", json=payload)


# --- Autenticacao: POST /auth/login ---

def test_login_emite_token_para_professor_existente(client) -> None:
    professor = _criar_professor(client, "Maria Login")
    response = client.post("/auth/login", json={"professor_id": professor["id"]})

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]

    settings = get_settings()
    payload = jwt.decode(body["access_token"], settings.secret_key, algorithms=[settings.algoritmo_jwt])
    assert payload["sub"] == str(professor["id"])
    assert "exp" in payload


def test_login_rejeita_professor_inexistente(client) -> None:
    response = client.post("/auth/login", json={"professor_id": 99999})
    assert response.status_code == 401


# --- Autenticacao: security (unidade) ---

def test_criar_token_acesso_contem_sub_e_expiracao() -> None:
    settings = get_settings()
    token = criar_token_acesso(42)
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algoritmo_jwt])
    assert payload["sub"] == "42"
    assert payload["exp"] > int(datetime.now(timezone.utc).timestamp())


def test_get_current_professor_rejeita_token_invalido() -> None:
    with pytest.raises(HTTPException) as exc_info:
        get_current_professor("token-invalido")
    assert exc_info.value.status_code == 401


def test_get_current_professor_rejeita_token_sem_sub() -> None:
    settings = get_settings()
    token = jwt.encode(
        {"exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
        settings.secret_key,
        algorithm=settings.algoritmo_jwt,
    )
    with pytest.raises(HTTPException) as exc_info:
        get_current_professor(token)
    assert exc_info.value.status_code == 401


# --- Config: CORS e JWT expostos ---

def test_config_expoe_cors_origins_como_lista() -> None:
    settings = get_settings()
    assert settings.cors_origins_list == ["http://localhost:5173"]


def test_config_expoe_chave_e_parametros_jwt() -> None:
    settings = get_settings()
    assert settings.secret_key
    assert settings.algoritmo_jwt == "HS256"
    assert settings.access_token_expire_minutes == 60


# --- PATCH: professores ---

def test_patch_professor_atualiza_apenas_campo_enviado(client) -> None:
    professor = _criar_professor(client, "Maria")
    response = client.patch(f"/professores/{professor['id']}", json={"nome": "Maria Atualizada"})

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["nome"] == "Maria Atualizada"
    assert body["contratacao"] == "CLT"


def test_patch_professor_inexistente_retorna_404(client) -> None:
    response = client.patch("/professores/99999", json={"nome": "X"})
    assert response.status_code == 404


# --- PATCH: turmas ---

def test_patch_turma_atualiza_campos(client) -> None:
    uc = _criar_uc(client, "UCPATCH")
    turma = _criar_turma(client, "PATCH1", uc["id"], turno_padrao="manha")
    response = client.patch(
        f"/turmas/{turma['id']}",
        json={"nome": "Turma Renomeada", "turno_padrao": "tarde"},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["nome"] == "Turma Renomeada"
    assert body["turno_padrao"] == "tarde"
    assert body["codigo"] == "PATCH1"


def test_patch_turma_inexistente_retorna_404(client) -> None:
    response = client.patch("/turmas/99999", json={"nome": "X"})
    assert response.status_code == 404


# --- PATCH: unidades curriculares ---

def test_patch_uc_atualiza_carga_horaria(client) -> None:
    uc = _criar_uc(client, "UCPATCHC", carga_horaria=60)
    response = client.patch(f"/ucs/{uc['id']}", json={"carga_horaria": 90})

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["carga_horaria"] == 90
    assert body["codigo"] == "UCPATCHC"


def test_patch_uc_inexistente_retorna_404(client) -> None:
    response = client.patch("/ucs/99999", json={"carga_horaria": 90})
    assert response.status_code == 404


# --- PATCH: alocacoes ---

def test_patch_alocacao_troca_professor_titular(client) -> None:
    uc = _criar_uc(client, "UCALOCP")
    maria = _criar_professor(client, "Maria")
    joao = _criar_professor(client, "Joao")
    turma = _criar_turma(client, "ALOCP1", uc["id"])
    criada = _criar_alocacao(client, turma["id"], maria["id"])
    assert criada.status_code == 201, criada.text
    alocacao = criada.json()

    response = client.patch(f"/alocacoes/{alocacao['id']}", json={"professor_titular_id": joao["id"]})

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["id"] == alocacao["id"]
    assert body["professor_titular_nome"] == "Joao"


def test_patch_alocacao_marca_forcada_com_justificativa(client) -> None:
    uc = _criar_uc(client, "UCALOCF")
    maria = _criar_professor(client, "Maria")
    turma = _criar_turma(client, "ALOCPF", uc["id"])
    criada = _criar_alocacao(client, turma["id"], maria["id"])
    assert criada.status_code == 201, criada.text
    alocacao = criada.json()

    response = client.patch(
        f"/alocacoes/{alocacao['id']}",
        json={"forcada": True, "justificativa_override": "Ajuste pos-criacao"},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["forcada"] is True
    assert body["justificativa_override"] == "Ajuste pos-criacao"


def test_patch_alocacao_inexistente_retorna_404(client) -> None:
    response = client.patch("/alocacoes/99999", json={"forcada": True})
    assert response.status_code == 404


# --- Feriados (unidade) ---

def test_feriados_fixos_reconhecidos() -> None:
    assert feriados.eh_feriado(date(2026, 1, 1))
    assert feriados.eh_feriado(date(2026, 4, 21))
    assert feriados.eh_feriado(date(2026, 5, 1))
    assert feriados.eh_feriado(date(2026, 9, 7))
    assert feriados.eh_feriado(date(2026, 10, 12))
    assert feriados.eh_feriado(date(2026, 11, 2))
    assert feriados.eh_feriado(date(2026, 11, 15))
    assert feriados.eh_feriado(date(2026, 11, 20))
    assert feriados.eh_feriado(date(2026, 12, 25))


def test_feriados_moveis_2026() -> None:
    moveis = feriados.feriados_moveis(2026)
    assert date(2026, 2, 16) in moveis  # carnaval (segunda)
    assert date(2026, 2, 17) in moveis  # carnaval (terca)
    assert date(2026, 4, 3) in moveis  # sexta-feira santa
    assert date(2026, 6, 4) in moveis  # corpus christi
    assert len(moveis) == 4
    for data in moveis:
        assert feriados.eh_feriado(data)


def test_dia_util_nao_e_feriado() -> None:
    assert not feriados.eh_feriado(date(2026, 3, 16))
    assert not feriados.eh_feriado(date(2026, 8, 10))


# --- Regras de negocio configuraveis (unidade) ---

def test_regras_retornam_valores_padrao() -> None:
    assert regras.horas_por_alocacao() == 3
    assert regras.limite_anual_carga_horas() == 300
    assert regras.limite_anual_carga_alocacoes() == 100


def test_regras_espelham_config() -> None:
    settings = get_settings()
    assert regras.horas_por_alocacao() == settings.horas_por_alocacao
    assert regras.limite_anual_carga_horas() == settings.limite_anual_carga_horas
    assert regras.limite_anual_carga_alocacoes() == settings.limite_anual_carga_alocacoes
