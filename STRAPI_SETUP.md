# Интеграция Strapi

Этот проект использует Strapi CMS для управления данными упражнений.

## Установка Strapi

### 1. Создать новый проект Strapi

```bash
npm create strapi-app@latest super-strong-cms -- --ts
```

### 2. Запустить Strapi

```bash
cd super-strong-cms
npm run develop
```

Strapi будет доступен на `http://localhost:1337`

## Настройка контента

### Создать Content Type "Exercise"

1. Перейти в Admin Panel (`http://localhost:1337/admin`)
2. Нажать на "Content-Type Builder"
3. Создать новый Collection Type "Exercise" с полями:

| Поле | Тип | Обязательно |
|------|-----|------------|
| name | String | Да |
| category | String | Да |
| description | Text | Нет |
| image | Media | Нет |

### Установить права доступа

1. В админ панели перейти в "Settings" → "Users & Permissions" → "Roles"
2. Отредактировать роль "Public"
3. В разделе "Exercise" включить:
   - `find` (получить список)
   - `findOne` (получить одно упражнение)

## Переменные окружения

Создать файл `.env.local` в корне проекта (если его еще нет):

```env
VITE_STRAPI_URL=http://localhost:1337
```

## API эндпоинты

Сервис использует следующие эндпоинты:

- `GET /api/exercises?populate=image` - получить все упражнения
- `GET /api/exercises?filters[category][$eq]=Грудь&populate=image` - получить упражнения по категории

## Структура данных

Упражнение в коде:

```typescript
interface Exercise {
  id: string;
  name: string;
  category: string;
  image?: {
    url: string;
    alternativeText?: string;
  };
  description?: string;
}
```

## Тестирование

После установки и запуска Strapi:

1. Добавить несколько упражнений через админ панель
2. Убедиться, что они имеют категории (например: "Грудь", "Спина")
3. Загрузить изображения для упражнений

Приложение автоматически загрузит данные при загрузке страницы упражнений.

## Решение проблем

### Ошибка CORS

Если получаете ошибку CORS, отредактируйте `config/middlewares.js` в проекте Strapi:

```javascript
module.exports = [
  'strapi::errors',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: ['http://localhost:5173', 'http://localhost:3000'], // Добавить адреса вашего приложения
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'X-Frame-Options'],
    },
  },
  // ... остальные middleware
];
```

### API недоступен

Убедитесь, что:
1. Strapi запущен на `http://localhost:1337`
2. Переменная `VITE_STRAPI_URL` установлена правильно
3. Браузер консоль не показывает ошибки CORS
