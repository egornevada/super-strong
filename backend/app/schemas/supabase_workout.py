"""
Supabase Workout Schemas - Request/Response models for workout operations
"""

from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID


class ExerciseSetRequest(BaseModel):
    """Request model for creating an exercise set"""
    reps: int
    weight: float


class ExerciseWithSetsRequest(BaseModel):
    """Request model for an exercise with its sets"""
    exercise_id: str  # This is the Directus exercise ID
    sets: List[ExerciseSetRequest]


class SaveWorkoutSessionRequest(BaseModel):
    """Request model for saving a complete workout session"""
    user_id: str
    user_day_id: str
    exercises: List[ExerciseWithSetsRequest]
    started_at: Optional[str] = None


class UpdateWorkoutSessionRequest(BaseModel):
    """Request model for updating a workout session's exercises"""
    exercises: List[ExerciseWithSetsRequest]


class DeleteExerciseRequest(BaseModel):
    """Request model for deleting an exercise from a workout"""
    exercise_id: str


class ExerciseSetResponse(BaseModel):
    """Response model for an exercise set"""
    id: str
    user_day_workout_exercise_id: str
    reps: int
    weight: float
    set_order: int
    created_at: str
    updated_at: str


class ExerciseResponse(BaseModel):
    """Response model for an exercise in a workout"""
    id: str
    user_day_workout_id: str
    exercise_id: str
    created_at: str
    updated_at: str
    sets: Optional[List[ExerciseSetResponse]] = None


class WorkoutSessionResponse(BaseModel):
    """Response model for a complete workout session"""
    id: str
    user_id: str
    user_day_id: str
    started_at: str
    created_at: str
    updated_at: str
    exercises: Optional[List[ExerciseResponse]] = None


class SaveWorkoutSessionResponse(BaseModel):
    """Response model after saving a workout session"""
    session_id: str
    exercises_count: int
    sets_count: int
