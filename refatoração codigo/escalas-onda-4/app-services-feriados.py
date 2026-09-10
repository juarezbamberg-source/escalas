from datetime import date


def calcular_feriados_moveis(ano: int) -> list[date]:
    """Calcula os feriados moveis do calendario brasileiro (Onda 4).

    Retorna a lista de datas dos feriados moveis do ano.
    """
    pascoa = _extract_pascoa(ano)
    return [
        _sexta_feira_santa(pascoa),
        _corpus_christi(pascoa),
        # Carnaval: segunda e terca antes da Quarta de Cinzas (46 dias antes da Pascoa)
        _carnaval(pascoa),
    ]


def _extract_pascoa(ano: int) -> date:
    """Algoritmo de Gauss para calcular o domingo de Pascoa."""
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
    from datetime import timedelta

    return pascoa - timedelta(days=2)


def _corpus_christi(pascoa: date) -> date:
    from datetime import timedelta

    return pascoa + timedelta(days=60)


def _carnaval(pascoa: date) -> date:
    from datetime import timedelta

    # Segunda-feira de Carnaval: 48 dias antes da Pascoa
    return pascoa - timedelta(days=48)


def eh_feriado(data: date) -> bool:
    """Verifica se a data e um feriado movel ou fixo nacional."""
    if data in calcular_feriados_moveis(data.year):
        return True
    # Feriados fixos nacionais
    fixos = {
        (1, 1): "Confraternizacao Universal",
        (4, 21): "Tiradentes",
        (5, 1): "Dia do Trabalho",
        (9, 7): "Independencia",
        (10, 12): "Nossa Senhora Aparecida",
        (11, 2): "Finados",
        (11, 15): "Proclamacao da Republica",
        (12, 25): "Natal",
    }
    return (data.month, data.day) in fixos
