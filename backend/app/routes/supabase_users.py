"""
Supabase Users API Routes
Routes for managing users via Supabase
"""

from fastapi import APIRouter, HTTPException, status
from app.services.supabase_users import SupabaseUserService
from app.schemas.supabase_user import (
    CreateUserRequest,
    GetOrCreateUserRequest,
    UpdateUserRequest,
    UserResponse,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/supabase-users", tags=["supabase-users"])


@router.post("/get-or-create", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_or_create_user(request: GetOrCreateUserRequest):
    """
    Get existing user or create new one.
    If user exists and telegram_id provided, updates telegram_id.
    """
    try:
        logger.info("Getting or creating user", {
            "username": request.username,
            "telegram_id": request.telegram_id
        })

        user = await SupabaseUserService.get_or_create_user(
            username=request.username,
            telegram_id=request.telegram_id,
            first_name=request.first_name,
            last_name=request.last_name
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get or create user"
            )

        logger.info("User obtained or created successfully", {
            "user_id": user.get("id"),
            "username": request.username
        })

        return UserResponse(**user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get or create user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get or create user: {str(e)}"
        )


@router.post("/create", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(request: CreateUserRequest):
    """
    Create a new user.
    """
    try:
        logger.info("Creating user", {
            "username": request.username,
            "telegram_id": request.telegram_id
        })

        user = await SupabaseUserService.create_user(
            username=request.username,
            telegram_id=request.telegram_id,
            first_name=request.first_name,
            last_name=request.last_name
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )

        logger.info("User created successfully", {
            "user_id": user.get("id"),
            "username": request.username
        })

        return UserResponse(**user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.get("/by-username/{username}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_user_by_username(username: str):
    """
    Get user by username.
    """
    try:
        logger.info("Getting user by username", {
            "username": username
        })

        user = await SupabaseUserService.get_user_by_username(username)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return UserResponse(**user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get user by username: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user by username: {str(e)}"
        )


@router.get("/by-telegram/{telegram_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_user_by_telegram_id(telegram_id: int):
    """
    Get user by Telegram ID.
    """
    try:
        logger.info("Getting user by telegram_id", {
            "telegram_id": telegram_id
        })

        user = await SupabaseUserService.get_user_by_telegram_id(telegram_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return UserResponse(**user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get user by telegram_id: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user by telegram_id: {str(e)}"
        )


@router.put("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_user(user_id: str, request: UpdateUserRequest):
    """
    Update user information.
    """
    try:
        logger.info("Updating user", {
            "user_id": user_id
        })

        user = await SupabaseUserService.update_user(
            user_id=user_id,
            telegram_id=request.telegram_id,
            first_name=request.first_name,
            last_name=request.last_name
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        logger.info("User updated successfully", {
            "user_id": user_id
        })

        return UserResponse(**user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )
