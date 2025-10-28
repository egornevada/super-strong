# Super Strong Project Context

## Quick Summary
This is a React + TypeScript fitness tracking app using Directus as a headless CMS for exercise data. Users select exercises from a list, add sets (reps/weight), and save workouts to calendar dates.

## Tech Stack
- React 19 + TypeScript + Vite (fast dev server)
- Directus + PostgreSQL (Docker) for exercise/category data
- Tailwind CSS with custom @egornevada/folder-ui preset
- ESLint + TypeScript strict mode

## Database Schema (Directus)

### `categories` Collection
```
id (UUID, PK)
name (string, max 255)
```
Currently contains: Ноги, Спина, Грудь, Руки, Плечи, Кор (+ empty duplicates)

### `exercises` Collection
```
id (UUID, PK)
name (string, max 255, required)
description (text, optional)
category (UUID, FK to categories, optional)
image (UUID, FK to directus_files, optional)
```
Currently: **EMPTY - needs data entry**

## Core User Flow
1. Calendar page (default)
2. Click date → ExercisesPage
3. ExercisesPage loads exercises/categories from Directus API
4. Select exercises → MyExercisesPage
5. Add sets (reps/weight) per exercise
6. Save workout (stored in React state only)

## Key React Components

### Pages
- **CalendarPage**: Shows month calendar, handles date selection
- **ExercisesPage**:
  - Fetches exercises from Directus on mount
  - Groups by category with FilterPill selector
  - ExerciseCard for each exercise (image + name)
  - Shows ErrorPage if fetch fails
  - Passes selected exercises to MyExercisesPage

- **MyExercisesPage**:
  - Shows selected exercises
  - TrackCard for each (add sets with reps/weight)
  - Auto-saves on back button click

- **StorybookPage**: UI component showcase (not used by users)

### Components
- **ErrorPage**: Displays error message with optional back button
- **ExerciseCard**: Shows exercise with image, name, selection checkbox
- **TrackCard**: Allows adding multiple sets (reps/weight) for an exercise
- **Button, FilterPill, StickyTagsBar**: UI elements from folder-ui

## API Integration (src/services/directusApi.ts)

```typescript
// Public endpoints (no auth needed)
fetchExercises(): Promise<Exercise[]>
  GET /items/exercises?fields=*,category.id,category.name,image.id,image.filename_disk

fetchCategories(): Promise<string[]>
  GET /items/categories?fields=id,name

// Transform Directus format → App format
// category: { id, name } → category: "Category Name"
// image: { id } → image: { url: /assets/{id}, alternativeText }
```

## State Management (App.tsx)
- `currentPage`: 'calendar' | 'exercises' | 'myExercises' | 'storybook'
- `selectedDate`: { day, month, year } | null
- `selectedExercises`: Exercise[]
- `exercisesWithTrackedSets`: Map<exerciseId, Set[]>
- `savedWorkouts`: Map<dateKey, ExerciseWithTrackSets[]>
- Animations (slide/dissolve) for page transitions

## File Structure
```
super-strong/
├── src/
│   ├── App.tsx                 # Main app (routing, state)
│   ├── main.tsx                # React entry point
│   ├── index.css               # Tailwind imports
│   ├── services/
│   │   └── directusApi.ts      # Directus API calls
│   ├── pages/
│   │   ├── CalendarPage.tsx
│   │   ├── ExercisesPage.tsx
│   │   ├── MyExercisesPage.tsx
│   │   └── StorybookPage.tsx
│   ├── components/
│   │   ├── index.ts            # Re-exports
│   │   ├── ErrorPage.tsx       # NEW - error display
│   │   ├── headers/            # HeaderWithBackButton
│   │   ├── main/               # Button, FilterPill, etc.
│   │   ├── widgets/            # ExerciseCard, TrackCard
│   │   └── specific/           # Calendar components
│   └── hooks/
│       └── useTelegram.ts      # Telegram Web App integration
├── docker-compose.yml          # Directus + PostgreSQL
├── vite.config.ts
├── tsconfig.app.json
├── tailwind.config.cjs
├── package.json
└── .env.local                  # Directus URL + admin creds
```

## Current Issues & Solutions

### ✅ Fixed Issues
1. Removed old `strapiApi.ts` (Strapi was replaced with Directus)
2. Added `ErrorPage` component for error handling
3. Fixed React hooks error (moved conditional returns to JSX)
4. Configured public permissions for exercises/categories collections
5. Set up error display in ExercisesPage

### ⚠️ Current Blocker
**No exercises in Directus** (0 items)
- Need to add exercises via Directus UI or API
- Categories exist but exercises table is empty
- Public read access is configured

## Development Commands
```bash
pnpm dev       # Start Vite dev server (http://localhost:5173)
pnpm build     # TypeScript check + Vite bundle
pnpm lint      # ESLint check
```

## Docker Commands
```bash
docker-compose up -d       # Start Directus + PostgreSQL
docker-compose logs directus  # View logs
docker-compose restart directus
docker-compose down        # Stop
```

## Environment Setup
- **Directus URL**: http://localhost:8055
- **Directus Admin**: admin@example.com / password
- **App URL**: http://localhost:5173
- **Database**: PostgreSQL in Docker

## Type Definitions
```typescript
interface Exercise {
  id: string;
  name: string;
  category: string;
  image?: { url: string; alternativeText?: string };
  description?: string;
}

interface Set {
  reps: number;
  weight: number;
}
```

## What Needs To Be Done
1. **Add exercises to Directus** - 8+ exercises across categories
2. Optional: Add exercise images
3. Optional: Implement localStorage for persistent workouts
4. Optional: Add export/backup functionality

## Contact Points with Directus
- Only `ExercisesPage.tsx` makes API calls (on component mount)
- API calls are wrapped in try/catch with error state
- Errors display ErrorPage component
- No other parts of app directly touch Directus

## Build Pipeline
1. TypeScript compilation (strict mode)
2. Vite SWC bundling
3. Tailwind CSS processing
4. Output to `/dist` directory

## Notes for AI Assistant
- App works with **empty exercises table** (shows error page)
- Must add data via Directus UI (admin panel)
- Public permissions already configured
- All styling uses Tailwind + folder-ui preset
- No external UI libraries (Material UI removed)
- React 19 with hooks (no class components)
- Strict TypeScript enabled
