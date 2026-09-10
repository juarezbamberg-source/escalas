from app.core.config import get_settings


def horas_por_alocacao() -> int:
    """Horas creditadas por alocacao (configuravel)."""
    return get_settings().horas_por_alocacao


def limite_anual_carga_horas() -> int:
    """Limite anual de carga em horas (configuravel)."""
    return get_settings().limite_anual_carga_horas


def limite_anual_carga_alocacoes() -> int:
    """Limite anual de carga em numero de alocacoes (configuravel)."""
    return get_settings().limite_anual_carga_alocacoes
