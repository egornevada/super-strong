# Super Strong Database Setup

This directory contains PostgreSQL and PostgREST configuration for the Super Strong application.

## Quick Start (Local Development)

### Prerequisites
- Docker and Docker Compose installed
- Port 5432 (PostgreSQL) and 3000 (PostgREST API) available

### Step 1: Start the database and API server

```bash
cd database
docker-compose up -d
```

This will:
- Create PostgreSQL container with database `super_strong`
- Run SQL migrations from `migrations/` folder
- Start PostgREST API server on http://localhost:3000

### Step 2: Verify the setup

Check if PostgreSQL is running:
```bash
docker ps | grep super-strong-postgres
```

Check PostgREST health:
```bash
curl http://localhost:3000/
```

View API documentation (OpenAPI):
```
http://localhost:3000/
```

### Step 3: Test database connection

Connect to PostgreSQL:
```bash
docker exec -it super-strong-postgres psql -U postgres -d super_strong
```

List tables:
```sql
\dt
```

### Step 4: Configure application

Update your `.env` file to point to local PostgREST:

```env
VITE_API_URL=http://localhost:3000
```

## Database Schema

### Tables

#### `users`
- `id` - Primary key
- `telegram_id` - Unique Telegram user ID (nullable, for non-Telegram users)
- `username` - Unique username for login/identification
- `first_name` - User's first name (from Telegram or input)
- `last_name` - User's last name (from Telegram or input)
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

#### `workouts`
- `id` - Primary key
- `user_id` - Foreign key to users table
- `workout_date` - Date of the workout (YYYY-MM-DD)
- `created_at` - When workout was created
- `updated_at` - Last update timestamp
- Unique constraint: (user_id, workout_date) - Only one workout per day per user

#### `workout_sets`
- `id` - Primary key
- `workout_id` - Foreign key to workouts table
- `exercise_id` - ID of the exercise (from Directus CMS or external source)
- `reps` - Number of repetitions
- `weight` - Weight in kg
- `set_order` - Order of sets within the workout
- `created_at` - When set was created
- `updated_at` - Last update timestamp

## API Endpoints (PostgREST)

### Users
```bash
# Get all users
GET /users

# Get user by username
GET /users?username=eq.john_doe

# Get user by telegram_id
GET /users?telegram_id=eq.123456789

# Create new user
POST /users
Content-Type: application/json

{
  "telegram_id": 123456789,
  "username": "john_doe",
  "first_name": "John",
  "last_name": "Doe"
}

# Update user
PATCH /users?id=eq.1
Content-Type: application/json

{
  "first_name": "Jane"
}
```

### Workouts
```bash
# Get all workouts for a user
GET /workouts?user_id=eq.1

# Get workout for specific date
GET /workouts?user_id=eq.1&workout_date=eq.2024-11-02

# Create workout
POST /workouts
Content-Type: application/json

{
  "user_id": 1,
  "workout_date": "2024-11-02"
}

# Delete workout
DELETE /workouts?id=eq.1
```

### Workout Sets
```bash
# Get all sets for a workout
GET /workout_sets?workout_id=eq.1

# Create set
POST /workout_sets
Content-Type: application/json

{
  "workout_id": 1,
  "exercise_id": "exercise-123",
  "reps": 10,
  "weight": 50,
  "set_order": 1
}

# Update set
PATCH /workout_sets?id=eq.1
Content-Type: application/json

{
  "reps": 12,
  "weight": 55
}

# Delete set
DELETE /workout_sets?id=eq.1
```

## Row Level Security (RLS)

Currently, all RLS policies are set to allow all operations. In production, you should implement proper authentication and restrict access to user's own data.

Example production policy:
```sql
CREATE POLICY workouts_user_access ON workouts
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

## Stopping the services

```bash
docker-compose down

# Keep data
docker-compose down

# Delete all data
docker-compose down -v
```

## Troubleshooting

### Port already in use
If ports 5432 or 3000 are already in use:
1. Edit `docker-compose.yml` and change the port mappings
2. Or stop the conflicting service

### PostgreSQL won't start
Check logs:
```bash
docker logs super-strong-postgres
```

### PostgREST can't connect to database
Ensure PostgreSQL is healthy:
```bash
docker logs super-strong-postgres
```

And verify the connection string in docker-compose.yml is correct.

## Production Deployment

For production, see the instructions in the main README.md for deploying to the server.
