from datetime import date, timedelta


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


def _criar_atribuicao(
    client,
    professor_id: int,
    turma_id: int,
    uc_id: int,
    data_inicio: str = "2026-01-01",
    data_fim: str = "2027-12-31",
    professor_substituto_id: int | None = None,
) -> dict:
    response = client.post(
        "/atribuicoes",
        json={
            "professor_id": professor_id,
            "turma_id": turma_id,
            "uc_id": uc_id,
            "data_inicio": data_inicio,
            "data_fim": data_fim,
            "professor_substituto_id": professor_substituto_id,
            "justificativa_retroativa": "Atribuicao de teste abrangente",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def _criar_alocacao(
    client,
    turma_id: int,
    professor_titular_id: int,
    data: str = "2026-03-16",
    turno: str = "manha",
    professor_substituto_id: int | None = None,
    liberar_fim_de_semana: bool = False,
    override: bool = False,
    justificativa_override: str | None = None,
):
    payload = {
        "turma_id": turma_id,
        "data": data,
        "turno": turno,
        "professor_titular_id": professor_titular_id,
        "professor_substituto_id": professor_substituto_id,
        "liberar_fim_de_semana": liberar_fim_de_semana,
        "override": override,
        "justificativa_override": justificativa_override,
    }
    return client.post("/alocacoes", json=payload)


def _datas_letivas(ano: int, quantidade: int, inicio: str) -> list[str]:
    atual = date.fromisoformat(inicio)
    datas: list[str] = []
    feriados_fixos = {
        (1, 1),
        (4, 21),
        (5, 1),
        (9, 7),
        (10, 12),
        (11, 2),
        (11, 15),
        (11, 20),
        (12, 25),
    }
    sexta_santa = _sexta_feira_santa(ano)

    while len(datas) < quantidade:
        if atual.weekday() < 5 and (atual.month, atual.day) not in feriados_fixos and atual != sexta_santa:
            datas.append(atual.isoformat())
        atual += timedelta(days=1)

    return datas


def _sexta_feira_santa(ano: int) -> date:
    a = ano % 19
    b = ano // 100
    c = ano % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    mes = (h + l - 7 * m + 114) // 31
    dia = ((h + l - 7 * m + 114) % 31) + 1
    pascoa = date(ano, mes, dia)
    return pascoa - timedelta(days=2)


def test_ca_01_duplicidade_de_alocacao_bloqueada(client) -> None:
    uc = _criar_uc(client, "UC5")
    titular = _criar_professor(client, "Maria")
    turma = _criar_turma(client, "7074D", uc["id"])
    _criar_alocacao(client, turma["id"], titular["id"])

    response = _criar_alocacao(client, turma["id"], titular["id"])

    assert response.status_code == 409
    assert response.json()["detail"] == "Ja existe uma alocacao para a turma 7074D na data 16/03/2026 no turno manha."


def test_ca_02_override_justificado_persiste_com_forcada(client) -> None:
    uc = _criar_uc(client, "UC5")
    titular = _criar_professor(client, "Maria")
    turma = _criar_turma(client, "7074D", uc["id"])
    _criar_alocacao(client, turma["id"], titular["id"])

    response = _criar_alocacao(
        client,
        turma["id"],
        titular["id"],
        override=True,
        justificativa_override="Cobertura emergencial",
    )

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["forcada"] is True
    assert body["justificativa_override"] == "Cobertura emergencial"


def test_ca_03_justificativa_invalida_no_override(client) -> None:
    uc = _criar_uc(client, "UC5")
    titular = _criar_professor(client, "Maria")
    turma = _criar_turma(client, "7074D", uc["id"])

    response = _criar_alocacao(
        client,
        turma["id"],
        titular["id"],
        override=True,
        justificativa_override="curta",
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Informe uma justificativa com pelo menos 10 caracteres."


def test_ca_04_conflito_de_professor(client) -> None:
    uc = _criar_uc(client, "UC1")
    titular = _criar_professor(client, "Maria")
    turma_a = _criar_turma(client, "7073", uc["id"], turno_padrao="tarde")
    turma_b = _criar_turma(client, "7074", uc["id"], turno_padrao="tarde")
    _criar_alocacao(client, turma_a["id"], titular["id"], turno="tarde")

    response = _criar_alocacao(client, turma_b["id"], titular["id"], turno="tarde")

    assert response.status_code == 409
    assert response.json()["detail"] == "A professora Maria ja esta alocada na turma 7073 no turno tarde na data 16/03/2026."


def test_ca_05_titular_igual_a_substituto(client) -> None:
    uc = _criar_uc(client, "UC1")
    titular = _criar_professor(client, "Maria")
    turma = _criar_turma(client, "7073", uc["id"])

    response = _criar_alocacao(
        client,
        turma["id"],
        titular["id"],
        professor_substituto_id=titular["id"],
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "O professor substituto deve ser diferente do professor titular."


def test_ca_06_turno_invalido(client) -> None:
    uc = _criar_uc(client, "UC1")
    titular = _criar_professor(client, "Maria")
    turma = _criar_turma(client, "7073", uc["id"])

    response = _criar_alocacao(client, turma["id"], titular["id"], turno="madrugada")

    assert response.status_code == 422


def test_ca_07_consulta_por_turno_ordenada(client) -> None:
    uc = _criar_uc(client, "UC1")
    maria = _criar_professor(client, "Maria")
    joao = _criar_professor(client, "Joao")
    turma_a = _criar_turma(client, "7073", uc["id"], turno_padrao="tarde")
    turma_b = _criar_turma(client, "7074", uc["id"], turno_padrao="tarde")
    _criar_alocacao(client, turma_b["id"], joao["id"], data="2026-03-20", turno="tarde")
    _criar_alocacao(client, turma_a["id"], maria["id"], data="2026-03-16", turno="tarde")

    response = client.get("/alocacoes", params={"turno": "tarde"})

    assert response.status_code == 200
    body = response.json()
    assert [item["data"] for item in body] == ["2026-03-16", "2026-03-20"]
    assert body[0]["turma_codigo"] == "7073"
    assert body[0]["uc_codigo"] == "UC1"
    assert body[0]["professor_titular_nome"] == "Maria"


def test_ca_07b_consulta_por_turma_e_periodo_retorna_lacunas_explicitas(client) -> None:
    uc = _criar_uc(client, "UCTURMA")
    titular = _criar_professor(client, "Juarez Bamberg da Silva")
    turma = _criar_turma(client, "670007074D", uc["id"], turno_padrao="manha")
    _criar_alocacao(client, turma["id"], titular["id"], data="2026-09-01", turno="manha")
    _criar_alocacao(client, turma["id"], titular["id"], data="2026-09-03", turno="manha")

    response = client.get(
        "/alocacoes/turma-periodo",
        params={
            "turma_id": turma["id"],
            "data_inicial": "2026-09-01",
            "data_final": "2026-09-03",
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert [item["data"] for item in body] == ["2026-09-01", "2026-09-02", "2026-09-03"]
    assert [item["turno"] for item in body] == ["manha", "manha", "manha"]
    assert body[0]["uc_codigo"] == "UCTURMA"
    assert body[0]["professor_titular_nome"] == "Juarez Bamberg da Silva"
    assert body[0]["situacao"] == "Confirmada"
    assert body[1]["professor_titular_nome"] is None
    assert body[1]["professor_substituto_nome"] is None
    assert body[1]["situacao"] == "Sem professor definido"


def test_ca_07c_consulta_por_turma_e_periodo_aceita_turno_opcional(client) -> None:
    uc = _criar_uc(client, "UCTURMAT")
    titular = _criar_professor(client, "Maria Oliveira")
    turma = _criar_turma(client, "8800T", uc["id"], turno_padrao="manha")
    _criar_alocacao(client, turma["id"], titular["id"], data="2026-09-02", turno="tarde")

    response = client.get(
        "/alocacoes/turma-periodo",
        params={
            "turma_id": turma["id"],
            "data_inicial": "2026-09-02",
            "data_final": "2026-09-02",
            "turno": "tarde",
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body) == 1
    assert body[0]["turno"] == "tarde"
    assert body[0]["professor_titular_nome"] == "Maria Oliveira"
    assert body[0]["situacao"] == "Confirmada"


def test_ca_07d_consulta_por_turma_e_periodo_diferencia_dia_nao_letivo(client) -> None:
    uc = _criar_uc(client, "UCFER")
    titular = _criar_professor(client, "Carlos Souza")
    turma = _criar_turma(client, "9900F", uc["id"], turno_padrao="manha")
    _criar_alocacao(client, turma["id"], titular["id"], data="2026-09-04", turno="manha")

    response = client.get(
        "/alocacoes/turma-periodo",
        params={
            "turma_id": turma["id"],
            "data_inicial": "2026-09-04",
            "data_final": "2026-09-07",
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert [item["situacao"] for item in body] == [
        "Confirmada",
        "Dia nao letivo",
        "Dia nao letivo",
        "Dia nao letivo",
    ]


def test_ca_08_exclusao_e_integridade_referencial(client) -> None:
    uc = _criar_uc(client, "UC1")
    titular = _criar_professor(client, "Maria")
    turma = _criar_turma(client, "7073", uc["id"])
    alocacao = _criar_alocacao(client, turma["id"], titular["id"]).json()

    sem_confirmacao = client.delete(f"/alocacoes/{alocacao['id']}")
    assert sem_confirmacao.status_code == 400

    professor_em_uso = client.delete(f"/professores/{titular['id']}")
    turma_em_uso = client.delete(f"/turmas/{turma['id']}")
    uc_em_uso = client.delete(f"/ucs/{uc['id']}")

    assert professor_em_uso.status_code == 409
    assert turma_em_uso.status_code == 409
    assert uc_em_uso.status_code == 409

    com_confirmacao = client.delete(f"/alocacoes/{alocacao['id']}", params={"confirmar": True})
    assert com_confirmacao.status_code == 204


def test_ca_08b_remocao_em_lote_com_preview_e_confirmacao(client) -> None:
    uc = _criar_uc(client, "UC1")
    titular_a = _criar_professor(client, "Maria")
    titular_b = _criar_professor(client, "Joao")
    turma_a = _criar_turma(client, "7073", uc["id"])
    turma_b = _criar_turma(client, "7074", uc["id"])
    alocacao_a = _criar_alocacao(client, turma_a["id"], titular_a["id"]).json()
    alocacao_b = _criar_alocacao(client, turma_b["id"], titular_b["id"], data="2026-03-17").json()

    preview = client.post(
        "/alocacoes/remocao-lote",
        json={"alocacao_ids": [alocacao_a["id"], alocacao_b["id"], 9999], "confirmar": False},
    )

    assert preview.status_code == 200, preview.text
    body = preview.json()
    assert body["total_solicitado"] == 3
    assert body["total_removivel"] == 2
    assert body["total_removido"] == 0
    assert body["ids_inexistentes"] == [9999]
    assert body["requer_confirmacao"] is True

    confirmacao = client.post(
        "/alocacoes/remocao-lote",
        json={"alocacao_ids": [alocacao_a["id"], alocacao_b["id"], 9999], "confirmar": True},
    )

    assert confirmacao.status_code == 200, confirmacao.text
    body = confirmacao.json()
    assert body["total_removido"] == 2
    assert body["ids_inexistentes"] == [9999]
    assert body["requer_confirmacao"] is False

    restantes = client.get("/alocacoes", params={"turno": "manha"})
    assert restantes.status_code == 200
    assert restantes.json() == []


def test_ca_08c_cadastro_recorrente_com_preview_e_confirmacao(client) -> None:
    uc = _criar_uc(client, "UCREC")
    titular = _criar_professor(client, "Fernanda")
    turma = _criar_turma(client, "9001", uc["id"])

    preview = client.post(
        "/alocacoes/recorrente",
        json={
            "turma_id": turma["id"],
            "data_inicial": "2026-03-16",
            "data_final": "2026-03-20",
            "turnos": ["manha"],
            "dias_da_semana": [0, 2],
            "professor_titular_id": titular["id"],
            "professor_substituto_id": None,
            "override": False,
            "justificativa_override": None,
            "confirmar": False,
        },
    )

    assert preview.status_code == 200, preview.text
    body = preview.json()
    assert body["total_previsto"] == 2
    assert body["total_validos"] == 2
    assert body["total_bloqueados"] == 0
    assert body["total_criados"] == 0
    assert body["requer_confirmacao"] is True

    confirmacao = client.post(
        "/alocacoes/recorrente",
        json={
            "turma_id": turma["id"],
            "data_inicial": "2026-03-16",
            "data_final": "2026-03-20",
            "turnos": ["manha"],
            "dias_da_semana": [0, 2],
            "professor_titular_id": titular["id"],
            "professor_substituto_id": None,
            "override": False,
            "justificativa_override": None,
            "confirmar": True,
        },
    )

    assert confirmacao.status_code == 200, confirmacao.text
    body = confirmacao.json()
    assert body["total_criados"] == 2
    assert [item["data"] for item in body["itens_criados"]] == ["2026-03-16", "2026-03-18"]


def test_ca_08d_cadastro_recorrente_sinaliza_itens_bloqueados(client) -> None:
    uc = _criar_uc(client, "UCBLOQ")
    titular = _criar_professor(client, "Marcia")
    turma = _criar_turma(client, "9002", uc["id"])
    _criar_alocacao(client, turma["id"], titular["id"], data="2026-03-16", turno="manha")

    preview = client.post(
        "/alocacoes/recorrente",
        json={
            "turma_id": turma["id"],
            "data_inicial": "2026-03-16",
            "data_final": "2026-03-16",
            "turnos": ["manha"],
            "dias_da_semana": [0],
            "professor_titular_id": titular["id"],
            "professor_substituto_id": None,
            "override": False,
            "justificativa_override": None,
            "confirmar": False,
        },
    )

    assert preview.status_code == 200, preview.text
    body = preview.json()
    assert body["total_previsto"] == 1
    assert body["total_validos"] == 0
    assert body["total_bloqueados"] == 1
    assert body["itens_bloqueados"][0]["motivo"] == "Ja existe uma alocacao para a turma 9002 na data 16/03/2026 no turno manha."


def test_ca_09_limite_pf(client) -> None:
    uc = _criar_uc(client, "UC300", carga_horaria=300)
    professor_pf = _criar_professor(client, "Carlos", contratacao="PF")
    professor_clt = _criar_professor(client, "Ana", contratacao="CLT")
    turma_a = _criar_turma(client, "7073", uc["id"])
    turma_b = _criar_turma(client, "7074", uc["id"])
    turma_c = _criar_turma(client, "7075", uc["id"])

    _criar_atribuicao(client, professor_pf["id"], turma_a["id"], uc["id"])
    _criar_atribuicao(client, professor_pf["id"], turma_b["id"], uc["id"])
    _criar_atribuicao(client, professor_clt["id"], turma_c["id"], uc["id"])

    for data in _datas_letivas(2026, 100, "2026-03-10"):
        resposta = _criar_alocacao(client, turma_a["id"], professor_pf["id"], data=data)
        assert resposta.status_code == 201, resposta.text

    bloqueada = _criar_alocacao(client, turma_b["id"], professor_pf["id"], data="2026-12-31")
    assert bloqueada.status_code == 409
    assert bloqueada.json()["detail"] == "Carga horaria maxima anual de 300 horas atingida para o professor Carlos."

    liberada = _criar_alocacao(client, turma_c["id"], professor_clt["id"], data="2026-12-30")
    assert liberada.status_code == 201, liberada.text


def test_ca_09c_bloqueia_cadastro_unitario_em_sabado_domingo_e_feriado(client) -> None:
    uc = _criar_uc(client, "UCNLET")
    titular = _criar_professor(client, "Bianca")
    turma = _criar_turma(client, "7711L", uc["id"])

    sabado = _criar_alocacao(client, turma["id"], titular["id"], data="2026-03-14")
    domingo = _criar_alocacao(client, turma["id"], titular["id"], data="2026-03-15")
    feriado = _criar_alocacao(client, turma["id"], titular["id"], data="2026-09-07")

    assert sabado.status_code == 400
    assert (
        sabado.json()["detail"]
        == "Nao e possivel criar alocacao em 14/03/2026 sem liberar o fim de semana para atividade extracurricular."
    )
    assert domingo.status_code == 400
    assert (
        domingo.json()["detail"]
        == "Nao e possivel criar alocacao em 15/03/2026 sem liberar o fim de semana para atividade extracurricular."
    )
    assert feriado.status_code == 400
    assert feriado.json()["detail"] == "Nao e possivel criar alocacao em 07/09/2026 porque a data nao e letiva."


def test_ca_09e_permita_cadastro_em_fim_de_semana_quando_houver_liberacao(client) -> None:
    uc = _criar_uc(client, "UCEXTRA")
    titular = _criar_professor(client, "Juarez")
    turma = _criar_turma(client, "EXTRA7074", uc["id"])

    response = _criar_alocacao(
        client,
        turma["id"],
        titular["id"],
        data="2026-03-14",
        liberar_fim_de_semana=True,
    )

    assert response.status_code == 201, response.text
    assert response.json()["turma_codigo"] == "EXTRA7074"


def test_ca_09d_lote_recorrente_bloqueia_dias_nao_letivos(client) -> None:
    uc = _criar_uc(client, "UCRECFER")
    titular = _criar_professor(client, "Denise")
    turma = _criar_turma(client, "6611R", uc["id"])

    preview = client.post(
        "/alocacoes/recorrente",
        json={
            "turma_id": turma["id"],
            "data_inicial": "2026-09-05",
            "data_final": "2026-09-07",
            "turnos": ["manha"],
            "dias_da_semana": [5, 6, 0],
            "professor_titular_id": titular["id"],
            "professor_substituto_id": None,
            "override": False,
            "justificativa_override": None,
            "confirmar": False,
        },
    )

    assert preview.status_code == 200, preview.text
    body = preview.json()
    assert body["total_previsto"] == 3
    assert body["total_validos"] == 0
    assert body["total_bloqueados"] == 3
    assert [item["motivo"] for item in body["itens_bloqueados"]] == [
        "Nao e possivel criar alocacao em 05/09/2026 sem liberar o fim de semana para atividade extracurricular.",
        "Nao e possivel criar alocacao em 06/09/2026 sem liberar o fim de semana para atividade extracurricular.",
        "Nao e possivel criar alocacao em 07/09/2026 porque a data nao e letiva.",
    ]


def test_ca_09b_lote_recorrente_pf_considera_tres_horas_por_alocacao(client) -> None:
    uc = _criar_uc(client, "UCPFREC", carga_horaria=120)
    professor_pf = _criar_professor(client, "Juarez Bamberg da Silva", contratacao="PF")
    turma = _criar_turma(client, "670007074D", uc["id"])

    for data in _datas_letivas(2026, 99, "2026-01-02"):
        resposta = _criar_alocacao(client, turma["id"], professor_pf["id"], data=data)
        assert resposta.status_code == 201, resposta.text

    preview = client.post(
        "/alocacoes/recorrente",
        json={
            "turma_id": turma["id"],
            "data_inicial": "2026-08-11",
            "data_final": "2026-08-13",
            "turnos": ["manha"],
            "dias_da_semana": [1, 2, 3],
            "professor_titular_id": professor_pf["id"],
            "professor_substituto_id": None,
            "override": False,
            "justificativa_override": None,
            "confirmar": False,
        },
    )

    assert preview.status_code == 200, preview.text
    body = preview.json()
    assert body["total_previsto"] == 3
    assert body["total_validos"] == 1
    assert body["total_bloqueados"] == 2
    assert [item["data"] for item in body["itens_validos"]] == ["2026-08-11"]
    assert [item["data"] for item in body["itens_bloqueados"]] == ["2026-08-12", "2026-08-13"]
    assert all(
        item["motivo"] == "Carga horaria maxima anual de 300 horas atingida para o professor Juarez Bamberg da Silva."
        for item in body["itens_bloqueados"]
    )


def test_calendario_retorna_cores_verde_vermelho_amarelo_e_roxo(client) -> None:
    uc = _criar_uc(client, "UC1", carga_horaria=40)
    maria = _criar_professor(client, "Maria")
    joao = _criar_professor(client, "Joao")
    clara = _criar_professor(client, "Clara")
    turma_verde = _criar_turma(client, "7001", uc["id"])
    turma_vermelha_a = _criar_turma(client, "7002", uc["id"])
    turma_vermelha_b = _criar_turma(client, "7003", uc["id"])
    turma_roxa = _criar_turma(client, "7004", uc["id"])
    turma_amarela = _criar_turma(client, "7005", uc["id"])

    assert _criar_alocacao(client, turma_verde["id"], joao["id"], data="2026-03-16").status_code == 201
    assert _criar_alocacao(client, turma_vermelha_a["id"], maria["id"], data="2026-03-17").status_code == 201
    assert _criar_alocacao(
        client,
        turma_vermelha_b["id"],
        maria["id"],
        data="2026-03-17",
        override=True,
        justificativa_override="Choque autorizado pela coordenacao",
    ).status_code == 201
    assert _criar_alocacao(
        client,
        turma_roxa["id"],
        clara["id"],
        data="2026-03-18",
        professor_substituto_id=joao["id"],
    ).status_code == 201

    response = client.get(
        "/alocacoes/calendario",
        params=[("turno", "manha"), ("datas", "2026-03-16"), ("datas", "2026-03-17"), ("datas", "2026-03-18")],
    )

    assert response.status_code == 200, response.text
    body = response.json()
    status_por_slot = {(item["turma_codigo"], item["data"]): item["status_visual"] for item in body}
    assert status_por_slot[("7001", "2026-03-16")] == "VERDE"
    assert status_por_slot[("7002", "2026-03-17")] == "VERMELHO"
    assert status_por_slot[("7003", "2026-03-17")] == "VERMELHO"
    assert status_por_slot[("7004", "2026-03-18")] == "ROXO"
    assert ("7005", "2026-03-16") not in status_por_slot


def test_calendario_nao_antecipa_fins_de_semana_antes_da_primeira_alocacao_da_turma(client) -> None:
    uc = _criar_uc(client, "UC6")
    titular = _criar_professor(client, "Juarez")
    turma = _criar_turma(client, "670007074E", uc["id"])
    _criar_atribuicao(client, titular["id"], turma["id"], uc["id"])

    assert _criar_alocacao(client, turma["id"], titular["id"], data="2026-09-25").status_code == 201
    assert _criar_alocacao(client, turma["id"], titular["id"], data="2026-09-28", liberar_fim_de_semana=False).status_code == 201

    response = client.get(
        "/alocacoes/calendario",
        params=[
            ("turno", "manha"),
            ("datas", "2026-09-15"),
            ("datas", "2026-09-26"),
            ("datas", "2026-09-27"),
            ("datas", "2026-09-28"),
        ],
    )

    assert response.status_code == 200, response.text
    body = [item for item in response.json() if item["turma_codigo"] == "670007074E"]
    assert [item["data"] for item in body] == ["2026-09-25", "2026-09-26", "2026-09-27", "2026-09-28"]


def test_carga_professores_agrega_titular_substituto_e_turnos(client) -> None:
    uc = _criar_uc(client, "UC-CARGA")
    titular = _criar_professor(client, "Ana Carga")
    substituto = _criar_professor(client, "Bruno Carga")
    turma_manha = _criar_turma(client, "CARGA-M", uc["id"], turno_padrao="manha")
    turma_noite = _criar_turma(client, "CARGA-N", uc["id"], turno_padrao="noite")

    _criar_alocacao(
        client,
        turma_manha["id"],
        titular["id"],
        data="2026-03-17",
        turno="manha",
        professor_substituto_id=substituto["id"],
    )
    _criar_alocacao(
        client,
        turma_noite["id"],
        titular["id"],
        data="2026-03-18",
        turno="noite",
    )

    response = client.get("/professores/carga")

    assert response.status_code == 200
    por_nome = {item["professor_nome"]: item for item in response.json()}
    assert por_nome["Ana Carga"] == {
        "professor_id": titular["id"],
        "professor_nome": "Ana Carga",
        "horas": 6,
        "alocacoes": 2,
        "manha": 3,
        "tarde": 0,
        "noite": 3,
    }
    assert por_nome["Bruno Carga"]["horas"] == 3
    assert por_nome["Bruno Carga"]["alocacoes"] == 1
    assert por_nome["Bruno Carga"]["manha"] == 3


def test_carga_professores_inclui_professor_sem_alocacao(client) -> None:
    _criar_professor(client, "Professor Sem Carga")

    response = client.get("/professores/carga")

    assert response.status_code == 200
    assert response.json() == [
        {
            "professor_id": 1,
            "professor_nome": "Professor Sem Carga",
            "horas": 0,
            "alocacoes": 0,
            "manha": 0,
            "tarde": 0,
            "noite": 0,
        }
    ]


def test_carga_professores_retorna_lista_vazia_sem_professores(client) -> None:
    response = client.get("/professores/carga")

    assert response.status_code == 200
    assert response.json() == []
