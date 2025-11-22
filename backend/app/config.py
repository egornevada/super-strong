"""
Конфигурация приложения
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Основные настройки приложения"""

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_TITLE: str = "Super Strong API"
    API_VERSION: str = "0.1.0"

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str
    DATABASE_ECHO: bool = False

    # Supabase (for production)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Telegram
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_SECRET_KEY: Optional[str] = None

    # Directus
    DIRECTUS_URL: Optional[str] = None
    DIRECTUS_API_TOKEN: Optional[str] = None

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    FRONTEND_PROD_URL: str = "https://strong.webtga.ru"
    FRONTEND_TEST_URL: str = "https://teststrong.webtga.ru"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Получить кеширован конфигурацию"""
    return Settings()


settings = get_settings()
