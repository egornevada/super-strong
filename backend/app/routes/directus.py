"""
API маршруты для интеграции с Directus
"""

from fastapi import APIRouter, HTTPException, status, Query, Request
from typing import Optional
import httpx
import logging

from app.services.directus import DirectusService
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["exercises-catalog"])


# ========== ВАЖНО: Специфичные маршруты должны быть ДО параметризованных ==========

@router.get("/health-check")
async def health_check():
    """Проверить соединение с Directus"""
    try:
        is_connected = await DirectusService.check_directus_connection()

        return {
            "status": "ok" if is_connected else "disconnected",
            "message": "Подключено к каталогу упражнений"
            if is_connected
            else "Не удалось подключиться к каталогу упражнений",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при проверке соединения: {str(e)}",
        )


@router.get("/search/{query}")
async def search_exercises(query: str):
    """
    Поиск упражнений по названию.

    Path параметры:
    - query: Строка для поиска
    """
    try:
        if not query or len(query) < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Строка поиска не может быть пустой",
            )

        result = await DirectusService.search_exercises(query)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Не удалось подключиться к каталогу упражнений",
            )

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при поиске упражнений: {str(e)}",
        )


@router.get("/categories")
async def get_categories():
    """Получить все категории упражнений"""
    try:
        result = await DirectusService.get_exercise_categories()

        if not result:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Не удалось подключиться к каталогу упражнений",
            )

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при получении категорий: {str(e)}",
        )


@router.get("/muscle-groups")
async def get_muscle_groups():
    """Получить все группы мышц"""
    try:
        result = await DirectusService.get_muscle_groups()

        if not result:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Не удалось подключиться к каталогу упражнений",
            )

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при получении групп мышц: {str(e)}",
        )


@router.get("/muscle-groups/{muscle_group_id}/exercises")
async def get_exercises_by_muscle_group(
    muscle_group_id: str,
):
    """
    Получить упражнения для определённой группы мышц.

    Path параметры:
    - muscle_group_id: ID группы мышц в Directus
    """
    try:
        result = await DirectusService.get_exercises_by_muscle_group(
            muscle_group_id
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Не удалось подключиться к каталогу упражнений",
            )

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при получении упражнений: {str(e)}",
        )


@router.get("/categories/{category_id}/exercises")
async def get_exercises_by_category(
    category_id: str,
):
    """
    Получить упражнения для определённой категории.

    Path параметры:
    - category_id: ID категории в Directus
    """
    try:
        result = await DirectusService.get_exercises_by_category(category_id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Не удалось подключиться к каталогу упражнений",
            )

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при получении упражнений: {str(e)}",
        )


# ========== УНИВЕРСАЛЬНЫЕ МАРШРУТЫ В КОНЦЕ ==========

@router.get("")
async def list_exercises(
    limit: int = 100,
    offset: int = 0,
    search: Optional[str] = None,
):
    """
    Получить список упражнений из каталога Directus.

    Query параметры:
    - limit: Максимальное количество упражнений (по умолчанию 100)
    - offset: Смещение для пагинации (по умолчанию 0)
    - search: Строка для поиска упражнения
    """
    try:
        if limit < 1 or limit > 1000:
            limit = 100
        if offset < 0:
            offset = 0

        result = await DirectusService.get_exercises(
            limit=limit,
            offset=offset,
            search=search,
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Не удалось подключиться к каталогу упражнений",
            )

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при получении упражнений: {str(e)}",
        )


@router.get("/{exercise_id}")
async def get_exercise(exercise_id: str):
    """
    Получить детали конкретного упражнения.

    Path параметры:
    - exercise_id: ID упражнения в Directus (UUID)
    """
    try:
        result = await DirectusService.get_exercise_by_id(exercise_id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Упражнение не найдено",
            )

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка при получении упражнения: {str(e)}",
        )


# ========== ПРОКСИ МАРШРУТЫ К DIRECTUS ==========
# Для совместимости с React фронтенд который использует пути типа /items/exercises

@router.api_route("/items/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_directus_request(
    path: str,
    request: Request,
):
    """
    Прокси маршрут для перенаправления запросов к Directus API.
    Использование: GET /api/v1/items/exercises?fields=...
    """
    try:
        # Получить query параметры из запроса
        query_params = dict(request.query_params) if request.query_params else {}

        # Построить URL для Directus - добавить items перед path
        directus_url = f"{settings.DIRECTUS_URL}/items/{path}"

        # Создать тело запроса если есть (для POST/PUT)
        body = None
        if request.method in ["POST", "PUT", "PATCH"]:
            body = await request.body()

        # Сделать запрос к Directus
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.request(
                method=request.method,
                url=directus_url,
                params=query_params,
                content=body,
                headers={
                    "Content-Type": "application/json",
                }
            )

            # Вернуть ответ от Directus как есть
            return response.json()
    except httpx.HTTPError as e:
        logger.error(f"Directus proxy error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Ошибка подключения к каталогу упражнений: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Proxy request error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при проксировании запроса: {str(e)}",
        )
