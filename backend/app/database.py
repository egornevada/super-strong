"""
Конфигурация подключения к базе данных
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Создание асинхронного engine
# PostgreSQL с psycopg2 → postgresql+psycopg://
# Для асинхронного → postgresql+asyncpg://
# Но psycopg2 не поддерживает async, используем asyncpg
DATABASE_URL = settings.DATABASE_URL.replace(
    "postgresql://", "postgresql+asyncpg://"
)

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Асинхронная сессия
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def init_db():
    """Инициализация БД (создание таблиц)"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        logger.info("✓ Database initialized")
    except Exception as e:
        logger.warning(f"⚠️ Database initialization skipped: {e}")
        # Не прерываем стартап если БД недоступна - для разработки полезно


async def get_session():
    """Dependency для получения сессии БД в endpoints"""
    async with AsyncSessionLocal() as session:
        yield session


# Alias для обратной совместимости
get_db_session = get_session


async def close_db():
    """Закрытие подключения к БД"""
    await engine.dispose()
