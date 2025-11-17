"""
Supabase Workouts Service - Backend wrapper for Supabase operations
Uses REST API directly with httpx for better control and compatibility
"""

import httpx
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime
import os
import json

logger = logging.getLogger(__name__)

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://localhost:54321")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz")

# REST API endpoints
REST_API_BASE = f"{SUPABASE_URL}/rest/v1"


class SupabaseWorkoutService:
    """Service for managing workouts via Supabase REST API"""

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
    async def get_or_create_workout_session(
        user_id: str,
        user_day_id: str,
        started_at: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get existing workout session or create a new one.
        Prevents duplicate workouts on the same day.
        """
        try:
            # Сначала проверим существует ли уже workout для этого дня
            existing = await SupabaseWorkoutService._make_request(
                "GET",
                "user_day_workouts",
                params={
                    "user_id": f"eq.{user_id}",
                    "user_day_id": f"eq.{user_day_id}"
                }
            )

            if existing and isinstance(existing, list) and len(existing) > 0:
                logger.info(f"Existing workout session found: {existing[0]['id']}")
                return existing[0]

            # Workout не существует, создаем новый
            if not started_at:
                started_at = datetime.utcnow().isoformat()

            result = await SupabaseWorkoutService._make_request(
                "POST",
                "user_day_workouts",
                data={
                    "user_id": user_id,
                    "user_day_id": user_day_id,
                    "started_at": started_at
                }
            )

            if result and isinstance(result, list) and len(result) > 0:
                logger.info(f"Workout session created: {result[0]['id']}")
                return result[0]
            else:
                logger.error("Failed to create workout session: invalid response format")
                return None
        except Exception as e:
            logger.error(f"Error getting or creating workout session: {e}")
            raise

    @staticmethod
    async def create_workout_session(
        user_id: str,
        user_day_id: str,
        started_at: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Deprecated: Use get_or_create_workout_session instead.
        Create a new workout session (may fail if one already exists due to UNIQUE constraint).
        """
        return await SupabaseWorkoutService.get_or_create_workout_session(
            user_id, user_day_id, started_at
        )

    @staticmethod
    async def get_exercise_by_directus_id(directus_id: str) -> Optional[Dict[str, Any]]:
        """Get exercise by Directus ID"""
        try:
            result = await SupabaseWorkoutService._make_request(
                "GET",
                "exercises",
                params={"directus_id": f"eq.{directus_id}"}
            )

            if result and isinstance(result, list) and len(result) > 0:
                return result[0]
            return None
        except Exception as e:
            logger.error(f"Error getting exercise by directus_id: {e}")
            return None

    @staticmethod
    async def create_workout_exercise(
        workout_session_id: str,
        exercise_id: str
    ) -> Optional[Dict[str, Any]]:
        """Create an exercise in a workout session"""
        try:
            result = await SupabaseWorkoutService._make_request(
                "POST",
                "user_day_workout_exercises",
                data={
                    "user_day_workout_id": workout_session_id,
                    "exercise_id": exercise_id
                }
            )

            if result and isinstance(result, list) and len(result) > 0:
                logger.info(f"Workout exercise created: {result[0]['id']}")
                return result[0]
            else:
                logger.error("Failed to create workout exercise: invalid response format")
                return None
        except Exception as e:
            logger.error(f"Error creating workout exercise: {e}")
            raise

    @staticmethod
    async def create_exercise_set(
        workout_exercise_id: str,
        reps: int,
        weight: float,
        set_order: int
    ) -> Optional[Dict[str, Any]]:
        """Create a set for an exercise"""
        try:
            result = await SupabaseWorkoutService._make_request(
                "POST",
                "user_day_workout_exercise_sets",
                data={
                    "user_day_workout_exercise_id": workout_exercise_id,
                    "reps": reps,
                    "weight": weight,
                    "set_order": set_order
                }
            )

            if result and isinstance(result, list) and len(result) > 0:
                logger.info(f"Exercise set created: {result[0]['id']}")
                return result[0]
            else:
                logger.error("Failed to create exercise set: invalid response format")
                return None
        except Exception as e:
            logger.error(f"Error creating exercise set: {e}")
            raise

    @staticmethod
    async def delete_workout_exercise(exercise_id: str) -> bool:
        """Delete an exercise from a workout session"""
        try:
            # Check if exercise exists
            result = await SupabaseWorkoutService._make_request(
                "GET",
                "user_day_workout_exercises",
                params={"id": f"eq.{exercise_id}"}
            )

            if not result or (isinstance(result, list) and len(result) == 0):
                logger.warning(f"Exercise not found: {exercise_id}")
                return False

            # Delete the exercise
            await SupabaseWorkoutService._make_request(
                "DELETE",
                "user_day_workout_exercises",
                params={"id": f"eq.{exercise_id}"}
            )

            logger.info(f"Workout exercise deleted: {exercise_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting workout exercise: {e}")
            raise

    @staticmethod
    async def delete_all_workout_exercises(workout_session_id: str) -> bool:
        """Delete all exercises from a workout session"""
        try:
            # Get all exercises first
            exercises = await SupabaseWorkoutService._make_request(
                "GET",
                "user_day_workout_exercises",
                params={"user_day_workout_id": f"eq.{workout_session_id}", "select": "id"}
            )

            if not exercises or (isinstance(exercises, list) and len(exercises) == 0):
                logger.info(f"No exercises to delete for workout session: {workout_session_id}")
                return True

            # Delete each exercise
            if isinstance(exercises, list):
                for exercise in exercises:
                    await SupabaseWorkoutService._make_request(
                        "DELETE",
                        "user_day_workout_exercises",
                        params={"id": f"eq.{exercise['id']}"}
                    )

            logger.info(f"All exercises deleted for workout session: {workout_session_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting all workout exercises: {e}")
            raise

    @staticmethod
    async def delete_workout_session(workout_session_id: str) -> bool:
        """Delete a workout session (including all exercises and sets)"""
        try:
            # Delete all exercises first (cascade will handle sets)
            await SupabaseWorkoutService.delete_all_workout_exercises(workout_session_id)

            # Delete the workout session itself
            await SupabaseWorkoutService._make_request(
                "DELETE",
                "user_day_workouts",
                params={"id": f"eq.{workout_session_id}"}
            )

            logger.info(f"Workout session deleted: {workout_session_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting workout session: {e}")
            raise
