# ✅ Чеклист миграции данных на production

## Информация о сервере

- **Домен:** https://strong.webtga.ru/
- **Администратор Email:** admin@strong.webtga.ru
- **Директория Directus:** /root/directus/
- **API endpoint:** https://strong.webtga.ru/api/
- **Admin panel:** https://strong.webtga.ru/api/admin

---

## Файлы для загрузки

- [ ] **export-categories.json** - содержит 8 категорий
- [ ] **export-exercises.json** - содержит 16 упражнений
- [ ] **import-data.sh** - bash скрипт для импорта

**Всего:** 3 файла на загрузку

---

## Выполнение на сервере (по порядку)

### 1️⃣ Загрузка файлов

- [ ] Загрузить export-categories.json в /root/directus/
- [ ] Загрузить export-exercises.json в /root/directus/
- [ ] Загрузить import-data.sh в /root/directus/

**Проверка:**
```bash
ls -la /root/directus/ | grep export
ls -la /root/directus/ | grep import
```

### 2️⃣ Подготовка скрипта

- [ ] Сделать скрипт исполняемым
```bash
chmod +x /root/directus/import-data.sh
```

- [ ] Проверить права доступа
```bash
ls -l /root/directus/import-data.sh
# Должно быть: -rwxr-xr-x (755)
```

### 3️⃣ Запуск импорта

- [ ] Перейти в директорию
```bash
cd /root/directus
```

- [ ] Найти пароль администратора
  - Это значение переменной DIRECTUS_ADMIN_PASSWORD из файла .env на сервере
  - Спроси у того, кто деплоил

- [ ] Запустить команду импорта
```bash
./import-data.sh https://strong.webtga.ru admin@strong.webtga.ru ПАРОЛЬ_АДМИНА
```

**Ожидаемый результат:**
```
🔐 Authenticating to Directus...
✅ Authenticated: eyJ0eXAiOiJKV1QiLCJhbGc...
📋 Importing categories...
8
✅ Categories imported
💪 Importing exercises...
16
✅ Exercises imported
🎉 Import complete!
```

### 4️⃣ Проверка результата

- [ ] Проверить количество категорий (должно быть 8)
```bash
curl -s https://strong.webtga.ru/api/items/categories | jq '.data | length'
```

- [ ] Проверить количество упражнений (должно быть 16)
```bash
curl -s https://strong.webtga.ru/api/items/exercises | jq '.data | length'
```

- [ ] Показать все категории
```bash
curl -s https://strong.webtga.ru/api/items/categories | jq '.data[] | {id, name}'
```

- [ ] Показать первое упражнение
```bash
curl -s https://strong.webtga.ru/api/items/exercises | jq '.data[0]'
```

### 5️⃣ Проверка в админ панели

- [ ] Откройте браузер: https://strong.webtga.ru/api/admin
- [ ] Логин: admin@strong.webtga.ru
- [ ] Пароль: (из .env DIRECTUS_ADMIN_PASSWORD)
- [ ] Проверить что видны:
  - [ ] 8 категорий в разделе "Categories"
  - [ ] 16 упражнений в разделе "Exercises"
  - [ ] Каждое упражнение привязано к нужной категории

---

## Решение проблем

### ❌ "Authentication failed"

**Причина:** неправильный пароль администратора

**Решение:**
1. Проверь пароль в файле .env (переменная DIRECTUS_ADMIN_PASSWORD)
2. Убедись что скопировал пароль без пробелов
3. Если забыл пароль - нужно изменить в .env и перезагрузить Directus:
```bash
cd /root/directus
docker-compose restart directus
```

### ❌ "jq: command not found"

**Причина:** программа jq не установлена

**Решение:**
```bash
apt-get update && apt-get install -y jq curl
```

### ❌ "Permission denied"

**Причина:** скрипт не имеет прав на исполнение

**Решение:**
```bash
chmod +x /root/directus/import-data.sh
ls -l /root/directus/import-data.sh
```

### ❌ "No such file or directory"

**Причина:** файлы не загружены или находятся в другой папке

**Решение:**
```bash
ls -la /root/directus/
# Должны быть видны:
# - export-categories.json
# - export-exercises.json
# - import-data.sh
```

### ❌ Скрипт запустился, но импорт не произошел

**Проверка что импортировалось:**
```bash
# Если категории есть
curl -s https://strong.webtga.ru/api/items/categories | jq '.data | length'

# Если упражнения есть
curl -s https://strong.webtga.ru/api/items/exercises | jq '.data | length'
```

### ❌ CORS ошибка при загрузке упражнений в приложении

**Причина:** может быть проблема с доступом к API

**Решение:**
1. Убедись что DIRECTUS_CORS включен в .env
2. Проверь что API доступен:
```bash
curl -s https://strong.webtga.ru/api/items/categories
```

---

## Успех! ✅

Если все шаги выполнены правильно, то:
- ✅ 8 категорий импортированы
- ✅ 16 упражнений импортированы
- ✅ Все упражнения привязаны к категориям
- ✅ Приложение загружает данные с production сервера

**Следующий шаг:** Тестирование приложения на production домене https://strong.webtga.ru/

---

## Контактная информация

Если возникли проблемы:
1. Проверь каждый пункт в чеклисте
2. Посмотри раздел "Решение проблем"
3. Обратись к разработчику с логами из терминала
