from datetime import date, timedelta


FERIADOS_NACIONAIS_FIXOS: dict[tuple[int, int], str] = {
    (1, 1): "Confraternizacao Universal",
    (4, 21): "Tiradentes",
    (5, 1): "Dia do Trabalho",
    (9, 7): "Independencia do Brasil",
    (10, 12): "Nossa Senhora Aparecida",
    (11, 2): "Finados",
    (11, 15): "Proclamacao da Republica",
    (11, 20): "Consciencia Negra",
    (12, 25): "Natal",
}


def _extract_pascoa(ano: int) -> date:
    """Algoritmo de Gauss para calcular a data da Pascoa."""
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


def _sexta_feira_santa(pascoa: date) -> date:
    return pascoa - timedelta(days=2)


def _corpus_christi(pascoa: date) -> date:
    return pascoa + timedelta(days=60)


def _carnaval(pascoa: date) -> list[date]:
    quarta_de_cinzas = pascoa - timedelta(days=46)
    return [quarta_de_cinzas - timedelta(days=2), quarta_de_cinzas - timedelta(days=1)]


def feriados_moveis(ano: int) -> list[date]:
    """Retorna a lista de datas dos feriados moveis do ano."""
    pascoa = _extract_pascoa(ano)
    return [
        *_carnaval(pascoa),
        _sexta_feira_santa(pascoa),
        _corpus_christi(pascoa),
    ]


def eh_feriado(data: date) -> bool:
    """Verifica se a data e feriado nacional (fixo ou movel)."""
    if (data.month, data.day) in FERIADOS_NACIONAIS_FIXOS:
        return True
    return data in feriados_moveis(data.year)
