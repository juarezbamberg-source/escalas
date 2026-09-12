from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Sistema de Escala de Professores"
    database_url: str = "sqlite:///./escalas.db"

    # --- Regras de negocio configuraveis (Onda 4) ---
    horas_por_alocacao: int = 3
    limite_anual_carga_horas: int = 300
    limite_anual_carga_alocacoes: int = 100

    # --- Autenticacao (Onda 4) ---
    secret_key: str = "troque-esta-chave-em-producao"
    access_token_expire_minutes: int = 60
    algoritmo_jwt: str = "HS256"

    # --- Seed do super admin (Onda 5) ---
    admin_username: str | None = None
    admin_senha_inicial: str | None = None
    admin_nome: str = "Administrador"

    # --- CORS (Onda 4) ---
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
