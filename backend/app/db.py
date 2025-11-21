"""
Экспорт для обратной совместимости - используй database.py
"""

from app.database import AsyncSession, AsyncSessionLocal, get_session as get_db, close_db

__all__ = ["AsyncSession", "AsyncSessionLocal", "get_db", "close_db"]
