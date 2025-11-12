-- RPC Function for optimized month workouts loading
-- 📖 Source: https://supabase.com/docs/guides/database/functions
--
-- This function loads all workout sessions for a month in ONE query instead of N+1
-- with aggregated statistics (exercise count, total sets, volume)
--
-- Usage (JavaScript):
-- const { data } = await supabase.rpc('get_month_workouts', {
--   p_user_id: userId,
--   p_year: 2025,
--   p_month: 11
-- })

CREATE OR REPLACE FUNCTION get_month_workouts(
  p_user_id UUID,
  p_year INT,
  p_month INT
)
RETURNS TABLE (
  id UUID,
  user_day_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  exercises_count INT,
  total_sets INT,
  total_volume DECIMAL,
  avg_duration_seconds INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ws.id,
    ws.user_day_id,
    ws.created_at,
    ws.updated_at,
    ws.started_at,
    COUNT(DISTINCT we.id)::INT as exercises_count,
    COUNT(DISTINCT wset.id)::INT as total_sets,
    COALESCE(SUM(wset.weight * wset.reps)::DECIMAL, 0) as total_volume,
    COALESCE(ROUND(EXTRACT(EPOCH FROM (MAX(ws.updated_at) - MIN(ws.started_at))))::INT, 0) as avg_duration_seconds
  FROM workout_sessions ws
  LEFT JOIN user_days ud ON ws.user_day_id = ud.id
  LEFT JOIN user_day_workout_exercises we ON ws.id = we.workout_session_id
  LEFT JOIN user_day_exercise_sets wset ON we.id = wset.user_day_workout_exercise_id
  WHERE
    ws.user_id = p_user_id
    AND EXTRACT(YEAR FROM ws.created_at) = p_year
    AND EXTRACT(MONTH FROM ws.created_at) = p_month
  GROUP BY
    ws.id,
    ws.user_day_id,
    ws.created_at,
    ws.updated_at,
    ws.started_at
  ORDER BY ws.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_month_workouts(UUID, INT, INT) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_month_workouts(UUID, INT, INT) IS
'Optimized query to load all workout sessions for a specific month with aggregated statistics. ' ||
'This replaces N+1 queries by combining all data in a single RPC call. ' ||
'Returns: id, user_day_id, timestamps, exercise count, set count, total volume, and average duration.';
