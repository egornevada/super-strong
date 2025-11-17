"""
Supabase Workouts API Routes
Routes for creating, updating, and deleting workouts via Supabase
These routes use the Supabase SDK with service role key to bypass RLS
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.services.supabase_workouts import SupabaseWorkoutService
from app.schemas.supabase_workout import (
    SaveWorkoutSessionRequest,
    UpdateWorkoutSessionRequest,
    SaveWorkoutSessionResponse,
    WorkoutSessionResponse,
    DeleteExerciseRequest,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/supabase-workouts", tags=["supabase-workouts"])


@router.post("/session/save", response_model=SaveWorkoutSessionResponse, status_code=status.HTTP_201_CREATED)
async def save_workout_session(request: SaveWorkoutSessionRequest):
    """
    Create a new workout session with exercises and sets.
    Handles the complete save operation in one endpoint.
    """
    try:
        logger.info("Saving workout session", {
            "user_id": request.user_id,
            "user_day_id": request.user_day_id,
            "exercise_count": len(request.exercises)
        })

        # Step 1: Create the workout session
        session = await SupabaseWorkoutService.create_workout_session(
            request.user_id,
            request.user_day_id,
            request.started_at
        )

        if not session:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create workout session"
            )

        session_id = session["id"]
        total_sets = 0

        # Проверим: существуют ли уже упражнения в этом workout'е
        existing_exercises = await SupabaseWorkoutService._make_request(
            "GET",
            "user_day_workout_exercises",
            params={"user_day_workout_id": f"eq.{session_id}"}
        )

        logger.info(f"DEBUG: Checking existing exercises for session {session_id}", {
            "response_type": type(existing_exercises).__name__,
            "response": existing_exercises
        })

        has_existing_exercises = existing_exercises and isinstance(existing_exercises, list) and len(existing_exercises) > 0

        if has_existing_exercises:
            logger.info(f"Workout session {session_id} already has {len(existing_exercises)} exercises, skipping exercise creation")
            # Просто считаем существующие наборы и возвращаем
            sets_result = await SupabaseWorkoutService._make_request(
                "GET",
                "user_day_workout_exercise_sets",
                params={"user_day_workout_id": f"eq.{session_id}"}
            )
            total_sets = len(sets_result) if sets_result and isinstance(sets_result, list) else 0
        else:
            # Step 2: Create exercises and their sets (только если их ещё нет)
            for exercise_data in request.exercises:
                try:
                    # Get the exercise ID from Directus ID
                    exercise = await SupabaseWorkoutService.get_exercise_by_directus_id(exercise_data.exercise_id)

                    if not exercise:
                        logger.warning(f"Exercise not found: {exercise_data.exercise_id}")
                        continue

                    # Create the exercise in the workout
                    workout_exercise = await SupabaseWorkoutService.create_workout_exercise(
                        session_id,
                        exercise["id"]
                    )

                    if not workout_exercise:
                        logger.warning(f"Failed to create workout exercise: {exercise_data.exercise_id}")
                        continue

                    # Create sets for this exercise
                    for set_index, set_data in enumerate(exercise_data.sets, start=1):
                        try:
                            await SupabaseWorkoutService.create_exercise_set(
                                workout_exercise["id"],
                                set_data.reps,
                                float(set_data.weight),
                                set_index
                            )
                            total_sets += 1
                        except Exception as e:
                            logger.error(f"Failed to create set for exercise: {e}")
                            raise HTTPException(
                                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail=f"Failed to create exercise set: {str(e)}"
                            )

                except HTTPException:
                    raise
                except Exception as e:
                    logger.error(f"Failed to process exercise {exercise_data.exercise_id}: {e}")
                    # Continue with other exercises even if one fails
                    continue

        logger.info("Workout session saved successfully", {
            "session_id": session_id,
            "exercise_count": len(request.exercises),
            "sets_count": total_sets
        })

        return SaveWorkoutSessionResponse(
            session_id=session_id,
            exercises_count=len(request.exercises),
            sets_count=total_sets
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save workout session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save workout session: {str(e)}"
        )


@router.put("/session/{session_id}/exercises", status_code=status.HTTP_200_OK)
async def update_workout_exercises(
    session_id: str,
    request: UpdateWorkoutSessionRequest
):
    """
    Update exercises in an existing workout session.
    Deletes all existing exercises and recreates them with new data.
    """
    try:
        logger.info("Updating workout exercises", {
            "session_id": session_id,
            "exercise_count": len(request.exercises)
        })

        # Step 1: Check if the exercises and sets are already identical to what exists
        existing_exercises_result = await SupabaseWorkoutService._make_request(
            "GET",
            "user_day_workout_exercises",
            params={"user_day_workout_id": f"eq.{session_id}"}
        )

        logger.info(f"DEBUG: existing_exercises_result for session {session_id}", {
            "type": type(existing_exercises_result).__name__,
            "data": existing_exercises_result
        })

        # Build a signature of existing exercises with their sets
        existing_signature = {}
        if existing_exercises_result and isinstance(existing_exercises_result, list):
            for ex in existing_exercises_result:
                if ex.get("exercise_id"):
                    ex_id = ex.get("exercise_id")
                    workout_ex_id = ex.get("id")

                    # Get sets for this exercise
                    sets_result = await SupabaseWorkoutService._make_request(
                        "GET",
                        "user_day_workout_exercise_sets",
                        params={"user_day_workout_exercise_id": f"eq.{workout_ex_id}"}
                    )

                    sets_count = len(sets_result) if sets_result and isinstance(sets_result, list) else 0
                    existing_signature[ex_id] = sets_count

        # Build a signature of exercises we're trying to save
        new_signature = {}
        for ex in request.exercises:
            new_signature[ex.exercise_id] = len(ex.sets)

        logger.info(f"DEBUG: Signature comparison for session {session_id}", {
            "existing_signature": existing_signature,
            "new_signature": new_signature,
            "are_equal": existing_signature == new_signature
        })

        # If the exercises and their sets are identical, just return (idempotent behavior)
        if existing_signature == new_signature and len(existing_signature) > 0:
            logger.info(f"Exercises unchanged, returning existing data", {
                "session_id": session_id,
                "exercise_count": len(existing_signature)
            })

            sets_result = await SupabaseWorkoutService._make_request(
                "GET",
                "user_day_workout_exercise_sets",
                params={"user_day_workout_id": f"eq.{session_id}"}
            )
            total_sets = len(sets_result) if sets_result and isinstance(sets_result, list) else 0

            return {
                "message": "Workout exercises already up to date",
                "session_id": session_id,
                "exercises_count": len(request.exercises),
                "sets_count": total_sets
            }

        # Step 1: Delete all existing exercises (sets cascade delete) - only if they changed
        try:
            await SupabaseWorkoutService.delete_all_workout_exercises(session_id)
            logger.info("Deleted existing exercises", {"session_id": session_id})
        except Exception as e:
            logger.error(f"Failed to delete existing exercises: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete existing exercises: {str(e)}"
            )

        total_sets = 0

        # Step 2: Create new exercises and their sets
        for exercise_data in request.exercises:
            try:
                # Get the exercise ID from Directus ID
                exercise = await SupabaseWorkoutService.get_exercise_by_directus_id(exercise_data.exercise_id)

                if not exercise:
                    logger.warning(f"Exercise not found: {exercise_data.exercise_id}")
                    continue

                # Create the exercise in the workout
                workout_exercise = await SupabaseWorkoutService.create_workout_exercise(
                    session_id,
                    exercise["id"]
                )

                if not workout_exercise:
                    logger.warning(f"Failed to create workout exercise: {exercise_data.exercise_id}")
                    continue

                # Create sets for this exercise
                for set_index, set_data in enumerate(exercise_data.sets, start=1):
                    try:
                        await SupabaseWorkoutService.create_exercise_set(
                            workout_exercise["id"],
                            set_data.reps,
                            float(set_data.weight),
                            set_index
                        )
                        total_sets += 1
                    except Exception as e:
                        logger.error(f"Failed to create set for exercise: {e}")
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Failed to create exercise set: {str(e)}"
                        )

            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Failed to process exercise {exercise_data.exercise_id}: {e}")
                continue

        logger.info("Workout exercises updated successfully", {
            "session_id": session_id,
            "exercise_count": len(request.exercises),
            "sets_count": total_sets
        })

        return {
            "message": "Workout exercises updated successfully",
            "session_id": session_id,
            "exercises_count": len(request.exercises),
            "sets_count": total_sets
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update workout exercises: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update workout exercises: {str(e)}"
        )


@router.delete("/session/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout_session(session_id: str):
    """
    Delete a complete workout session (including all exercises and sets)
    """
    try:
        logger.info("Deleting workout session", {"session_id": session_id})

        success = await SupabaseWorkoutService.delete_workout_session(session_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workout session not found"
            )

        logger.info("Workout session deleted successfully", {"session_id": session_id})
        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete workout session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete workout session: {str(e)}"
        )


@router.delete("/session/{session_id}/exercise/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise_from_session(session_id: str, exercise_id: str):
    """
    Delete a single exercise from a workout session
    """
    try:
        logger.info("Deleting exercise from session", {
            "session_id": session_id,
            "exercise_id": exercise_id
        })

        success = await SupabaseWorkoutService.delete_workout_exercise(exercise_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exercise not found"
            )

        logger.info("Exercise deleted successfully", {"exercise_id": exercise_id})
        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete exercise: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete exercise: {str(e)}"
        )
