"""Authentication service for Telegram WebApp users."""

import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.models import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for handling authentication operations."""

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        """Get hash of a password."""
        return pwd_context.hash(password)

    @staticmethod
    async def get_user_by_telegram_id(
        session: AsyncSession, telegram_id: str
    ) -> Optional[User]:
        """Get user by Telegram ID."""
        result = await session.execute(
            select(User).where(User.telegram_id == telegram_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create_or_update_user(
        session: AsyncSession,
        telegram_id: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        username: Optional[str] = None,
    ) -> User:
        """Create or update user from Telegram data."""
        user = await AuthService.get_user_by_telegram_id(session, telegram_id)

        if user:
            # Update existing user
            user.first_name = first_name or user.first_name
            user.last_name = last_name or user.last_name
            user.username = username or user.username
            user.updated_at = datetime.utcnow()
        else:
            # Create new user
            user = User(
                telegram_id=telegram_id,
                first_name=first_name,
                last_name=last_name,
                username=username,
                is_active=True,
            )
            session.add(user)

        await session.flush()
        return user

    @staticmethod
    def verify_telegram_init_data(
        init_data: str, bot_token: str
    ) -> Optional[dict]:
        """
        Verify Telegram WebApp initData signature.

        Args:
            init_data: The initData string from Telegram WebApp
            bot_token: Telegram Bot token

        Returns:
            Parsed initData dict if valid, None otherwise
        """
        try:
            # Parse query string
            data_check_string = "\n".join(
                f"{key}={value}"
                for key, value in sorted(
                    (
                        item.split("=")[0],
                        item.split("=")[1] if "=" in item else "",
                    )
                    for item in init_data.split("&")
                    if "=" in item and item.split("=")[0] != "hash"
                )
            )

            # Get hash from init_data
            hash_value = None
            for item in init_data.split("&"):
                if item.startswith("hash="):
                    hash_value = item.split("=")[1]
                    break

            if not hash_value:
                return None

            # Verify signature
            secret_key = hashlib.sha256(bot_token.encode()).digest()
            calculated_hash = hmac.new(
                secret_key, data_check_string.encode(), hashlib.sha256
            ).hexdigest()

            if calculated_hash != hash_value:
                return None

            # Parse the init data into a dictionary
            parsed_data = {}
            for item in init_data.split("&"):
                if "=" in item:
                    key, value = item.split("=", 1)
                    parsed_data[key] = value

            return parsed_data

        except Exception:
            return None

    @staticmethod
    def create_access_token(
        data: dict, expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT access token."""
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
            algorithm=settings.ALGORITHM,
        )

        return encoded_jwt

    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
            )
            return payload
        except JWTError:
            return None
