-- Performance Indexes for Async Loading Strategy
-- 📖 Source: https://www.postgresql.org/docs/current/indexes.html
--
-- These indexes optimize queries for the new loading strategy:
-- 1. Fast month-based filtering (current month + adjacent)
-- 2. Fast user-specific queries
-- 3. Fast relationship traversal (session → exercises → sets)

-- ============================================================================
-- Index 1: Fast month-based filtering for workout_sessions
-- ============================================================================
-- Optimization: Find all sessions for a specific month
-- Used by: getWorkoutsForDate(), CalendarPage loading
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_month
  ON workout_sessions(user_id, EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at))
  WHERE user_id IS NOT NULL;

-- ============================================================================
-- Index 2: Fast user_days lookup by user and date
-- ============================================================================
-- Optimization: Quick lookup for a specific day's workouts
-- Used by: getUserDayByDate(), handleDayClick()
CREATE INDEX IF NOT EXISTS idx_user_days_user_date
  ON user_days(user_id, date)
  WHERE user_id IS NOT NULL;

-- ============================================================================
-- Index 3: Fast workout_exercises lookup by session
-- ============================================================================
-- Optimization: Get all exercises for a session quickly
-- Used by: getWorkoutSessionExercises(), calculating exercise count
CREATE INDEX IF NOT EXISTS idx_workout_exercises_session
  ON user_day_workout_exercises(workout_session_id);

-- ============================================================================
-- Index 4: Fast workout_sets lookup by exercise
-- ============================================================================
-- Optimization: Get all sets for an exercise quickly
-- Used by: getWorkoutSessionExercises(), counting total sets
CREATE INDEX IF NOT EXISTS idx_exercise_sets
  ON user_day_exercise_sets(user_day_workout_exercise_id);

-- ============================================================================
-- Index 5: Fast exercise lookup by directus_id (for syncing)
-- ============================================================================
-- Optimization: Find Supabase exercise by Directus ID
-- Used by: Exercise syncing, lookups when creating workouts
CREATE INDEX IF NOT EXISTS idx_exercises_directus_id
  ON exercises(directus_id)
  WHERE directus_id IS NOT NULL;

-- ============================================================================
-- Index 6: Composite index for month-based user day queries
-- ============================================================================
-- Optimization: Fetch all days in a month for a user
-- Used by: Calendar rendering, workoutDays calculation
CREATE INDEX IF NOT EXISTS idx_user_days_user_month
  ON user_days(user_id, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date))
  WHERE user_id IS NOT NULL;

-- ============================================================================
-- Index 7: Fast user_day to workout_session relationship
-- ============================================================================
-- Optimization: Find all sessions for a user_day quickly
-- Used by: getWorkoutSessionsForDay(), DayDetailPage loading
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_day
  ON workout_sessions(user_day_id);

-- ============================================================================
-- Analyze indexes to ensure PostgreSQL uses them correctly
-- ============================================================================
ANALYZE;

-- Display summary of created indexes
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND tablename IN ('workout_sessions', 'user_days', 'user_day_workout_exercises', 'user_day_exercise_sets', 'exercises')
-- ORDER BY tablename, indexname;
