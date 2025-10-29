# ✅ Чек-лист перед деплоем на production

Используй этот чек-лист перед тем как пушить изменения на production сервер.

---

## 📋 LOCAL DEVELOPMENT (Локальная разработка)

### 1️⃣ Код и изменения

- [ ] Все изменения внесены в src/ папку
- [ ] Нет синтаксических ошибок
- [ ] Компонеры используют production Directus API
- [ ] Нет console.error или console.log в продакшене (или обернуты в if)

**Команда проверки:**
```bash
pnpm lint
```

### 2️⃣ Локальная проверка

- [ ] `pnpm install` выполнен без ошибок
- [ ] `pnpm dev` запущен на http://localhost:5173/
- [ ] Приложение загружается без белого экрана
- [ ] Нет CORS ошибок в консоли браузера
- [ ] Упражнения загружаются с production API
- [ ] Все функции работают как ожидается

**Команды проверки:**
```bash
# Установка зависимостей
pnpm install

# Запуск dev сервера
pnpm dev

# Проверка в браузере: http://localhost:5173/
# Открыть F12 → Console и Network
# Убедиться что нет ошибок и упражнения загружаются
```

### 3️⃣ Сборка для production

- [ ] `pnpm build` выполняется без ошибок
- [ ] Нет типов ошибок TypeScript
- [ ] Сборка создает dist/ папку
- [ ] Размер бандла разумный (не огромный)

**Команда проверки:**
```bash
pnpm build
```

**Ожидаемый результат:**
```
vite v7.1.12 building for production...
✓ 1234 modules transformed.
dist/index.html        2.50 kB │ gzip:  0.95 kB
dist/assets/main.xxx.js 125.34 kB │ gzip: 40.23 kB

✓ built in 5.23s
```

### 4️⃣ Environment файлы

- [ ] `.env.local` использует production URL: `https://strong.webtga.ru/api`
- [ ] `.env.production` содержит то же значение
- [ ] `.env.local` **НЕ** в Git (в .gitignore)
- [ ] `.env.production` **ЕСТЬ** в Git (содержит только public URL)

**Проверка:**
```bash
cat .env.local
cat .env.production
git status
# .env.local не должен быть в списке
```

### 5️⃣ Git коммит

- [ ] Все необходимые файлы добавлены
- [ ] Коммит имеет описательное сообщение
- [ ] Нет чувствительных данных в коммите
- [ ] Коммит пушен на GitHub

**Команды:**
```bash
git status
git add <файлы>
git commit -m "Описание изменений"
git push origin main
```

---

## 🖥️ PRODUCTION SERVER (Сервер)

### 6️⃣ Скачивание изменений

- [ ] SSH доступ к серверу работает
- [ ] Перейти в папку приложения: `cd /tmp/super-strong`
- [ ] Скачать последние изменения: `git pull origin main`
- [ ] Новые файлы на сервере

**Команды на сервере:**
```bash
cd /tmp/super-strong
git pull origin main
git log --oneline -3
# Убедиться что новый коммит есть
```

### 7️⃣ Зависимости и сборка

- [ ] `pnpm install` без ошибок
- [ ] `pnpm build` создает новый dist/
- [ ] Нет ошибок при сборке
- [ ] Сборка завершилась успешно

**Команды на сервере:**
```bash
pnpm install
pnpm build
ls -la dist/
# dist/ должна быть обновлена
```

### 8️⃣ Деплой файлов

- [ ] dist/ скопирована на web сервер
- [ ] Файлы имеют правильные permissions
- [ ] index.html на месте
- [ ] CSS/JS файлы на месте

**Команды на сервере (зависит от вашей конфигурации):**
```bash
# Пример для Nginx
cp -r dist/* /var/www/strong.webtga.ru/

# Или для Docker
docker cp dist/. nginx_container:/usr/share/nginx/html/

# Проверка
ls -la /var/www/strong.webtga.ru/
```

### 9️⃣ Проверка Directus доступности

- [ ] Production Directus запущен и доступен
- [ ] CORS настроен правильно
- [ ] API возвращает упражнения

**Команды на сервере:**
```bash
# Проверить что Directus запущен
curl -s https://strong.webtga.ru/api/items/categories | jq '.data | length'

# Должно вывести количество категорий (8)
```

