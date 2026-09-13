from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy import Select, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models import Alocacao, Atribuicao, Contratacao, Professor, Turma, Turno
from app.schemas.alocacao import (
    AlocacaoBulkCreateItem,
    AlocacaoBulkCreateRequest,
    AlocacaoBulkCreateResponse,
    AlocacaoBulkDeleteItem,
    AlocacaoBulkDeleteRequest,
    AlocacaoBulkDeleteResponse,
    AlocacaoCreate,
    AlocacaoRead,
    AlocacaoTurmaPeriodoItem,
    AlocacaoUpdate,
    CalendarioItem,
)
from app.services.errors import ConflitoDeNegocioError, EntidadeNaoEncontradaError, ValidacaoDeNegocioError

HORAS_POR_ALOCACAO = 3
FERIADOS_NACIONAIS_FIXOS = {
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


def validar_turno(turno: str) -> Turno:
    try:
        return Turno(turno)
    except ValueError as exc:
        raise ValidacaoDeNegocioError("Turno invalido. Informe manha, tarde ou noite.") from exc


def validar_override(payload: AlocacaoCreate) -> None:
    if payload.professor_substituto_id == payload.professor_titular_id:
        raise ValidacaoDeNegocioError("O professor substituto deve ser diferente do professor titular.")

    if not payload.override:
        return

    justificativa = (payload.justificativa_override or "").strip()
    if len(justificativa) < 10:
        raise ValidacaoDeNegocioError("Informe uma justificativa com pelo menos 10 caracteres.")


def validar_payload_lote(payload: AlocacaoBulkCreateRequest) -> list[Turno]:
    if payload.data_final < payload.data_inicial:
        raise ValidacaoDeNegocioError("A data final do lote deve ser igual ou posterior a data inicial.")
    if not payload.turnos:
        raise ValidacaoDeNegocioError("Selecione pelo menos um turno para o lote recorrente.")
    if not payload.dias_da_semana:
        raise ValidacaoDeNegocioError("Selecione pelo menos um dia da semana para o lote recorrente.")

    dias_invalidos = [dia for dia in payload.dias_da_semana if dia < 0 or dia > 6]
    if dias_invalidos:
        raise ValidacaoDeNegocioError("Informe dias da semana validos entre 0 e 6.")

    alocacao_equivalente = AlocacaoCreate(
        turma_id=payload.turma_id,
        data=payload.data_inicial,
        turno=payload.turnos[0],
        professor_titular_id=payload.professor_titular_id,
        professor_substituto_id=payload.professor_substituto_id,
        override=payload.override,
        justificativa_override=payload.justificativa_override,
    )
    validar_override(alocacao_equivalente)

    return [validar_turno(turno) for turno in payload.turnos]


def listar_alocacoes_por_turno(db: Session, turno: str) -> list[AlocacaoRead]:
    turno_validado = validar_turno(turno)
    query = _base_query().where(Alocacao.turno == turno_validado).order_by(Alocacao.data.asc(), Alocacao.id.asc())
    itens = [_to_read_model(alocacao) for alocacao in db.scalars(query).all()]
    return sorted(itens, key=lambda item: (item.data, item.turma_codigo))


def listar_calendario_por_turno(db: Session, turno: str, datas: list[date]) -> list[CalendarioItem]:
    turno_validado = validar_turno(turno)
    alocacoes = db.scalars(
        _base_query().where(Alocacao.turno == turno_validado).order_by(Alocacao.data.asc(), Alocacao.id.asc())
    ).all()

    conflitos = _mapa_de_professores_em_conflito(alocacoes)
    itens: list[CalendarioItem] = []

    for alocacao in alocacoes:
        itens.append(
            CalendarioItem(
                turma_id=alocacao.turma_id,
                turma_codigo=alocacao.turma.codigo,
                uc_id=alocacao.turma.unidade_curricular.id,
                uc_codigo=alocacao.turma.unidade_curricular.codigo,
                uc_nome=alocacao.turma.unidade_curricular.nome,
                data=alocacao.data,
                turno=alocacao.turno.value,
                professor_titular_nome=alocacao.professor_titular.nome,
                professor_substituto_nome=alocacao.professor_substituto.nome if alocacao.professor_substituto else None,
                status_visual=_status_visual(alocacao, conflitos),
            )
        )

    if datas:
        turmas = db.scalars(
            select(Turma)
            .options(joinedload(Turma.unidade_curricular))
            .where(Turma.turno_padrao == turno_validado)
            .order_by(Turma.codigo.asc())
        ).all()
        slots_existentes = {(alocacao.turma_id, alocacao.data) for alocacao in alocacoes}
        limites_por_turma: dict[int, tuple[date, date]] = {}

        for alocacao in alocacoes:
            atual = limites_por_turma.get(alocacao.turma_id)
            if atual is None:
                limites_por_turma[alocacao.turma_id] = (alocacao.data, alocacao.data)
                continue

            data_inicial, data_final = atual
            limites_por_turma[alocacao.turma_id] = (min(data_inicial, alocacao.data), max(data_final, alocacao.data))

        for data_item in sorted(datas):
            for turma in turmas:
                limites = limites_por_turma.get(turma.id)
                if not limites:
                    continue
                data_inicial, data_final = limites
                if data_item < data_inicial or data_item > data_final or data_item.weekday() < 5:
                    continue
                if (turma.id, data_item) in slots_existentes:
                    continue
                itens.append(
                    CalendarioItem(
                        turma_id=turma.id,
                        turma_codigo=turma.codigo,
                        uc_id=turma.unidade_curricular.id,
                        uc_codigo=turma.unidade_curricular.codigo,
                        uc_nome=turma.unidade_curricular.nome,
                        data=data_item,
                        turno=turno_validado.value,
                        status_visual="AMARELO",
                    )
                )

    return sorted(itens, key=lambda item: (item.data, item.turma_codigo))


def listar_alocacoes_por_turma_e_periodo(
    db: Session,
    turma_id: int,
    data_inicial: date,
    data_final: date,
    turno: str | None,
) -> list[AlocacaoTurmaPeriodoItem]:
    if data_final < data_inicial:
        raise ValidacaoDeNegocioError("A data final deve ser igual ou posterior a data inicial.")

    turma = db.get(Turma, turma_id)
    if not turma:
        raise EntidadeNaoEncontradaError("Turma nao encontrada.")

    turno_consulta = validar_turno(turno) if turno else turma.turno_padrao
    alocacoes = db.scalars(
        _base_query()
        .where(
            Alocacao.turma_id == turma_id,
            Alocacao.turno == turno_consulta,
            Alocacao.data >= data_inicial,
            Alocacao.data <= data_final,
        )
        .order_by(Alocacao.data.asc(), Alocacao.id.asc())
    ).all()

    alocacoes_por_data = {alocacao.data: alocacao for alocacao in alocacoes}
    itens: list[AlocacaoTurmaPeriodoItem] = []
    data_corrente = data_inicial

    while data_corrente <= data_final:
        alocacao = alocacoes_por_data.get(data_corrente)
        if alocacao:
            itens.append(
                AlocacaoTurmaPeriodoItem(
                    data=data_corrente,
                    turno=turno_consulta.value,
                    turma_id=turma.id,
                    turma_codigo=turma.codigo,
                    uc_id=turma.unidade_curricular.id,
                    uc_codigo=turma.unidade_curricular.codigo,
                    uc_nome=turma.unidade_curricular.nome,
                    professor_titular_nome=alocacao.professor_titular.nome,
                    professor_substituto_nome=alocacao.professor_substituto.nome if alocacao.professor_substituto else None,
                    situacao="Registrada em dia nao letivo" if _eh_data_nao_letiva(data_corrente) else "Confirmada",
                )
            )
        else:
            itens.append(
                AlocacaoTurmaPeriodoItem(
                    data=data_corrente,
                    turno=turno_consulta.value,
                    turma_id=turma.id,
                    turma_codigo=turma.codigo,
                    uc_id=turma.unidade_curricular.id,
                    uc_codigo=turma.unidade_curricular.codigo,
                    uc_nome=turma.unidade_curricular.nome,
                    professor_titular_nome=None,
                    professor_substituto_nome=None,
                    situacao="Dia nao letivo" if _eh_data_nao_letiva(data_corrente) else "Sem professor definido",
                )
            )
        data_corrente += timedelta(days=1)

    return itens


def criar_alocacao(db: Session, payload: AlocacaoCreate) -> AlocacaoRead:
    turno_validado, _, _, _ = _validar_dependencias_da_alocacao(db, payload)

    alocacao = Alocacao(
        turma_id=payload.turma_id,
        data=payload.data,
        turno=turno_validado,
        professor_titular_id=payload.professor_titular_id,
        professor_substituto_id=payload.professor_substituto_id,
        forcada=payload.override,
        justificativa_override=(payload.justificativa_override or "").strip() or None,
    )
    db.add(alocacao)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflitoDeNegocioError("Nao foi possivel salvar a alocacao por violacao de integridade.") from exc
    db.refresh(alocacao)
    alocacao = db.scalar(_base_query().where(Alocacao.id == alocacao.id))
    assert alocacao is not None
    return _to_read_model(alocacao)


def excluir_alocacao(db: Session, alocacao_id: int, confirmar: bool) -> None:
    if not confirmar:
        raise ValidacaoDeNegocioError("Confirme a exclusao da alocacao informando confirmar=true.")

    alocacao = db.get(Alocacao, alocacao_id)
    if not alocacao:
        raise EntidadeNaoEncontradaError("Alocacao nao encontrada.")

    db.delete(alocacao)
    db.commit()


def excluir_alocacoes_em_lote(db: Session, payload: AlocacaoBulkDeleteRequest) -> AlocacaoBulkDeleteResponse:
    ids_unicos = list(dict.fromkeys(payload.alocacao_ids))
    if not ids_unicos:
        raise ValidacaoDeNegocioError("Selecione pelo menos uma alocacao para remover em lote.")

    alocacoes = db.scalars(_base_query().where(Alocacao.id.in_(ids_unicos)).order_by(Alocacao.data.asc(), Alocacao.id.asc())).all()
    itens_por_id = {alocacao.id: _to_bulk_delete_item(alocacao) for alocacao in alocacoes}
    itens_removiveis = [itens_por_id[item_id] for item_id in ids_unicos if item_id in itens_por_id]
    ids_inexistentes = [item_id for item_id in ids_unicos if item_id not in itens_por_id]

    if not payload.confirmar:
        return AlocacaoBulkDeleteResponse(
            total_solicitado=len(ids_unicos),
            total_removivel=len(itens_removiveis),
            total_removido=0,
            itens_removiveis=itens_removiveis,
            itens_removidos=[],
            ids_inexistentes=ids_inexistentes,
            requer_confirmacao=True,
        )

    for alocacao in alocacoes:
        db.delete(alocacao)
    db.commit()

    return AlocacaoBulkDeleteResponse(
        total_solicitado=len(ids_unicos),
        total_removivel=len(itens_removiveis),
        total_removido=len(itens_removiveis),
        itens_removiveis=itens_removiveis,
        itens_removidos=itens_removiveis,
        ids_inexistentes=ids_inexistentes,
        requer_confirmacao=False,
    )


def criar_alocacoes_recorrentes(db: Session, payload: AlocacaoBulkCreateRequest) -> AlocacaoBulkCreateResponse:
    validar_payload_lote(payload)

    turma = db.get(Turma, payload.turma_id)
    if not turma:
        raise EntidadeNaoEncontradaError("Turma nao encontrada.")

    professor_titular = db.get(Professor, payload.professor_titular_id)
    if not professor_titular:
        raise EntidadeNaoEncontradaError("Professor titular nao encontrado.")

    professor_substituto = None
    if payload.professor_substituto_id is not None:
        professor_substituto = db.get(Professor, payload.professor_substituto_id)
        if not professor_substituto:
            raise EntidadeNaoEncontradaError("Professor substituto nao encontrado.")

    candidatos = _gerar_candidatos_recorrentes(payload, turma.codigo, professor_titular.nome, professor_substituto.nome if professor_substituto else None)
    itens_validos: list[AlocacaoBulkCreateItem] = []
    itens_bloqueados: list[AlocacaoBulkCreateItem] = []
    criados: list[AlocacaoRead] = []
    carga_simulada_titular: defaultdict[int, int] = defaultdict(int)
    carga_simulada_substituto: defaultdict[int, int] = defaultdict(int)

    for candidato in candidatos:
        alocacao_payload = AlocacaoCreate(
            turma_id=payload.turma_id,
            data=candidato["data"],
            turno=candidato["turno"],
            professor_titular_id=payload.professor_titular_id,
            professor_substituto_id=payload.professor_substituto_id,
            override=payload.override,
            justificativa_override=payload.justificativa_override,
        )
        erro = _validar_candidato_sem_persistir(db, alocacao_payload)
        if not erro:
            erro = _validar_limite_pf_no_lote(db, professor_titular, turma, candidato["data"], carga_simulada_titular)
        if not erro and professor_substituto:
            erro = _validar_limite_pf_no_lote(db, professor_substituto, turma, candidato["data"], carga_simulada_substituto)
        item = AlocacaoBulkCreateItem(
            data=candidato["data"],
            turno=candidato["turno"],
            turma_id=payload.turma_id,
            turma_codigo=turma.codigo,
            uc_id=turma.unidade_curricular.id,
            uc_codigo=turma.unidade_curricular.codigo,
            uc_nome=turma.unidade_curricular.nome,
            professor_titular_nome=professor_titular.nome,
            professor_substituto_nome=professor_substituto.nome if professor_substituto else None,
            status="bloqueado" if erro else "valido",
            motivo=erro,
        )
        if erro:
            itens_bloqueados.append(item)
            continue
        carga_simulada_titular[candidato["data"].year] += HORAS_POR_ALOCACAO
        if professor_substituto:
            carga_simulada_substituto[candidato["data"].year] += HORAS_POR_ALOCACAO
        itens_validos.append(item)

    if payload.confirmar:
        for item in itens_validos:
            created = criar_alocacao(
                db,
                AlocacaoCreate(
                    turma_id=item.turma_id,
                    data=item.data,
                    turno=item.turno,
                    professor_titular_id=payload.professor_titular_id,
                    professor_substituto_id=payload.professor_substituto_id,
                    override=payload.override,
                    justificativa_override=payload.justificativa_override,
                ),
            )
            criados.append(created)

    return AlocacaoBulkCreateResponse(
        total_previsto=len(candidatos),
        total_validos=len(itens_validos),
        total_bloqueados=len(itens_bloqueados),
        total_criados=len(criados),
        itens_validos=itens_validos,
        itens_bloqueados=itens_bloqueados,
        itens_criados=criados,
        requer_confirmacao=not payload.confirmar,
    )


def _base_query() -> Select[tuple[Alocacao]]:
    return select(Alocacao).options(
        joinedload(Alocacao.turma).joinedload(Turma.unidade_curricular),
        joinedload(Alocacao.professor_titular),
        joinedload(Alocacao.professor_substituto),
    )


def _to_read_model(alocacao: Alocacao) -> AlocacaoRead:
    return AlocacaoRead(
        id=alocacao.id,
        turma_id=alocacao.turma_id,
        turma_codigo=alocacao.turma.codigo,
        uc_id=alocacao.turma.unidade_curricular.id,
        uc_codigo=alocacao.turma.unidade_curricular.codigo,
        uc_nome=alocacao.turma.unidade_curricular.nome,
        data=alocacao.data,
        turno=alocacao.turno.value,
        professor_titular_id=alocacao.professor_titular_id,
        professor_titular_nome=alocacao.professor_titular.nome,
        professor_substituto_id=alocacao.professor_substituto_id,
        professor_substituto_nome=alocacao.professor_substituto.nome if alocacao.professor_substituto else None,
        forcada=alocacao.forcada,
        justificativa_override=alocacao.justificativa_override,
    )


def _to_bulk_delete_item(alocacao: Alocacao) -> AlocacaoBulkDeleteItem:
    return AlocacaoBulkDeleteItem(
        id=alocacao.id,
        turma_codigo=alocacao.turma.codigo,
        data=alocacao.data,
        turno=alocacao.turno.value,
        professor_titular_nome=alocacao.professor_titular.nome,
        professor_substituto_nome=alocacao.professor_substituto.nome if alocacao.professor_substituto else None,
    )


def _validar_candidato_sem_persistir(db: Session, payload: AlocacaoCreate) -> str | None:
    try:
        _validar_dependencias_da_alocacao(db, payload)
        return None
    except (ConflitoDeNegocioError, EntidadeNaoEncontradaError, ValidacaoDeNegocioError) as exc:
        return str(exc)


def _validar_dependencias_da_alocacao(db: Session, payload: AlocacaoCreate) -> tuple[Turno, Turma, Professor, Professor | None]:
    validar_override(payload)
    turno_validado = validar_turno(payload.turno)
    _validar_data_letiva(payload.data, payload.liberar_fim_de_semana)

    turma = db.get(Turma, payload.turma_id)
    if not turma:
        raise EntidadeNaoEncontradaError("Turma nao encontrada.")

    professor_titular = db.get(Professor, payload.professor_titular_id)
    if not professor_titular:
        raise EntidadeNaoEncontradaError("Professor titular nao encontrado.")

    professor_substituto = None
    if payload.professor_substituto_id is not None:
        professor_substituto = db.get(Professor, payload.professor_substituto_id)
        if not professor_substituto:
            raise EntidadeNaoEncontradaError("Professor substituto nao encontrado.")

    duplicada = db.scalar(
        select(Alocacao)
        .where(Alocacao.turma_id == payload.turma_id, Alocacao.data == payload.data, Alocacao.turno == turno_validado)
    )
    if duplicada and not payload.override:
        raise ConflitoDeNegocioError(
            f"Ja existe uma alocacao para a turma {turma.codigo} na data {_formatar_data(payload.data)} no turno {turno_validado.value}."
        )

    conflito = _buscar_conflito_de_professor(db, payload, turno_validado)
    if conflito and not payload.override:
        raise ConflitoDeNegocioError(
            f"A professora {conflito['professor_nome']} ja esta alocada na turma {conflito['turma_codigo']} no turno "
            f"{turno_validado.value} na data {_formatar_data(payload.data)}."
        )

    _validar_limite_pf(db, professor_titular, turma, payload.data)
    if professor_substituto:
        _validar_limite_pf(db, professor_substituto, turma, payload.data)

    _validar_atribuicao_para_alocacao_nova(db, payload, turma.uc_id)

    return turno_validado, turma, professor_titular, professor_substituto


def _validar_atribuicao_para_alocacao_nova(db: Session, payload: AlocacaoCreate, uc_id: int) -> None:
    """Onda 6 (RF-02/RF-03): alocação nova exige atribuição ativa na data.

    Alocações com data passada (histórico) não exigem atribuição retroativa,
    conforme ADR-006.
    """
    if payload.data < date.today():
        return

    atribuicao_titular = db.scalar(
        select(Atribuicao).where(
            Atribuicao.professor_id == payload.professor_titular_id,
            Atribuicao.turma_id == payload.turma_id,
            Atribuicao.uc_id == uc_id,
            Atribuicao.data_inicio <= payload.data,
            Atribuicao.data_fim >= payload.data,
        )
    )
    if atribuicao_titular is None:
        raise ValidacaoDeNegocioError(
            "Professor titular sem atribuicao ativa para esta turma/UC na data. "
            "Crie a atribuicao antes de lancar a alocacao."
        )

    if payload.professor_substituto_id is not None:
        atribuicao_substituto = db.scalar(
            select(Atribuicao).where(
                Atribuicao.professor_substituto_id == payload.professor_substituto_id,
                Atribuicao.turma_id == payload.turma_id,
                Atribuicao.uc_id == uc_id,
                Atribuicao.data_inicio <= payload.data,
                Atribuicao.data_fim >= payload.data,
            )
        )
        if atribuicao_substituto is None:
            raise ValidacaoDeNegocioError(
                "Professor substituto sem atribuicao como substituto para esta turma/UC na data."
            )


def _gerar_candidatos_recorrentes(
    payload: AlocacaoBulkCreateRequest,
    turma_codigo: str,
    professor_titular_nome: str,
    professor_substituto_nome: str | None,
) -> list[dict[str, object]]:
    dias_desejados = set(payload.dias_da_semana)
    turnos_unicos = list(dict.fromkeys(payload.turnos))
    candidatos: list[dict[str, object]] = []
    data_corrente = payload.data_inicial

    while data_corrente <= payload.data_final:
        if data_corrente.weekday() in dias_desejados:
            for turno in turnos_unicos:
                candidatos.append(
                    {
                        "data": data_corrente,
                        "turno": turno,
                        "turma_codigo": turma_codigo,
                        "professor_titular_nome": professor_titular_nome,
                        "professor_substituto_nome": professor_substituto_nome,
                    }
                )
        data_corrente += timedelta(days=1)

    return candidatos


def _buscar_conflito_de_professor(db: Session, payload: AlocacaoCreate, turno: Turno) -> dict[str, str] | None:
    professores_ids = [payload.professor_titular_id]
    if payload.professor_substituto_id is not None:
        professores_ids.append(payload.professor_substituto_id)

    conflito = db.scalar(
        _base_query().where(
            Alocacao.data == payload.data,
            Alocacao.turno == turno,
            or_(
                Alocacao.professor_titular_id.in_(professores_ids),
                Alocacao.professor_substituto_id.in_(professores_ids),
            ),
        )
    )
    if not conflito:
        return None

    professor_nome = conflito.professor_titular.nome
    if conflito.professor_titular_id not in professores_ids and conflito.professor_substituto:
        professor_nome = conflito.professor_substituto.nome
    if payload.professor_substituto_id is not None and conflito.professor_substituto_id == payload.professor_substituto_id:
        professor_nome = conflito.professor_substituto.nome if conflito.professor_substituto else professor_nome
    return {"professor_nome": professor_nome, "turma_codigo": conflito.turma.codigo}


def _validar_limite_pf(db: Session, professor: Professor, turma: Turma, data_referencia: date) -> None:
    if professor.contratacao != Contratacao.PF:
        return

    ano_inicio = date(data_referencia.year, 1, 1)
    ano_fim = date(data_referencia.year, 12, 31)
    alocacoes = db.scalars(
        _base_query().where(
            Alocacao.data >= ano_inicio,
            Alocacao.data <= ano_fim,
            or_(
                Alocacao.professor_titular_id == professor.id,
                Alocacao.professor_substituto_id == professor.id,
            ),
        )
    ).all()
    carga_atual = len(alocacoes) * HORAS_POR_ALOCACAO
    carga_resultante = carga_atual + HORAS_POR_ALOCACAO
    if carga_resultante > 300:
        raise ConflitoDeNegocioError(
            f"Carga horaria maxima anual de 300 horas atingida para o professor {professor.nome}."
        )


def _validar_limite_pf_no_lote(
    db: Session,
    professor: Professor,
    turma: Turma,
    data_referencia: date,
    carga_simulada_por_ano: defaultdict[int, int],
) -> str | None:
    if professor.contratacao != Contratacao.PF:
        return None

    ano_inicio = date(data_referencia.year, 1, 1)
    ano_fim = date(data_referencia.year, 12, 31)
    alocacoes = db.scalars(
        _base_query().where(
            Alocacao.data >= ano_inicio,
            Alocacao.data <= ano_fim,
            or_(
                Alocacao.professor_titular_id == professor.id,
                Alocacao.professor_substituto_id == professor.id,
            ),
        )
    ).all()
    carga_atual = len(alocacoes) * HORAS_POR_ALOCACAO
    carga_resultante = carga_atual + carga_simulada_por_ano[data_referencia.year] + HORAS_POR_ALOCACAO
    if carga_resultante > 300:
        return f"Carga horaria maxima anual de 300 horas atingida para o professor {professor.nome}."
    return None


def _mapa_de_professores_em_conflito(alocacoes: list[Alocacao]) -> set[tuple[int, date, str]]:
    por_professor: defaultdict[tuple[int, date, str], set[int]] = defaultdict(set)
    for alocacao in alocacoes:
        por_professor[(alocacao.professor_titular_id, alocacao.data, alocacao.turno.value)].add(alocacao.id)
        if alocacao.professor_substituto_id is not None:
            por_professor[(alocacao.professor_substituto_id, alocacao.data, alocacao.turno.value)].add(alocacao.id)
    return {chave for chave, ids in por_professor.items() if len(ids) > 1}


def _status_visual(alocacao: Alocacao, conflitos: set[tuple[int, date, str]]) -> str:
    if (alocacao.professor_titular_id, alocacao.data, alocacao.turno.value) in conflitos:
        return "VERMELHO"
    if alocacao.professor_substituto_id is not None:
        if (alocacao.professor_substituto_id, alocacao.data, alocacao.turno.value) in conflitos:
            return "VERMELHO"
        return "ROXO"
    return "VERDE"


def _formatar_data(valor: date) -> str:
    return valor.strftime("%d/%m/%Y")


def _validar_data_letiva(data_referencia: date, liberar_fim_de_semana: bool = False) -> None:
    if _eh_feriado_nacional(data_referencia):
        raise ValidacaoDeNegocioError(
            f"Nao e possivel criar alocacao em {_formatar_data(data_referencia)} porque a data nao e letiva."
        )
    if data_referencia.weekday() >= 5 and not liberar_fim_de_semana:
        raise ValidacaoDeNegocioError(
            f"Nao e possivel criar alocacao em {_formatar_data(data_referencia)} sem liberar o fim de semana para atividade extracurricular."
        )


def _eh_data_nao_letiva(data_referencia: date) -> bool:
    return data_referencia.weekday() >= 5 or _eh_feriado_nacional(data_referencia)


def _eh_feriado_nacional(data_referencia: date) -> bool:
    if (data_referencia.month, data_referencia.day) in FERIADOS_NACIONAIS_FIXOS:
        return True
    return data_referencia == _sexta_feira_santa(data_referencia.year)


def _sexta_feira_santa(ano: int) -> date:
    pascoa = _calcular_pascoa(ano)
    return pascoa - timedelta(days=2)


def _calcular_pascoa(ano: int) -> date:
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
    return date(ano, mes, dia)


def atualizar_alocacao(db: Session, alocacao_id: int, payload: AlocacaoUpdate) -> AlocacaoRead:
    """Atualizacao parcial de alocacao (Onda 4 - PATCH)."""
    alocacao = db.get(Alocacao, alocacao_id)
    if not alocacao:
        raise EntidadeNaoEncontradaError("Alocacao nao encontrada.")
    dados = payload.model_dump(exclude_unset=True)
    if "professor_titular_id" in dados:
        alocacao.professor_titular_id = dados.pop("professor_titular_id")
    if "professor_substituto_id" in dados:
        alocacao.professor_substituto_id = dados.pop("professor_substituto_id")
    if "justificativa_override" in dados:
        alocacao.justificativa_override = (dados.pop("justificativa_override") or "").strip() or None
    if "forcada" in dados:
        alocacao.forcada = dados.pop("forcada")
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflitoDeNegocioError("Nao foi possivel atualizar a alocacao por violacao de integridade.") from exc
    alocacao = db.scalar(
        _base_query().where(Alocacao.id == alocacao_id).execution_options(populate_existing=True)
    )
    assert alocacao is not None
    return _to_read_model(alocacao)
