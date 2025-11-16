"""
FastAPI главное приложение
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import init_db, close_db
from app.routes import auth, workout, exercise, statistics, directus
import logging

# Конфигурация логирования
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Управление жизненным циклом приложения
    """
    logger.info("🚀 Starting Super Strong Backend")
    await init_db()
    yield
    logger.info("🛑 Shutting down Super Strong Backend")
    await close_db()


# Создание FastAPI приложения
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="Super Strong - Backend для управления тренировками",
    lifespan=lifespan,
)

# CORS middleware
allowed_origins = [
    settings.FRONTEND_URL,
    settings.FRONTEND_PROD_URL,
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Проверка здоровья приложения
    """
    return {
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "version": settings.API_VERSION
    }


@app.get("/")
async def root():
    """
    Корневой endpoint с информацией об API
    """
    return {
        "name": "Super Strong API",
        "version": settings.API_VERSION,
        "docs": "/docs",
        "redoc": "/redoc"
    }


# Подключение routes
app.include_router(auth.router)
app.include_router(workout.router)
app.include_router(exercise.router)
app.include_router(statistics.router)
app.include_router(directus.router)
