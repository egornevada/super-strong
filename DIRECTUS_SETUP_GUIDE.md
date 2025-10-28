# Super Strong - Directus Setup Guide

## Current Status
✅ Application running at http://localhost:5173
✅ Directus running at http://localhost:8055
✅ Admin credentials: `admin@example.com` / `password`
✅ Public permissions configured for exercises and categories collections
✅ Error handling implemented for missing exercises

## Project Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **UI Library**: @egornevada/folder-ui (custom Tailwind preset)
- **Styling**: Tailwind CSS 3.4
- **Backend**: Directus (Docker container with PostgreSQL)
- **API**: Directus REST API

### How It Works

1. **App Flow**:
   - User opens app → sees Calendar page
   - Clicks date → goes to ExercisesPage
   - ExercisesPage calls `fetchExercises()` and `fetchCategories()` from Directus
   - User selects exercises → goes to MyExercisesPage
   - Adds sets (reps/weight) → saves workout to state

2. **Data Flow**:
   ```
   Directus (exercises + categories)
        ↓
   src/services/directusApi.ts (fetch functions)
        ↓
   ExercisesPage.tsx (loads data)
        ↓
   React Components render exercises
   ```

### Directus Collections Structure

#### Categories Collection
```
- id (UUID, primary key)
- name (string, max 255)
```

**Existing categories** (already in database):
- Ноги (Legs)
- Спина (Back)
- Грудь (Chest)
- Руки (Arms)
- Плечи (Shoulders)
- Кор (Core)
- + 6 more empty entries (can delete)

#### Exercises Collection
```
- id (UUID, primary key)
- name (string, max 255, required)
- description (text, optional)
- category (UUID, many-to-one relation to categories, optional)
- image (UUID, file relation, optional)
```

**Status**: Currently EMPTY (0 exercises)

### Key Files

```
src/
├── services/
│   └── directusApi.ts       # API functions (fetchExercises, fetchCategories)
├── pages/
│   ├── ExercisesPage.tsx    # Loads exercises, handles selection
│   ├── MyExercisesPage.tsx  # Tracks sets (reps/weight)
│   ├── CalendarPage.tsx     # Shows calendar
│   └── StorybookPage.tsx    # UI showcase
├── components/
│   ├── ErrorPage.tsx        # Error display component
│   ├── index.ts             # Component exports
│   ├── main/                # Button, FilterPill, etc.
│   ├── widgets/             # ExerciseCard, TrackCard
│   └── ...
└── App.tsx                  # Main app component with routing
```

### API Endpoints (Directus)

All public (no auth required):
```
GET  http://localhost:8055/items/categories?fields=*
GET  http://localhost:8055/items/exercises?fields=*,category.id,category.name,image.id,image.filename_disk
```

## Adding Exercises to Directus

### Method 1: Via UI (RECOMMENDED)
1. Open http://localhost:8055
2. Login: `admin@example.com` / `password`
3. Click **Exercises** in left sidebar
4. Click **+ Create entry** (blue button, top right)
5. Fill form:
   - **name**: Exercise name (e.g., "Приседания")
   - **description**: Optional description (e.g., "Базовое упражнение для развития мышц ног")
   - **category**: Pick category dropdown
   - **image**: Optional (upload image if you have)
6. Click **Save** button

### Sample Exercises to Add

```
1. Приседания (Squats)
   - Description: Базовое упражнение для развития мышц ног
   - Category: Ноги (Legs)

2. Жим лежа (Bench Press)
   - Description: Классическое упражнение для развития грудных мышц
   - Category: Грудь (Chest)

3. Становая тяга (Deadlift)
   - Description: Комплексное упражнение для развития спины
   - Category: Спина (Back)

4. Подтягивания (Pull-ups)
   - Description: Упражнение для развития спины и бицепсов
   - Category: Спина (Back)

5. Жим гантелей (Dumbbell Press)
   - Description: Упражнение для развития плечевых мышц
   - Category: Плечи (Shoulders)

6. Сгибание рук со штангой (Barbell Curls)
   - Description: Упражнение для развития бицепсов
   - Category: Руки (Arms)

7. Планка (Plank)
   - Description: Статическое упражнение для развития мышц кора
   - Category: Кор (Core)

8. Выпады (Lunges)
   - Description: Упражнение для развития мышц ног
   - Category: Ноги (Legs)
```

### Method 2: Via cURL (if needed)

First get category IDs:
```bash
curl -s "http://localhost:8055/items/categories?fields=id,name" | jq '.data'
```

Then add exercise (replace `CATEGORY_ID` with actual ID):
```bash
TOKEN=$(curl -s -X POST http://localhost:8055/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"password"}' | jq -r '.data.access_token')

curl -X POST "http://localhost:8055/items/exercises" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Приседания",
    "description": "Базовое упражнение для развития мышц ног",
    "category": "CATEGORY_ID_HERE"
  }'
```

## Troubleshooting

### Issue: ExercisesPage shows error "Не удается загрузить упражнения"
**Cause**: No exercises in Directus
**Solution**: Add exercises via Directus UI (Method 1 above)

### Issue: 403 Forbidden errors
**Cause**: Public permissions not set correctly
**Solution**: Already configured, should work. If not, run:
```bash
node --env-file=.env.local setup-permissions.js
```

### Issue: Categories not showing
**Check**:
- Verify categories exist: http://localhost:8055/items/categories
- Check that exercises have `category` field filled when creating

### Issue: Directus not accessible
**Check**: Is Docker running?
```bash
docker-compose ps
# Should show directus and postgres running
```

If not, start it:
```bash
docker-compose up -d
```

## React Component Integration

When you add exercises to Directus, they automatically appear in the app because:

1. **ExercisesPage.tsx** (line 36-40) loads data on mount:
```typescript
const [exercisesData, categoriesData] = await Promise.all([
  fetchExercises(),      // Fetches from Directus
  fetchCategories(),     // Fetches from Directus
]);
setExercises(exercisesData);
setCategories(categoriesData);
```

2. **ExerciseCard** components render each exercise:
```typescript
{categoryExercises.map((exercise) => (
  <ExerciseCard
    key={exercise.id}
    id={exercise.id}
    name={exercise.name}
    // ... other props
  />
))}
```

3. **MyExercisesPage** tracks sets (reps/weight) for selected exercises

## Environment Variables

File: `.env.local`
```
VITE_DIRECTUS_URL=http://localhost:8055
DIRECTUS_ADMIN_EMAIL=admin@example.com
DIRECTUS_ADMIN_PASSWORD=password
```

## Docker Commands

```bash
# Start Directus + PostgreSQL
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs directus

# Restart Directus
docker-compose restart directus
```

## Next Steps

1. ✅ Add 8+ exercises to Directus categories
2. ✅ Test app loads exercises (http://localhost:5173)
3. ✅ Test selecting exercises
4. ✅ Test adding sets (reps/weight)
5. ✅ Test saving workout to calendar date

## Support Commands

```bash
# Check if Directus is responding
curl -s http://localhost:8055/system/server | jq '.about'

# View all exercises
curl -s "http://localhost:8055/items/exercises" | jq '.data'

# View all categories with names
curl -s "http://localhost:8055/items/categories?fields=id,name" | jq '.data'

# Check public permissions
curl -s "http://localhost:8055/permissions" | jq '.data'
```

## Notes

- App uses **public API** (no token needed) - already configured
- React StrictMode is ON (may see double-calls in console)
- HMR enabled - changes reflect instantly
- All data stored only in browser state (localStorage not implemented yet)
- Workouts saved to React state, lost on page refresh

---

**Last Updated**: 2025-10-28
**Status**: Ready for exercise data entry
