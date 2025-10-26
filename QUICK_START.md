# Быстрый старт

## Шаг 1: Запустить оба сервера

### Терминал 1 - Основной проект:
```bash
cd /Users/egornevada/Desktop/super-strong
pnpm dev
```
Приложение откроется на `http://localhost:5173`

### Терминал 2 - Strapi CMS:
```bash
cd /Users/egornevada/Desktop/super-strong-cms
npm run develop
```
Админ панель откроется на `http://localhost:1337/admin`

## Шаг 2: Настроить права доступа в Strapi

1. Откройте http://localhost:1337/admin
2. В меню слева нажмите **Settings** (иконка шестеренки)
3. Найдите **Users & Permissions Plugin** → **Roles**
4. Выберите роль **Public**
5. Прокрутите вниз и найдите **Exercise**
6. Включите (поставьте галочки):
   - ✅ **find** (получить список упражнений)
   - ✅ **findOne** (получить одно упражнение)
7. Нажмите **Save** (зеленая кнопка вверху справа)

## Шаг 3: Добавить упражнения

### Вариант А: Вручную через админ панель

1. В админ панели нажмите **Content Manager**
2. В левом меню найдите **Exercise**
3. Нажмите **Create new entry** (зеленая кнопка)
4. Заполните:
   - **name**: название упражнения (например "Жим в тренажере")
   - **category**: категория (например "Грудь")
   - **description**: описание (опционально)
   - **image**: загрузить изображение (опционально)
5. Нажмите **Save**

### Вариант Б: Использовать скрипт для заполнения

```bash
cd /Users/egornevada/Desktop/super-strong-cms
node scripts/seed-exercises.js
```

## Шаг 4: Готово!

Приложение должно загрузиться с упражнениями из Strapi. Проверьте, что в браузере на `http://localhost:5173` видны упражнения в календаре.

## Решение проблем

### Белый экран в приложении

- Убедитесь, что Strapi запущен на `http://localhost:1337`
- Проверьте консоль браузера (F12) на ошибки
- Убедитесь, что права доступа для Public роли включены

### Нет упражнений в Strapi

- Убедитесь, что вы добавили хотя бы одно упражнение
- Проверьте, что оно опубликовано (если используется Draft & Publish)

### CORS ошибка

Если видите ошибку о CORS, отредактируйте `/Users/egornevada/Desktop/super-strong-cms/config/middlewares.js` и добавьте:

```javascript
{
  name: 'strapi::cors',
  config: {
    enabled: true,
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
},
```

Затем перезагрузите Strapi.

## Полезные ссылки

- Админ панель Strapi: http://localhost:1337/admin
- API упражнений: http://localhost:1337/api/exercises
- Приложение: http://localhost:5173
