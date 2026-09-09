class RegraDeNegocioError(ValueError):
    """Erro base de dominio."""


class ValidacaoDeNegocioError(RegraDeNegocioError):
    """Erro de validacao de entrada ou fluxo."""


class ConflitoDeNegocioError(RegraDeNegocioError):
    """Erro de conflito de integridade ou regra."""


class EntidadeNaoEncontradaError(RegraDeNegocioError):
    """Erro para entidades inexistentes."""
