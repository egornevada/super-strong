const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || "http://localhost:1337";

export interface Exercise {
  id: string;
  name: string;
  category: string;
  image?: {
    url: string;
    alternativeText?: string;
  };
  description?: string;
}

interface StrapiExerciseItem {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  muscleGroup?: {
    id: number;
    documentId: string;
    name: string;
    slug: string;
  } | null;
}

interface StrapiResponse {
  data: StrapiExerciseItem[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiMuscleGroup {
  id: number;
  documentId: string;
  name: string;
  slug: string;
}

/**
 * Получить все упражнения из Strapi
 */
export async function fetchExercises(): Promise<Exercise[]> {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/exercises?populate=muscleGroup`
    );

    if (!response.ok) {
      throw new Error(`Strapi error: ${response.statusText}`);
    }

    const data: StrapiResponse = await response.json();

    // Преобразуем формат Strapi в наш формат
    return data.data.map((item: StrapiExerciseItem) => ({
      id: String(item.id),
      name: item.name || "",
      category: item.muscleGroup?.name || "Unknown",
      description: item.description || "",
    }));
  } catch (error) {
    console.error("Failed to fetch exercises from Strapi:", error);
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
      `${STRAPI_URL}/api/exercises`
    );

    if (!response.ok) {
      throw new Error(`Strapi error: ${response.statusText}`);
    }

    const data: StrapiResponse = await response.json();

    // TODO: Filter by muscleGroup when relation is available
    return data.data.map((item: StrapiExerciseItem) => ({
      id: String(item.id),
      name: item.name || "",
      category: category,
      description: item.description || "",
    }));
  } catch (error) {
    console.error("Failed to fetch exercises from Strapi:", error);
    throw error;
  }
}

/**
 * Получить все категории (группы мышц)
 */
export async function fetchCategories(): Promise<string[]> {
  try {
    const response = await fetch(`${STRAPI_URL}/api/muscle-groups`);

    if (!response.ok) {
      throw new Error(`Strapi error: ${response.statusText}`);
    }

    const data = await response.json();

    // Получаем названия всех групп мышц
    const categories = data.data.map((item: StrapiMuscleGroup) => item.name);

    return categories.sort();
  } catch (error) {
    console.error("Failed to fetch categories from Strapi:", error);
    throw error;
  }
}
