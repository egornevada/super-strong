import { api } from '../lib/api';
import { logger } from '../lib/logger';

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || "http://localhost:8055";

export interface Exercise {
  id: string;
  name: string;
  category: string;
  image?: {
    url: string;
    alternativeText?: string;
  };
  description?: string;
  difficulty?: string;
  muscleGroups?: string[];
}

interface DirectusExercise {
  id: string;
  name: string;
  description: string | null;
  image: DirectusFile | null;
  category: {
    id: string;
    name: string;
  } | null;
}

interface DirectusCategory {
  id: string;
  name: string;
}

interface DirectusFile {
  id: string;
  filename_disk: string;
  filename_download: string;
  type: string;
  title: string | null;
  description: string | null;
}

interface DirectusResponse<T> {
  data: T[];
  meta?: {
    total_count: number;
  };
}

/**
 * Построить URL для картинки в Directus
 */
function getImageUrl(fileId: string): string {
  return `${DIRECTUS_URL}/assets/${fileId}`;
}

/**
 * Получить все упражнения из Directus
 */
export async function fetchExercises(): Promise<Exercise[]> {
  try {
    // Получаем упражнения с их категориями через Directus REST API
    const response = await api.get<DirectusResponse<DirectusExercise>>(
      '/items/exercises?fields=id,name,description,category.id,category.name&limit=-1'
    );

    console.log('[directusApi] fetchExercises response:', response);

    const data = Array.isArray(response) ? response : (response?.data || []);

    console.log('[directusApi] fetchExercises data:', data);

    // Преобразуем формат Directus в наш формат
    const result = data.map((item: any) => ({
      id: String(item.id),
      name: item.name || "",
      category: item.category?.name || "Без категории",
      description: item.description || "",
      image: item.image
        ? {
            url: `${DIRECTUS_URL}/assets/${item.image.id}`,
            alternativeText: item.image.title || item.name,
          }
        : undefined,
    }));

    console.log('[directusApi] fetchExercises result:', result);
    return result;
  } catch (error) {
    logger.error("Failed to fetch exercises from Directus:", error);
    throw error;
  }
}

/**
 * Получить упражнения по категории
 */
export async function fetchExercisesByCategory(
  category: string
): Promise<Exercise[]> {
  try {
    const response = await api.get<DirectusResponse<DirectusExercise>>(
      `/items/exercises?fields=id,name,description,category.id,category.name&filter[category][name][_eq]=${encodeURIComponent(category)}&limit=-1`
    );

    console.log('[directusApi] fetchExercisesByCategory response:', response);

    const data = Array.isArray(response) ? response : (response?.data || []);

    console.log('[directusApi] fetchExercisesByCategory data:', data);

    const result = data.map((item: DirectusExercise) => ({
      id: item.id,
      name: item.name || "",
      category: category,
      description: item.description || "",
    }));

    console.log('[directusApi] fetchExercisesByCategory result:', result);

    return result;
  } catch (error) {
    logger.error("Failed to fetch exercises by category from Directus:", error);
    throw error;
  }
}

/**
 * Получить все категории
 */
export async function fetchCategories(): Promise<string[]> {
  try {
    const response = await api.get<DirectusResponse<DirectusCategory>>(
      '/items/categories?fields=id,name&limit=-1'
    );

    console.log('[directusApi] fetchCategories response:', response);

    const data = Array.isArray(response) ? response : (response?.data || []);

    console.log('[directusApi] fetchCategories data:', data);

    // Получаем названия всех категорий
    const categories = data.map((item: any) => item.name);

    console.log('[directusApi] fetchCategories result:', categories);

    return categories.sort();
  } catch (error) {
    logger.error("Failed to fetch categories from Directus:", error);
    throw error;
  }
}

/**
 * Получить одно упражнение по ID
 */
export async function fetchExerciseById(id: string): Promise<Exercise> {
  try {
    const response = await api.get<any>(
      `/items/exercises/${id}?fields=id,name,description,category.id,category.name`
    );

    // Directus returns { data: {...} } for single item GET, or {...} directly
    const data = response?.data ?? response;

    if (!data) {
      throw new Error(`Exercise with id ${id} not found`);
    }

    return {
      id: String(data.id),
      name: data.name || "",
      category: data.category?.name || "Без категории",
      description: data.description || "",
    };
  } catch (error) {
    logger.error("Failed to fetch exercise by ID from Directus:", error);
    throw error;
  }
}
