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
    const response = await fetch(
      `${DIRECTUS_URL}/items/exercises?fields=*,category.id,category.name,image.id,image.filename_disk&limit=-1`
    );

    if (!response.ok) {
      throw new Error(`Directus error: ${response.statusText}`);
    }

    const data: DirectusResponse<DirectusExercise> = await response.json();

    // Преобразуем формат Directus в наш формат
    return data.data.map((item: DirectusExercise) => ({
      id: item.id,
      name: item.name || "",
      category: item.category?.name || "Без категории",
      description: item.description || "",
      image: item.image
        ? {
            url: getImageUrl(item.image.id),
            alternativeText: item.image.title || item.name,
          }
        : undefined,
    }));
  } catch (error) {
    console.error("Failed to fetch exercises from Directus:", error);
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
    const response = await fetch(
      `${DIRECTUS_URL}/items/exercises?fields=*,category.id,category.name,image.id,image.filename_disk&filter[category][name][_eq]=${encodeURIComponent(category)}&limit=-1`
    );

    if (!response.ok) {
      throw new Error(`Directus error: ${response.statusText}`);
    }

    const data: DirectusResponse<DirectusExercise> = await response.json();

    return data.data.map((item: DirectusExercise) => ({
      id: item.id,
      name: item.name || "",
      category: category,
      description: item.description || "",
      image: item.image
        ? {
            url: getImageUrl(item.image.id),
            alternativeText: item.image.title || item.name,
          }
        : undefined,
    }));
  } catch (error) {
    console.error("Failed to fetch exercises by category from Directus:", error);
    throw error;
  }
}

/**
 * Получить все категории
 */
export async function fetchCategories(): Promise<string[]> {
  try {
    const response = await fetch(`${DIRECTUS_URL}/items/categories?fields=id,name&limit=-1`);

    if (!response.ok) {
      throw new Error(`Directus error: ${response.statusText}`);
    }

    const data: DirectusResponse<DirectusCategory> = await response.json();

    // Получаем названия всех категорий
    const categories = data.data.map((item: DirectusCategory) => item.name);

    return categories.sort();
  } catch (error) {
    console.error("Failed to fetch categories from Directus:", error);
    throw error;
  }
}

/**
 * Получить одно упражнение по ID
 */
export async function fetchExerciseById(id: string): Promise<Exercise> {
  try {
    const response = await fetch(
      `${DIRECTUS_URL}/items/exercises/${id}?fields=*,category.id,category.name,image.id,image.filename_disk`
    );

    if (!response.ok) {
      throw new Error(`Directus error: ${response.statusText}`);
    }

    const data = await response.json();
    const item: DirectusExercise = data.data;

    return {
      id: item.id,
      name: item.name || "",
      category: item.category?.name || "Без категории",
      description: item.description || "",
      image: item.image
        ? {
            url: getImageUrl(item.image.id),
            alternativeText: item.image.title || item.name,
          }
        : undefined,
    };
  } catch (error) {
    console.error("Failed to fetch exercise by ID from Directus:", error);
    throw error;
  }
}