### 🔟 Production проверка в браузере

- [ ] Открыть https://strong.webtga.ru/
- [ ] Приложение загружается без белого экрана
- [ ] Нет CORS ошибок в консоли (F12)
- [ ] Упражнения загружаются с API
- [ ] Функциональность работает
- [ ] Дизайн отображается правильно

**Проверки в браузере:**
```javascript
// В консоли браузера (F12 → Console):
// Должны быть видны запросы на /api/items/exercises

// Network tab → проверить запросы:
// ✅ GET /api/items/exercises - 200
// ✅ GET /api/items/categories - 200
// ❌ Нет CORS ошибок
```

---

## 🚨 Если что-то не работает

### ❌ Белый экран

**На локальном:**
```bash
pnpm dev
# Открыть http://localhost:5173/
# F12 → Console → посмотреть ошибки
```

**На сервере:**
```bash
# Проверить что dist/ скопирована
ls -la /var/www/strong.webtga.ru/

# Проверить Nginx логи
tail -f /var/log/nginx/error.log
```

### ❌ CORS ошибки

**На сервере нужно проверить Directus:**
```bash
# В .env должно быть
DIRECTUS_CORS_ENABLED=true
DIRECTUS_CORS_ORIGIN=*
# или
DIRECTUS_CORS_ORIGIN=http://localhost:5173,https://strong.webtga.ru

# Перезагрузить
cd /root/directus
docker-compose restart directus
```

### ❌ 404 на assets

**Проверить что dist/ копируется с assets:**
```bash
ls -la /var/www/strong.webtga.ru/assets/
# должны быть файлы
```

### ❌ Старая версия на сервере

**Очистить кэш браузера:**
- Ctrl+Shift+Delete (Windows)
- Cmd+Shift+Delete (Mac)
- Выбрать "All time"

**Проверить что новые файлы на сервере:**
```bash
ls -la /var/www/strong.webtga.ru/assets/ | tail -5
# Должны быть свежие файлы
```

---

## 📊 Итоговый результат

### ✅ Если всё прошло

```
✅ Локально: pnpm build успешен
✅ Git: коммит залит на GitHub
✅ Сервер: git pull скачал изменения
✅ Сервер: pnpm build создал новую сборку
✅ Сервер: dist/ скопирована на web server
✅ Production: https://strong.webtga.ru/ работает
✅ API: упражнения загружаются

🎉 DEPLOYMENT УСПЕШЕН!
```

### ❌ Если есть проблемы

```
❌ Ошибка на локальном → git push ОТМЕНИТЬ
❌ Ошибка на сервере → git revert последний коммит
❌ Ошибка в браузере → проверить консоль и сеть
```

---

## 🔄 Workflow для Двух Claude

### LOCAL CLAUDE (ты):
1. ✅ Сделай изменения в коде
2. ✅ Проверь локально: `pnpm dev`
3. ✅ Проверь сборку: `pnpm build`
4. ✅ Отметь все пункты 1-5 выше
5. ✅ Git push
6. **Дай знать PRODUCTION CLAUDE**

### PRODUCTION CLAUDE (другой):
1. ✅ Скачай изменения: `git pull`
2. ✅ Установи зависимости: `pnpm install`
3. ✅ Собери: `pnpm build`
4. ✅ Деплой: `cp -r dist/* /var/www/...`
5. ✅ Отметь пункты 6-10 выше
6. 📝 **Отправь результат:**

```markdown
✅ ВСЕ ХОРОШО!
- git pull: успешен
- pnpm build: 0 ошибок
- assets скопированы
- https://strong.webtga.ru/ работает
- упражнения загружаются
- нет CORS ошибок

🎉 READY FOR PRODUCTION!
```

---

## 💡 Советы

1. **Перед деплоем** всегда проверь на локальном `pnpm build`
2. **На сервере** делай `git pull` в правильной папке
3. **CORS** настраивается один раз, потом забываешь про него
4. **Кэш браузера** очищай Ctrl+Shift+Delete если видишь старую версию
5. **Логи** всегда в помощь:
   - Локально: `pnpm dev` выведет ошибки
   - Сервер: `tail -f /var/log/nginx/error.log`
   - Directus: `docker-compose logs -f directus`

---

**Готов к деплою?** 🚀
