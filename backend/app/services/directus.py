"""
Сервис для интеграции с Directus API
"""

import httpx
import logging
from typing import Optional, List, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)


class DirectusService:
    """Сервис для работы с Directus CMS"""

    BASE_URL = settings.DIRECTUS_URL
    TIMEOUT = 10

    @staticmethod
    async def _make_request(
        method: str,
        endpoint: str,
        **kwargs,
    ) -> Optional[Dict[str, Any]]:
        """Сделать HTTP запрос к Directus API"""
        # Путь к Directus API совпадает с React: без /api
        url = f"{DirectusService.BASE_URL}/{endpoint}"

        try:
            async with httpx.AsyncClient(timeout=DirectusService.TIMEOUT) as client:
                response = await client.request(method, url, **kwargs)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Directus API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Error making request to Directus: {e}")
            return None

    @staticmethod
    async def get_exercises(
        limit: int = 100,
        offset: int = 0,
        search: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Получить список упражнений из Directus API.

        Args:
            limit: Максимальное количество упражнений
            offset: Смещение для пагинации
            search: Строка для поиска
        """
        # Построить query параметры как строку
        query_params = f"limit={limit}&offset={offset}"

        if search:
            # Directus фильтр синтаксис
            query_params += f"&filter[name][_icontains]={search}"

        # Добавить токен если есть (пока что без токена)
        # if settings.DIRECTUS_API_TOKEN:
        #     query_params += f"&access_token={settings.DIRECTUS_API_TOKEN}"

        response = await DirectusService._make_request(
            "GET",
            f"items/exercises?{query_params}",
        )

        return response

    @staticmethod
    async def get_exercise_by_id(exercise_id: str) -> Optional[Dict[str, Any]]:
        """
        Получить упражнение по ID.

        Args:
            exercise_id: ID упражнения в Directus (UUID)
        """
        response = await DirectusService._make_request(
            "GET",
            f"items/exercises/{exercise_id}",
        )

        return response

    @staticmethod
    async def get_exercise_categories() -> Optional[Dict[str, Any]]:
        """Получить категории упражнений"""
        response = await DirectusService._make_request(
            "GET",
            "items/categories",
            params={"limit": 100},
        )

        return response

    @staticmethod
    async def get_muscle_groups() -> Optional[Dict[str, Any]]:
        """Получить группы мышц"""
        # Примечание: может не существовать в этом Directus
        response = await DirectusService._make_request(
            "GET",
            "items/muscle_groups",
            params={"limit": 100},
        )

        return response

    @staticmethod
    async def search_exercises(query: str) -> Optional[Dict[str, Any]]:
        """
        Поиск упражнений по названию.

        Args:
            query: Строка поиска
        """
        response = await DirectusService._make_request(
            "GET",
            "items/exercises",
            params={
                "filter": f'name[contains],"{query}"',
                "limit": 50,
            },
        )

        return response

    @staticmethod
    async def get_exercises_by_muscle_group(
        muscle_group_id: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Получить упражнения для определённой группы мышц.

        Args:
            muscle_group_id: ID группы мышц в Directus
        """
        response = await DirectusService._make_request(
            "GET",
            "items/exercises",
            params={
                "filter": f"muscle_groups_id[in],{muscle_group_id}",
                "limit": 100,
            },
        )

        return response

    @staticmethod
    async def get_exercises_by_category(
        category_id: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Получить упражнения для определённой категории.

        Args:
            category_id: ID категории в Directus
        """
        response = await DirectusService._make_request(
            "GET",
            "items/exercises",
            params={
                "filter": f"category_id[in],{category_id}",
                "limit": 100,
            },
        )

        return response

    @staticmethod
    async def get_full_exercise_data(exercise_id: str) -> Optional[Dict[str, Any]]:
        """
        Получить полные данные упражнения с иконой, видео и т.д.

        Args:
            exercise_id: ID упражнения в Directus
        """
        response = await DirectusService._make_request(
            "GET",
            f"items/exercises/{exercise_id}",
            params={
                "fields": "*,muscle_groups_id.*,category_id.*",
            },
        )

        return response

    @staticmethod
    async def check_directus_connection() -> bool:
        """Проверить соединение с Directus"""
        try:
            response = await DirectusService._make_request(
                "GET",
                "server/info",
            )
            return response is not None
        except Exception:
            return False
