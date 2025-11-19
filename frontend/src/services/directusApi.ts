import { api } from '../lib/api';
import { logger } from '../lib/logger';

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || "https://directus.webtga.ru";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface Step {
  image?: {
    url: string;
    alternativeText?: string;
  };
  title?: string;
  description?: string;
}

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
  steps?: Step[];
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
      '/api/v1/items/exercises?fields=id,name,description,image.id,image.title,step_1_image.id,step_1_image.title,category.id,category.name&limit=-1'
    );

    const data = Array.isArray(response) ? response : (response?.data || []);

    // Преобразуем формат Directus в наш формат
    const result = data.map((item: any) => {
      // Обработка image - может быть ID (строка) или объект
      // Если нет основного image, используем первый шаг
      let imageData = undefined;
      if (item.image) {
        const imageId = typeof item.image === 'string' ? item.image : item.image.id;
        const imageTitle = typeof item.image === 'object' ? item.image.title : null;
        imageData = {
          url: `${DIRECTUS_URL}/assets/${imageId}`,
          alternativeText: imageTitle || item.name,
        };
      } else if (item.step_1_image) {
        // Если нет основного image, используем первый шаг
        const imageId = typeof item.step_1_image === 'string' ? item.step_1_image : item.step_1_image.id;
        const imageTitle = typeof item.step_1_image === 'object' ? item.step_1_image.title : null;
        imageData = {
          url: `${DIRECTUS_URL}/assets/${imageId}`,
          alternativeText: imageTitle || item.name,
        };
      }

      return {
        id: String(item.id),
        name: item.name || "",
        category: item.category?.name || "Без категории",
        description: item.description || "",
        image: imageData,
      };
    });

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
      `/api/v1/items/exercises?fields=id,name,description,image.id,image.title,step_1_image.id,step_1_image.title,category.id,category.name&filter[category][name][_eq]=${encodeURIComponent(category)}&limit=-1`
    );

    const data = Array.isArray(response) ? response : (response?.data || []);

    const result = data.map((item: any) => {
      // Обработка image - может быть ID (строка) или объект
      // Если нет основного image, используем первый шаг
      let imageData = undefined;
      if (item.image) {
        const imageId = typeof item.image === 'string' ? item.image : item.image.id;
        const imageTitle = typeof item.image === 'object' ? item.image.title : null;
        imageData = {
          url: `${DIRECTUS_URL}/assets/${imageId}`,
          alternativeText: imageTitle || item.name,
        };
      } else if (item.step_1_image) {
        // Если нет основного image, используем первый шаг
        const imageId = typeof item.step_1_image === 'string' ? item.step_1_image : item.step_1_image.id;
        const imageTitle = typeof item.step_1_image === 'object' ? item.step_1_image.title : null;
        imageData = {
          url: `${DIRECTUS_URL}/assets/${imageId}`,
          alternativeText: imageTitle || item.name,
        };
      }

      return {
        id: item.id,
        name: item.name || "",
        category: category,
        description: item.description || "",
        image: imageData,
      };
    });

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
      '/api/v1/items/categories?fields=id,name&limit=-1'
    );

    const data = Array.isArray(response) ? response : (response?.data || []);

    // Получаем названия всех категорий
    const categories = data.map((item: any) => item.name);

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
      `/api/v1/items/exercises/${id}?fields=id,name,description,image.id,image.title,category.id,category.name,step_1_image,step_1_title,step_1_description,step_2_image,step_2_title,step_2_description,step_3_image,step_3_title,step_3_description,step_4_image,step_4_title,step_4_description,step_5_image,step_5_title,step_5_description`
    );

    // Directus returns { data: {...} } for single item GET, or {...} directly
    const data = response?.data ?? response;

    if (!data) {
      throw new Error(`Exercise with id ${id} not found`);
    }

    logger.info(`Fetched exercise ${id}:`, {
      name: data.name,
      categoryType: typeof data.category,
      category: data.category
    });

    // Собираем шаги из полей step_N_image, step_N_title, step_N_description
    const steps: Step[] = [];

    for (let i = 1; i <= 5; i++) {
      const imageField = `step_${i}_image`;
      const titleField = `step_${i}_title`;
      const descField = `step_${i}_description`;

      const imageData = data[imageField];

      if (imageData) {
        // imageData может быть строкой (ID) или объектом с id
        const imageId = typeof imageData === 'string' ? imageData : imageData.id;
        steps.push({
          image: {
            url: `${DIRECTUS_URL}/assets/${imageId}`,
            alternativeText: (typeof imageData === 'object' ? imageData.title : null) || `Step ${i}`,
          },
          title: data[titleField] || `Шаг ${i}`,
          description: data[descField] || "",
        });
      }
    }

    // Обработка основного image
    // Если нет основного image, используем первый шаг как обложку
    let imageData = undefined;
    if (data.image) {
      const imageId = typeof data.image === 'string' ? data.image : data.image.id;
      const imageTitle = typeof data.image === 'object' ? data.image.title : null;
      imageData = {
        url: `${DIRECTUS_URL}/assets/${imageId}`,
        alternativeText: imageTitle || data.name,
      };
    } else if (steps.length > 0 && steps[0].image) {
      // Если нет основного image, используем первый шаг
      imageData = steps[0].image;
    }

    return {
      id: String(data.id),
      name: data.name || "",
      category: data.category?.name || "Без категории",
      description: data.description || "",
      image: imageData,
      steps: steps.length > 0 ? steps : undefined,
    };
  } catch (error) {
    logger.error("Failed to fetch exercise by ID from Directus:", error);
    throw error;
  }
}

/**
 * Batch load exercises and categories in parallel (single request)
 * Optimized for initial app load
 */
export async function fetchBatchInitData(): Promise<{
  exercises: Exercise[];
  categories: string[];
}> {
  try {
    const response = await api.get<{
      exercises: any[];
      categories: string[];
    }>('/api/v1/batch/init');

    const exercises = (response?.exercises || []).map((item: any) => {
      // Transform Directus format to Exercise format (same as fetchExercises)
      let imageData = undefined;
      if (item.image) {
        const imageId = typeof item.image === 'string' ? item.image : item.image.id;
        const imageTitle = typeof item.image === 'object' ? item.image.title : null;
        imageData = {
          url: `${DIRECTUS_URL}/assets/${imageId}`,
          alternativeText: imageTitle || item.name,
        };
      } else if (item.step_1_image) {
        const imageId = typeof item.step_1_image === 'string' ? item.step_1_image : item.step_1_image.id;
        const imageTitle = typeof item.step_1_image === 'object' ? item.step_1_image.title : null;
        imageData = {
          url: `${DIRECTUS_URL}/assets/${imageId}`,
          alternativeText: imageTitle || item.name,
        };
      }

      return {
        id: String(item.id),
        name: item.name || "",
        category: item.category?.name || "Без категории",
        description: item.description || "",
        image: imageData,
      };
    });

    const categories = (response?.categories || []).sort();

    logger.info('Batch init data loaded', {
      exercisesCount: exercises.length,
      categoriesCount: categories.length
    });

    return { exercises, categories };
  } catch (error) {
    logger.error("Failed to fetch batch init data:", error);
    throw error;
  }
}
