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

    // Sync all exercises to Supabase in parallel
    const syncPromises = directusExercises.map((exercise) => {
      return upsertExercise({
        directus_id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        description: exercise.description
      })
        .then(() => {
          logger.debug('Exercise synced', { exerciseId: exercise.id, name: exercise.name });
          return true;
        })
        .catch((error) => {
          logger.error('Failed to sync exercise', { exerciseId: exercise.id, error });
          // Return false for failed exercises but continue with others
          return false;
        });
    });

    // Wait for all exercises to sync in parallel
    const results = await Promise.all(syncPromises);
    const syncedCount = results.filter(success => success).length;

    logger.info('Exercise sync completed', { syncedCount, totalCount: directusExercises.length });
    return syncedCount;
  } catch (error) {
    logger.error('Error syncing exercises from Directus', { error });
    throw error;
  }
}
