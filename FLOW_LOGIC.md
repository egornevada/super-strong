# App Flow Verification - Updated

## 1. User Initialization (Before any content)
- App loads → isInitialized = false → Shows loading spinner
- initializeUser() effect runs
  - Check localStorage for existing session
  - If found → setIsInitialized(true) → exit
  - Check for Telegram initData
  - If found → create/get user → saveUserSession() → setIsInitialized(true) → exit
  - If neither → show UsernameModal

## 2. After User Authenticated (isInitialized = true)
- Entire app content renders (CalendarPage, ExercisesPage, etc)
- Sheet overlays render (ExerciseDetailSheetRenderer, ProfileSheetRenderer, etc)
- handleLoadWorkouts() effect RUNS for first time:
  1. Loads exercises cache from Directus
     ```
     const exercisesData = await fetchExercises();
     setAllExercises(exercisesData);
     ```
     - This caches all exercises for later display
     - Used when loading saved workouts

  2. Syncs pending requests
  3. Calls getWorkoutsForDate() with valid session
  4. Gets workouts from PostgREST
  5. Updates workoutDays state with dots on calendar

## 3. User Clicks on a Day
- handleDayClick() runs (now ASYNC)
- Calls getWorkoutSetsForDay(dateStr) to check server
  ```
  GET /workouts?user_id=eq.X&workout_date=eq.2025-11-02
  GET /workout_sets?workout_id=eq.X&order=exercise_id.asc,set_order.asc
  ```

### If workout exists on server:
- getWorkoutSetsForDay() returns { workoutId, exerciseSets: Map }
- For each exercise in exerciseSets Map:
  1. Find exercise info from allExercises cache
  2. Convert WorkoutSetData to Set[] format
  3. Create ExerciseWithTrackSets object
- Navigate to MyExercisesPage with all loaded data
- **IMPORTANT**: All sets are loaded from server, not just current session

### If no workout exists on server:
- getWorkoutSetsForDay() returns null
- Navigate to ExercisesPage for user to select exercises

## 4. User Selects Exercises
- ExercisesPage is displayed
- User selects exercises
- Calls onStartTraining(selectedExercises) → navigates to MyExercisesPage
- Note: At this point exercises are only in memory (selectedExercises state)
- NO workout is created in DB yet

## 5. User Adds First Set
- MyExercisesPage displayed with selected exercises
- User clicks "Add Set" on exercise
- handleAddSet() runs:
  1. Updates local state with new set
  2. Calls handleAutoSaveWorkout(updated) IMMEDIATELY (NO DEBOUNCE)
  3. Shows "Сохраняется..." indicator

- handleAutoSaveWorkout() calls saveWorkout(dateStr, apiExercises)

- saveWorkout() in workoutsApi.ts:
  1. Gets user session (EXISTS from localStorage)
  2. **Checks if workout exists** for this date/user:
     ```
     GET /workouts?user_id=eq.X&workout_date=eq.2025-11-02
     ```
  3. If NOT exists → **CREATE new workout**
     ```
     POST /workouts {user_id, workout_date}
     ```
  4. Delete old sets for this workout (none yet)
  5. **CREATE sets** for all exercises:
     ```
     POST /workout_sets [{exercise_id, reps, weight, set_order}, ...]
     ```
  6. Return workoutId

✅ Workout + first set created in database

## 6. User Adds Second Set to Same Exercise (CRITICAL - Fixes 409 Error)
- handleAddSet() runs again
- Calls handleAutoSaveWorkout() IMMEDIATELY
- saveWorkout() is called

- saveWorkout() logic:
  1. Gets user session (EXISTS)
  2. **Checks if workout exists** for this date/user:
     ```
     GET /workouts?user_id=eq.X&workout_date=eq.2025-11-02
     ```
  3. **WORKOUT EXISTS** (created in step 5)
  4. **REUSES same workoutId** (NO 409 error!)
  5. Delete OLD sets (the one from step 5)
  6. Create NEW sets with both sets:
     ```
     POST /workout_sets
     [
       {exercise_id, reps: 10, weight: 20, set_order: 1},
       {exercise_id, reps: 8, weight: 25, set_order: 2}
     ]
     ```

✅ **KEY**: Same workout reused, sets updated. No duplicate workout creation!

## 7. User Navigates Back to Calendar
- handleBackFromMyExercises() runs
- Waits for save to complete
- Calls onBack() to return to calendar
- Calendar shows dot for this day

## 8. User Clicks Same Day Again
- handleDayClick() runs (ASYNC)
- Calls **getWorkoutSetsForDay(dateStr)** from server
  ```
  GET /workouts?user_id=eq.X&workout_date=eq.2025-11-02
  GET /workout_sets?workout_id=6&order=exercise_id.asc,set_order.asc
  ```

