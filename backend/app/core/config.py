from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    # LLM & Embedding Secrets
    ANTHROPIC_API_KEY: str = ""
    LLM_PROVIDER: str = "claude"  # claude | local
    OPENAI_API_KEY: str = ""
    EMBEDDING_PROVIDER: str = "openai"  # openai | local

    # Database & Storage
    DATABASE_URL: str = "postgresql+asyncpg://contractlens:contractlens@localhost:2007/contractlens"
    STORAGE_PATH: str = "./storage"

    # App Config
    CORS_ORIGINS: str = "http://localhost:3000"
    DEMO_USER_EMAIL: str = "demo@contractlens.ai"
    DEMO_USER_NAME: str = "Demo User"
    APP_ENV: str = "development"
    LOG_LEVEL: str = "info"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def absolute_storage_path(self) -> Path:
        path = Path(self.STORAGE_PATH)
        if not path.is_absolute():
            path = Path(__file__).parent.parent.parent / self.STORAGE_PATH
        path.mkdir(parents=True, exist_ok=True)
        return path

settings = Settings()
