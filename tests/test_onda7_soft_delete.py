"""Testes da Onda 7 fatia 1: soft delete em professores, UCs e turmas."""

from tests.test_escalas_api import _criar_atribuicao, _criar_professor, _criar_turma, _criar_uc


def test_listar_professores_por_padrao_exclui_inativos(client) -> None:
    _criar_professor(client, "Maria Ativa")
    _criar_professor(client, "Joao Inativo")

    todos = client.get("/professores?incluir_inativos=true").json()
    inativo = next(p for p in todos if p["nome"] == "Joao Inativo")
    desativar = client.patch(f"/professores/{inativo['id']}", json={"ativo": False})
    assert desativar.status_code == 200

    ativos = client.get("/professores").json()
    nomes_ativos = [p["nome"] for p in ativos]
    assert "Maria Ativa" in nomes_ativos
    assert "Joao Inativo" not in nomes_ativos

    com_inativos = client.get("/professores?incluir_inativos=true").json()
    nomes_todos = [p["nome"] for p in com_inativos]
    assert "Joao Inativo" in nomes_todos
    item_inativo = next(p for p in com_inativos if p["nome"] == "Joao Inativo")
    assert item_inativo["ativo"] is False


def test_patch_professor_desativa_e_reativa(client) -> None:
    professor = _criar_professor(client, "Ciclo Vida")

    desativado = client.patch(f"/professores/{professor['id']}", json={"ativo": False})
    assert desativado.status_code == 200, desativado.text
    assert desativado.json()["ativo"] is False

    assert client.get("/professores").json() == []

    reativado = client.patch(f"/professores/{professor['id']}", json={"ativo": True})
    assert reativado.status_code == 200
    assert reativado.json()["ativo"] is True
    assert [p["nome"] for p in client.get("/professores").json()] == ["Ciclo Vida"]


def test_patch_uc_e_turma_aceitam_ativo(client) -> None:
    uc = _criar_uc(client, "UCSD")
    turma = _criar_turma(client, "SD1", uc["id"])

    uc_desativada = client.patch(f"/ucs/{uc['id']}", json={"ativo": False})
    assert uc_desativada.status_code == 200
    assert uc_desativada.json()["ativo"] is False
    assert client.get("/ucs").json() == []
    assert len(client.get("/ucs?incluir_inativos=true").json()) == 1

    turma_desativada = client.patch(f"/turmas/{turma['id']}", json={"ativo": False})
    assert turma_desativada.status_code == 200
    assert turma_desativada.json()["ativo"] is False
    assert client.get("/turmas").json() == []


def test_desativar_nao_quebra_vinculos_nem_historico(client) -> None:
    """Criterio de aceite: desativar preserva historico de alocacoes."""
    professor = _criar_professor(client, "Historico Preservado")
    uc = _criar_uc(client, "UCHIST")
    turma = _criar_turma(client, "HIST1", uc["id"])
    _criar_atribuicao(client, professor["id"], turma["id"], uc["id"])

    # Alocacao historica (data passada nao exige atribuicao ativa)
    alocacao = client.post(
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
    assert alocacao.status_code == 201, alocacao.text

    desativado = client.patch(f"/professores/{professor['id']}", json={"ativo": False})
    assert desativado.status_code == 200

    # Historico continua exibindo o professor desativado
    consulta = client.get("/alocacoes?turno=manha")
    assert consulta.status_code == 200
    nomes = [a["professor_titular_nome"] for a in consulta.json()]
    assert "Historico Preservado" in nomes

    # Carga realizada continua considerando alocacoes do professor inativo
    carga = client.get("/professores/carga").json()
    item = next(c for c in carga if c["professor_id"] == professor["id"])
    assert item["alocacoes"] == 1
    assert item["horas"] == 3


def test_criar_professor_retorna_ativo_true(client) -> None:
    professor = _criar_professor(client, "Novo Ativo")
    assert professor["ativo"] is True