- Gets response with both sets (from steps 5 and 6)
- For each exercise ID:
  1. Finds exercise from allExercises cache
  2. Maps WorkoutSetData to Set[] format
  3. Creates ExerciseWithTrackSets
- **LOADS BOTH SETS** from database
- Navigates to MyExercisesPage with all sets

✅ **IMPORTANT**: Data comes from server, not memory. Persists across page reload.

## 9. User Refreshes Page
- Window reload
- App loads → shows loading spinner
- initializeUser() runs
  - Checks localStorage for session
  - Session found → setIsInitialized(true)

- handleLoadWorkouts() runs:
  - Loads exercises cache
  - Loads calendar dots for current month

- User clicks same day
- handleDayClick() loads data from server again
- All sets still there ✅

## 10. If Duplicate Sets Bug Occurs (Safety Feature)
- If by some error, same set gets saved twice to database
- getWorkoutSetsForDay() groups sets by exercise_id and returns ALL of them
- App displays **ALL sets** that exist in database (not deduped)
- This prevents data loss while still showing the error

Example:
```
Database has for exercise_id=22:
- Set 1: reps=10, weight=20
- Set 2: reps=8, weight=25
- Set 2 (duplicate): reps=8, weight=25

getWorkoutSetsForDay() returns:
Map("22" -> [
  {reps:10, weight:20},
  {reps:8, weight:25},
  {reps:8, weight:25}  ← Shows duplicate too!
])

MyExercisesPage displays all 3 sets
```

---

## 10. User Logs Out
- SettingsPage handleLogout() runs
- Calls clearUserSession() - removes from localStorage
- Reloads page
- App loads → session is null → shows UsernameModal
- User can create new account or log in as different user

---

## Key Improvements Made

### 1. App Initialization Blocker (App.tsx)
- **Before**: App tried to load workouts before user was initialized
- **After**:
  - isInitialized state blocks all page rendering
  - Shows loading spinner until authenticated
  - Only renders content after user confirmed

### 2. Exercises Cache (App.tsx)
- **New Feature**: Loads all exercises once after user initialization
  ```typescript
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  ```
- Used for displaying saved workouts without re-fetching

### 3. Server-First Data Loading (App.tsx handleDayClick())
- **Before**: Used in-memory savedWorkouts Map (lost on page reload)
- **After**:
  - Always loads from server: `getWorkoutSetsForDay(dateStr)`
  - Groups sets by exercise using database order
  - Creates ExerciseWithTrackSets from server data
  - **Persists across page reload and browser close**

### 4. Get Workout Sets Function (workoutsApi.ts)
- **New Function**: `getWorkoutSetsForDay(date)`
  ```typescript
  1. Get workout for user on this date
  2. Get all sets for this workout
  3. Group sets by exercise_id
  4. Return Map<exerciseId, WorkoutSetData[]>
  ```
- Returns ALL sets for each exercise (handles duplicates safely)

### 5. Prevent Duplicate Workouts (workoutsApi.ts)
- **Before**: Created new workout on each save → 409 errors
- **After**:
  - Checks if workout exists: GET /workouts?user_id=eq.X&workout_date=eq.DATE
  - If exists → reuses workoutId
  - If not → creates new one
  - Deletes old sets and creates all new ones

### 6. Immediate Auto-Save (MyExercisesPage.tsx)
- handleAddSet() calls handleAutoSaveWorkout() immediately
- No debounce delay
- savingRef prevents concurrent saves

### 7. Session Persistence (authApi.ts)
- Uses localStorage (not sessionStorage)
- Persists across page refresh and browser close
- Only cleared on logout

---

## Testing Checklist

- [ ] App shows loading spinner on first load
- [ ] UsernameModal appears after loading (if no session)
- [ ] Calendar loads with dots for past workouts
- [ ] Can add first set without errors
- [ ] Can add second set (NO 409 error!)
- [ ] Can add multiple sets
- [ ] "Сохраняется..." shows during save
- [ ] Calendar dot appears after save
- [ ] Navigate back to calendar works
- [ ] Page refresh keeps user logged in
- [ ] Click same day again shows ALL previous sets
- [ ] Navigate to different day and back shows correct data
- [ ] Logout clears session
- [ ] Can login as different user
- [ ] If duplicate sets somehow occur, all are displayed

---

## File Changes

### workoutsApi.ts
- Added `getWorkoutSetsForDay()` function
  - Loads workout + all sets from server
  - Groups sets by exercise
  - Returns exerciseSets Map

### App.tsx
- Added `allExercises` state for caching
- Updated `handleLoadWorkouts()` to load exercises cache
- Made `handleDayClick()` ASYNC
- Changed to always load from server instead of savedWorkouts Map

### authApi.ts
- Changed `saveUserSession()` to use localStorage
- Changed `getUserSession()` to read from localStorage
- Persists across page reload
