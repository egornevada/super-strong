"""
Supabase Users Service - Backend wrapper for user operations
Uses REST API directly with httpx for better control and compatibility
"""

import httpx
from typing import Optional, Dict, Any
import logging
from datetime import datetime
import os

logger = logging.getLogger(__name__)

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://localhost:54321")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz")

# REST API endpoints
REST_API_BASE = f"{SUPABASE_URL}/rest/v1"


class SupabaseUserService:
    """Service for managing users via Supabase REST API"""

    @staticmethod
    async def _make_request(
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Make a request to Supabase REST API"""
        try:
            url = f"{REST_API_BASE}/{endpoint}"
            headers = {
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }

            async with httpx.AsyncClient(timeout=30) as client:
                if method == "GET":
                    response = await client.get(url, headers=headers, params=params)
                elif method == "POST":
                    response = await client.post(url, headers=headers, json=data)
                elif method == "PUT":
                    response = await client.put(url, headers=headers, json=data)
                elif method == "DELETE":
                    response = await client.delete(url, headers=headers)
                else:
                    raise ValueError(f"Unsupported method: {method}")

                if response.status_code >= 400:
                    logger.error(f"Supabase REST API error: {response.status_code} - {response.text}")
                    return None

                if response.status_code == 204:  # No content
                    return {"success": True}

                return response.json() if response.text else None

        except Exception as e:
            logger.error(f"Error making Supabase REST API request: {e}")
            return None

    @staticmethod
    async def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
        """Get user by username"""
        try:
            result = await SupabaseUserService._make_request(
                "GET",
                "users",
                params={"username": f"eq.{username}"}
            )

            if result and isinstance(result, list) and len(result) > 0:
                logger.info(f"User found: {result[0]['id']}")
                return result[0]
            return None
        except Exception as e:
            logger.error(f"Error getting user by username: {e}")
            return None

    @staticmethod
    async def get_user_by_telegram_id(telegram_id: int) -> Optional[Dict[str, Any]]:
        """Get user by Telegram ID"""
        try:
            result = await SupabaseUserService._make_request(
                "GET",
                "users",
                params={"telegram_id": f"eq.{telegram_id}"}
            )

            if result and isinstance(result, list) and len(result) > 0:
                logger.info(f"User found by telegram_id: {result[0]['id']}")
                return result[0]
            return None
        except Exception as e:
            logger.error(f"Error getting user by telegram_id: {e}")
            return None

    @staticmethod
    async def create_user(
        username: str,
        telegram_id: Optional[int] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Create a new user"""
        try:
            data = {
                "username": username,
                "first_name": first_name,
                "last_name": last_name
            }

            if telegram_id:
                data["telegram_id"] = telegram_id

            result = await SupabaseUserService._make_request(
                "POST",
                "users",
                data=data
            )

            if result and isinstance(result, list) and len(result) > 0:
                logger.info(f"User created: {result[0]['id']}")
                return result[0]
            else:
                logger.error("Failed to create user: invalid response format")
                return None
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise

    @staticmethod
    async def update_user(
        user_id: str,
        telegram_id: Optional[int] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Update user information"""
        try:
            data = {}

            if telegram_id is not None:
                data["telegram_id"] = telegram_id
            if first_name is not None:
                data["first_name"] = first_name
            if last_name is not None:
                data["last_name"] = last_name

            result = await SupabaseUserService._make_request(
                "PUT",
                "users",
                data=data,
                params={"id": f"eq.{user_id}"}
            )

            if result and isinstance(result, list) and len(result) > 0:
                logger.info(f"User updated: {user_id}")
                return result[0]
            else:
                logger.error("Failed to update user: invalid response format")
                return None
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise

    @staticmethod
    async def get_or_create_user(
        username: str,
        telegram_id: Optional[int] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get existing user or create new one.
        If user exists and telegram_id provided, updates it.
        """
        try:
            # Сначала ищем по username
            existing_user = await SupabaseUserService.get_user_by_username(username)

            if existing_user:
                # Пользователь существует
                # Если передан telegram_id и он не установлен, обновляем
                if telegram_id and not existing_user.get("telegram_id"):
                    return await SupabaseUserService.update_user(
                        existing_user["id"],
                        telegram_id=telegram_id,
                        first_name=first_name,
                        last_name=last_name
                    )
                return existing_user

            # Пользователя нет, создаем нового
            return await SupabaseUserService.create_user(
                username=username,
                telegram_id=telegram_id,
                first_name=first_name,
                last_name=last_name
            )
        except Exception as e:
            logger.error(f"Error in get_or_create_user: {e}")
            raise
