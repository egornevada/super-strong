import type { Set } from '../components';

const STORAGE_KEY = 'super-strong-profile-stats';

interface WorkoutSummary {
  totalSets: number;
  totalWeight: number;
  updatedAt: string;
}

interface ProfileStatsStore {
  workouts: Record<string, WorkoutSummary>;
}

const ensureStore = (): ProfileStatsStore => ({ workouts: {} });

const readStore = (): ProfileStatsStore => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return ensureStore();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ensureStore();

    const parsed = JSON.parse(raw) as Partial<ProfileStatsStore>;
    if (!parsed || typeof parsed !== 'object') return ensureStore();

    return {
      workouts: parsed.workouts && typeof parsed.workouts === 'object'
        ? Object.entries(parsed.workouts).reduce<Record<string, WorkoutSummary>>((acc, [key, value]) => {
            if (
              value &&
              typeof value === 'object' &&
              typeof (value as WorkoutSummary).totalSets === 'number' &&
              typeof (value as WorkoutSummary).totalWeight === 'number'
            ) {
              acc[key] = {
                totalSets: Math.max(0, Math.round((value as WorkoutSummary).totalSets)),
                totalWeight: Math.max(0, (value as WorkoutSummary).totalWeight),
                updatedAt: typeof (value as WorkoutSummary).updatedAt === 'string'
                  ? (value as WorkoutSummary).updatedAt
                  : new Date().toISOString(),
              };
            }
            return acc;
          }, {})
        : {},
    };
  } catch (error) {
    console.warn('[profileStats] Failed to read store:', error);
    return ensureStore();
  }
};

const writeStore = (store: ProfileStatsStore) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn('[profileStats] Failed to write store:', error);
  }
};

const clampTwoDecimals = (value: number): number => Math.round(value * 100) / 100;

const parseSets = (exercises: Array<{ trackSets: Set[] }>) => {
  let totalSets = 0;
  let totalWeight = 0;

  exercises.forEach((exercise) => {
    exercise.trackSets.forEach((set) => {
      const reps = Number.isFinite(set.reps) ? set.reps : 0;
      const weight = Number.isFinite(set.weight) ? set.weight : 0;
      totalSets += 1;
      totalWeight += reps * weight;
    });
  });

  return {
    totalSets,
    totalWeight: clampTwoDecimals(totalWeight),
  };
};

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const msInDay = 24 * 60 * 60 * 1000;

const differenceInDays = (fromIso: string, toDate = new Date()): number => {
  const from = new Date(`${fromIso}T00:00:00`);
  if (Number.isNaN(from.getTime())) return 0;

  const start = startOfDay(from);
  const end = startOfDay(toDate);
  const diff = Math.floor((end.getTime() - start.getTime()) / msInDay);
  return diff >= 0 ? diff + 1 : 0;
};

export interface ProfileStatsSummary {
  totalSets: number;
  totalWeight: number;
  workoutsCompleted: number;
  daysSinceFirstWorkout: number;
  daysSinceUserCreation: number;
  firstWorkoutDate?: string;
}

const computeSummary = (store: ProfileStatsStore, userCreatedAt?: string): ProfileStatsSummary => {
  const entries = Object.entries(store.workouts);

  if (!entries.length) {
    return {
      totalSets: 0,
      totalWeight: 0,
      workoutsCompleted: 0,
      daysSinceFirstWorkout: 0,
      daysSinceUserCreation: userCreatedAt ? differenceInDays(userCreatedAt) : 0,
      firstWorkoutDate: undefined,
    };
  }

  let totalSets = 0;
  let totalWeight = 0;
  let earliestDate: string | undefined;
  let workoutsCompleted = 0;

  entries.forEach(([date, summary]) => {
    if (!summary) return;

    const sets = summary.totalSets ?? 0;
    const weight = summary.totalWeight ?? 0;

    if (sets > 0) {
      workoutsCompleted += 1;
    }

    totalSets += sets;
    totalWeight += weight;

    if (!earliestDate || date < earliestDate) {
      earliestDate = date;
    }
  });

  return {
    totalSets,
    totalWeight: clampTwoDecimals(totalWeight),
    workoutsCompleted,
    daysSinceFirstWorkout: earliestDate ? differenceInDays(earliestDate) : 0,
    daysSinceUserCreation: userCreatedAt ? differenceInDays(userCreatedAt) + 1 : 0,
    firstWorkoutDate: earliestDate,
  };
};

export const PROFILE_STATS_STORAGE_KEY = STORAGE_KEY;

export const getProfileStats = (userCreatedAt?: string): ProfileStatsSummary => {
  const store = readStore();
  return computeSummary(store, userCreatedAt);
};

export const recordProfileWorkout = (
  workoutDate: string,
  exercises: Array<{ trackSets: Set[] }>,
  userCreatedAt?: string
): ProfileStatsSummary => {
  if (!workoutDate) {
    return getProfileStats(userCreatedAt);
  }

  const store = readStore();
  const { totalSets, totalWeight } = parseSets(exercises);

  if (totalSets === 0) {
    delete store.workouts[workoutDate];
  } else {
    store.workouts[workoutDate] = {
      totalSets,
      totalWeight,
      updatedAt: new Date().toISOString(),
    };
  }

  writeStore(store);
  return computeSummary(store, userCreatedAt);
};

export const removeProfileWorkout = (workoutDate: string) => {
  const store = readStore();
  if (store.workouts[workoutDate]) {
    delete store.workouts[workoutDate];
    writeStore(store);
  }
};

export const clearProfileStats = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
};

// Recalculate all profile stats from saved workouts (for fixing incorrect historical data)
export const recalculateStatsFromSavedWorkouts = (
  savedWorkouts: Map<string, Array<{ trackSets: Set[] }>>,
  userCreatedAt?: string
): ProfileStatsSummary => {
  const store: ProfileStatsStore = { workouts: {} };

  savedWorkouts.forEach((exercises, dateKey) => {
    const { totalSets, totalWeight } = parseSets(exercises);
    if (totalSets > 0) {
      store.workouts[dateKey] = {
        totalSets,
        totalWeight,
        updatedAt: new Date().toISOString(),
      };
    }
  });

  writeStore(store);
  return computeSummary(store, userCreatedAt);
};
