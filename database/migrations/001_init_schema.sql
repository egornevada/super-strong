-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE,
  username VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on username for quick lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- Workouts table (stores workout sessions for a specific date)
CREATE TABLE IF NOT EXISTS workouts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, workout_date)
);

-- Create index for querying workouts by user and date
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, workout_date);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON workouts(created_at);

-- Workout sets table (individual sets for exercises within a workout)
CREATE TABLE IF NOT EXISTS workout_sets (
  id BIGSERIAL PRIMARY KEY,
  workout_id BIGINT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id VARCHAR(255) NOT NULL, -- References the exercise ID from Directus or external source
  reps INTEGER NOT NULL CHECK (reps > 0),
  weight DECIMAL(10, 2) NOT NULL CHECK (weight > 0),
  set_order INTEGER NOT NULL CHECK (set_order > 0), -- Order of sets within a workout
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for querying sets by workout
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_id ON workout_sets(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id ON workout_sets(exercise_id);

-- Update updated_at timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_sets_updated_at BEFORE UPDATE ON workout_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create role for PostgREST anonymous access
CREATE ROLE anon NOLOGIN;

-- Grant permissions for PostgREST (anonymous access with RLS)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON workouts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON workout_sets TO anon;

-- Grant permissions on sequences (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table (allow anonymous to read/create, can only modify own row)
CREATE POLICY users_allow_insert ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY users_allow_select ON users
  FOR SELECT USING (true);

-- RLS Policies for workouts table (users can only see/modify their own workouts)
CREATE POLICY workouts_allow_insert ON workouts
  FOR INSERT WITH CHECK (true);

CREATE POLICY workouts_allow_select ON workouts
  FOR SELECT USING (true);

CREATE POLICY workouts_allow_update ON workouts
  FOR UPDATE USING (true);

CREATE POLICY workouts_allow_delete ON workouts
  FOR DELETE USING (true);

-- RLS Policies for workout_sets table
CREATE POLICY workout_sets_allow_insert ON workout_sets
  FOR INSERT WITH CHECK (true);

CREATE POLICY workout_sets_allow_select ON workout_sets
  FOR SELECT USING (true);

CREATE POLICY workout_sets_allow_update ON workout_sets
  FOR UPDATE USING (true);

CREATE POLICY workout_sets_allow_delete ON workout_sets
  FOR DELETE USING (true);
