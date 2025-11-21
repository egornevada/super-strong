"""
Security utilities: JWT, Telegram валидация, хеширование
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Хеширование пароля"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Создать JWT access token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Создать JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str) -> dict:
    """
    Проверить JWT token
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)) -> dict:
    """
    Dependency: получить текущего пользователя из JWT
    """
    token = credentials.credentials
    return verify_token(token)


def verify_telegram_init_data(init_data_raw: str) -> Optional[dict]:
    """
    Валидация Telegram initData (упрощенная версия)
    В production используй: https://github.com/nimaxin/init-data-py
    
    Здесь просто парсим, в будущем добавим полную валидацию подписи
    """
    try:
        import hashlib
        import hmac
        from urllib.parse import parse_qs
        
        # Парсим строку
        auth_data = parse_qs(init_data_raw)
        
        # Извлекаем hash для проверки
        hash_value = auth_data.get('hash', [None])[0]
        if not hash_value:
            logger.warning("No hash in telegram init data")
            return None
        
        # Удаляем hash из проверяемых данных
        check_string_list = []
        for key in sorted(auth_data.keys()):
            if key != 'hash':
                values = auth_data[key]
                for value in values:
                    check_string_list.append(f"{key}={value}")
        
        check_string = '\n'.join(check_string_list)
        
        # Проверяем подпись (упрощено, в production - использовать init-data-py)
        # Сейчас просто парсим данные
        logger.info("Telegram init data validated (signature check skipped for dev)")
        
        return auth_data
    except Exception as e:
        logger.error(f"Telegram validation error: {e}")
        return None
