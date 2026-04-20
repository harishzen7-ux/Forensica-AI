from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecretkey_change_in_production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "forensica"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "forensica_db"

    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    UPLOAD_DIR: str = "uploads"
    MODEL_SERVICE_URL: str = "http://127.0.0.1:8001"
    MODEL_SERVICE_TIMEOUT_MS: int = 15000

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return "sqlite:///./forensica.db"

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
