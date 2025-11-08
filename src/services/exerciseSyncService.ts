import { logger } from '../lib/logger';
import { fetchExercises } from './directusApi';
import { upsertExercise } from './supabaseApi';

/**
 * Sync all exercises from Directus to Supabase
 * This should be called when the app loads to ensure all exercises are available
 */
export async function syncExercisesFromDirectus(): Promise<number> {
  try {
    logger.info('Starting exercise sync from Directus to Supabase');

    // Fetch all exercises from Directus
    const directusExercises = await fetchExercises();

    if (!directusExercises || directusExercises.length === 0) {
      logger.warn('No exercises found in Directus');
      return 0;
    }

    logger.debug('Fetched exercises from Directus', { count: directusExercises.length });

    // Sync each exercise to Supabase
    let syncedCount = 0;

    for (const exercise of directusExercises) {
      try {
        await upsertExercise({
          directus_id: exercise.id,
          name: exercise.name,
          category: exercise.category,
          description: exercise.description
        });

        syncedCount++;
        logger.debug('Exercise synced', { exerciseId: exercise.id, name: exercise.name });
      } catch (error) {
        logger.error('Failed to sync exercise', { exerciseId: exercise.id, error });
        // Continue with next exercise even if one fails
      }
    }

    logger.info('Exercise sync completed', { syncedCount, totalCount: directusExercises.length });
    return syncedCount;
  } catch (error) {
    logger.error('Error syncing exercises from Directus', { error });
    throw error;
  }
}
