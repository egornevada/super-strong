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

interface StrapiImageData {
  id: number;
  attributes: {
    url: string;
    alternativeText?: string;
    caption?: string;
  };
}

interface StrapiExerciseAttributes {
  name: string;
  category: string;
  description?: string;
  image?: {
    data: StrapiImageData | null;
  };
}

interface StrapiExerciseItem {
  id: number;
  attributes: StrapiExerciseAttributes;
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

/**
 * Получить все упражнения из Strapi
 */
export async function fetchExercises(): Promise<Exercise[]> {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/exercises?populate=image`
    );

    if (!response.ok) {
      throw new Error(`Strapi error: ${response.statusText}`);
    }

    const data: StrapiResponse = await response.json();

    // Преобразуем формат Strapi в наш формат
    return data.data.map((item: StrapiExerciseItem) => ({
      id: String(item.id),
      name: item.attributes.name || "",
      category: item.attributes.category || "",
      image: item.attributes.image?.data
        ? {
            url: `${STRAPI_URL}${item.attributes.image.data.attributes.url}`,
            alternativeText:
              item.attributes.image.data.attributes.alternativeText || "",
          }
        : undefined,
      description: item.attributes.description || "",
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
      `${STRAPI_URL}/api/exercises?filters[category][$eq]=${encodeURIComponent(
        category
      )}&populate=image`
    );

    if (!response.ok) {
      throw new Error(`Strapi error: ${response.statusText}`);
    }

    const data: StrapiResponse = await response.json();

    return data.data.map((item: StrapiExerciseItem) => ({
      id: String(item.id),
      name: item.attributes.name || "",
      category: item.attributes.category || "",
      image: item.attributes.image?.data
        ? {
            url: `${STRAPI_URL}${item.attributes.image.data.attributes.url}`,
            alternativeText:
              item.attributes.image.data.attributes.alternativeText || "",
          }
        : undefined,
      description: item.attributes.description || "",
    }));
  } catch (error) {
    console.error("Failed to fetch exercises from Strapi:", error);
    throw error;
  }
}

/**
 * Получить все категории
 */
export async function fetchCategories(): Promise<string[]> {
  try {
    const response = await fetch(`${STRAPI_URL}/api/exercises`);

    if (!response.ok) {
      throw new Error(`Strapi error: ${response.statusText}`);
    }

    const data: StrapiResponse = await response.json();

    // Получаем уникальные категории
    const categories = new Set<string>();
    data.data.forEach((item: StrapiExerciseItem) => {
      const category = item.attributes.category;
      if (category) categories.add(category);
    });

    return Array.from(categories).sort();
  } catch (error) {
    console.error("Failed to fetch categories from Strapi:", error);
    throw error;
  }
}
