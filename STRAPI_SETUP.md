# Интеграция Strapi

Этот проект использует Strapi CMS для управления данными упражнений.

Strapi уже установлен в папке `../super-strong-cms` на одном уровне с основным проектом.

## Запуск Strapi

Из папки `super-strong-cms` запустите:

```bash
npm run develop
```

Strapi будет доступен на `http://localhost:1337` и автоматически откроет админ панель в браузере

## Настройка контента

### Контент тип "Exercise" уже создан!

Контент тип автоматически создан скриптом `scripts/create-content-type.js`. Он содержит следующие поля:

| Поле | Тип | Описание |
|------|-----|---------|
| name | String | Название упражнения |
| category | String | Категория (например: "Грудь", "Спина") |
| description | Text | Описание упражнения |
| image | Media | Изображение упражнения |

### Добавить упражнения

1. Откройте админ панель Strapi: `http://localhost:1337/admin`
2. В левом меню найдите "Exercise"
3. Нажмите "Create new entry"
4. Заполните данные упражнения и нажмите "Save"

Или используйте готовый скрипт для заполнения данными:
```bash
cd super-strong-cms
node scripts/seed-exercises.js
```

### Установить права доступа (важно!)

1. В админ панели перейти в "Settings" → "Users & Permissions Plugin" → "Roles"
2. Отредактировать роль "Public"
3. Найти "Exercise" и включить:
   - ✅ find (получить список)
   - ✅ findOne (получить одно упражнение)
4. Сохранить изменения

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
