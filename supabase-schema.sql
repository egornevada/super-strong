-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exercises table
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  directus_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User days table
CREATE TABLE user_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- User day exercises table
CREATE TABLE user_day_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_day_id UUID NOT NULL REFERENCES user_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User day exercise sets table
CREATE TABLE user_day_exercise_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_day_exercise_id UUID NOT NULL REFERENCES user_day_exercises(id) ON DELETE CASCADE,
  reps INTEGER NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,
  set_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User day workouts table (workout sessions)
CREATE TABLE user_day_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_day_id UUID NOT NULL REFERENCES user_days(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, user_day_id)
);

-- User day workout exercises table (exercises in a workout session)
CREATE TABLE user_day_workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_day_workout_id UUID NOT NULL REFERENCES user_day_workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User day workout exercise sets table (sets for exercises in workout sessions)
CREATE TABLE user_day_workout_exercise_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_day_workout_exercise_id UUID NOT NULL REFERENCES user_day_workout_exercises(id) ON DELETE CASCADE,
  reps INTEGER NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,
  set_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_user_days_user_id ON user_days(user_id);
CREATE INDEX idx_user_days_date ON user_days(date);
CREATE INDEX idx_user_day_exercises_user_day_id ON user_day_exercises(user_day_id);
CREATE INDEX idx_user_day_exercise_sets_user_day_exercise_id ON user_day_exercise_sets(user_day_exercise_id);
CREATE INDEX idx_exercises_directus_id ON exercises(directus_id);
CREATE INDEX idx_user_day_workouts_user_id ON user_day_workouts(user_id);
CREATE INDEX idx_user_day_workouts_user_day_id ON user_day_workouts(user_day_id);
CREATE INDEX idx_user_day_workouts_started_at ON user_day_workouts(started_at);
CREATE INDEX idx_user_day_workout_exercises_workout_id ON user_day_workout_exercises(user_day_workout_id);
CREATE INDEX idx_user_day_workout_exercises_exercise_id ON user_day_workout_exercises(exercise_id);
CREATE INDEX idx_user_day_workout_exercise_sets_exercise_id ON user_day_workout_exercise_sets(user_day_workout_exercise_id);
