# 📋 Чек-лист перед каждым деплоем

**Используй этот чек-лист перед пушем изменений на production!**

Есть две части: для локального Claude и для production Claude.

---

## 🖥️ LOCAL DEVELOPMENT (Локальное развитие)

### Проверяю локально в консоли:

```bash
# 1️⃣ Linting - проверка кода
pnpm lint
# ✅ Должно быть: без ошибок

# 2️⃣ TypeScript - проверка типов
pnpm tsc --noEmit
# ✅ Должно быть: без ошибок

# 3️⃣ Build - сборка для production
pnpm build
# ✅ Должно быть: ✓ built in X.XXs

# 4️⃣ Проверка dist папки
du -sh dist/
ls -la dist/
# ✅ Должно быть: dist/ папка с index.html и assets/

# 5️⃣ Проверка API доступности
curl -s "https://strong.webtga.ru/api/items/exercises?limit=1" | jq '.data[0] | {id, name}'
# ✅ Должно быть: {"id": 1, "name": "..."}

# 6️⃣ Проверка env файлов
cat .env.local | grep VITE_DIRECTUS_URL
cat .env.production | grep VITE_DIRECTUS_URL
# ✅ Должно быть: https://strong.webtga.ru/api в обоих файлах
```

### Проверяю в браузере:

1. Открыть http://localhost:5173/
2. Открыть F12 (Dev Tools)
3. Вкладка **Console**:
   - ✅ Нет красных ошибок
   - ✅ Нет CORS ошибок
4. Вкладка **Network**:
   - ✅ Запросы на /api/items/exercises - статус 200
   - ✅ Запросы на /api/items/categories - статус 200
5. Функциональность:
   - ✅ Упражнения загружаются
   - ✅ Приложение не замирает
   - ✅ Нет белого экрана

### Git коммит:

```bash
# Проверить что нечего не забыл
git status

# Добавить файлы
git add .

# Коммит
git commit -m "Описание изменений"

# Пушить
git push origin main
```

### ✅ Локальные проверки пройдены?

Если всё зелено - пиши ✅ на сервере:

---

## 🖥️ PRODUCTION SERVER (Production сервер)

### Проверяю на сервере:

```bash
# 1️⃣ Git pull - скачать новые изменения
cd /tmp/super-strong
git pull origin main
# ✅ Должно быть: Already up to date. или новые коммиты

# 2️⃣ Проверить что коммиты на месте
git log --oneline -3
# ✅ Должны быть видны новые коммиты

# 3️⃣ Зависимости
pnpm install
# ✅ Должно быть: без ошибок

# 4️⃣ Build - собрать для production
pnpm build
# ✅ Должно быть: ✓ built in X.XXs

# 5️⃣ Проверить dist папка
ls -la dist/
du -sh dist/
# ✅ Должно быть: index.html и assets/ на месте

# 6️⃣ Копировать на web сервер
# Зависит от вашей конфигурации:
cp -r dist/* /var/www/strong.webtga.ru/
# или
docker cp dist/. nginx_container:/usr/share/nginx/html/

# 7️⃣ Проверить что скопировалось
ls -la /var/www/strong.webtga.ru/
# ✅ Должно быть: index.html и папка assets/

# 8️⃣ Проверить что Directus работает
curl -s https://strong.webtga.ru/api/items/categories | jq '.data | length'
# ✅ Должно быть: 8 (количество категорий)

curl -s https://strong.webtga.ru/api/items/exercises | jq '.data | length'
# ✅ Должно быть: количество упражнений
```

### Проверяю в браузере:

1. Открыть https://strong.webtga.ru/
2. Открыть F12 (Dev Tools)
3. Вкладка **Console**:
   - ✅ Нет красных ошибок
   - ✅ Нет CORS ошибок
4. Вкладка **Network**:
   - ✅ Запросы на /api/items/exercises - статус 200
   - ✅ Запросы на /api/items/categories - статус 200
5. Функциональность:
   - ✅ Упражнения загружаются
   - ✅ Приложение не замирает
   - ✅ Дизайн отображается правильно

### Проверить логи если ошибка:

```bash
# Nginx логи
tail -f /var/log/nginx/error.log

# Directus логи (если используешь Docker)
cd /root/directus
docker-compose logs -f directus

# Статус сервисов
systemctl status nginx
```

### ✅ Production проверки пройдены?

Если всё зелено - отправь результат:

---

## 📝 Результат

### ✅ УСПЕШНЫЙ ДЕПЛОЙ

```
✅ Локально: pnpm lint - OK
✅ Локально: pnpm build - OK
✅ Локально: упражнения загружаются в браузере
✅ GitHub: новый коммит залит
✅ Сервер: git pull - новые изменения
✅ Сервер: pnpm build - OK
✅ Сервер: dist/ скопирована на web server
✅ Production: https://strong.webtga.ru/ работает
✅ Production: упражнения загружаются
✅ Нет CORS и других ошибок

🎉 DEPLOYMENT COMPLETE! 🎉
```

### ❌ ОШИБКА - ЧТО ДЕЛАТЬ

```
❌ Локально lint не проходит?
   → Исправь ошибки, commit, git push

❌ Локально build падает?
   → Посмотри ошибку, исправь, git push

❌ На сервере git pull не работает?
   → Проверь что в правильной папке
   → git status посмотри

❌ На production белый экран?
   → Проверь console (F12)
   → Посмотри nginx логи
   → Проверь что dist/ правильно скопирована

❌ CORS ошибки в браузере?
   → На сервере проверь /root/directus/.env
   → DIRECTUS_CORS_ENABLED=true должно быть
   → docker-compose restart directus
```

---

## 🔄 Workflow для Двух Claude

### LOCAL CLAUDE:
1. Внести изменения
2. Проверить локально все команды выше
3. Если всё ✅ - git push
4. Написать: **"✅ LOCAL CHECKS PASSED"**
5. Дождаться результата production Claude

### PRODUCTION CLAUDE:
1. После локальных проверок запустить свои команды
2. Выполнить все проверки на сервере
3. Если всё ✅ - написать:

```markdown
✅ PRODUCTION CHECKS PASSED

- git pull: успешен
- pnpm build: OK
- dist/ скопирована
- https://strong.webtga.ru/ работает
- упражнения загружаются
- нет ошибок в консоли

🎉 READY FOR USERS!
```

4. Если что-то ❌ - описать ошибку и что делать

---

## 💡 Быстрая справка

**Что может пойти не так:**

| Проблема | Решение |
|----------|---------|
| `pnpm lint` падает | Исправить ошибки в коде |
| `pnpm build` падает | Проверить TypeScript типы |
| CORS ошибка | Перезагрузить Directus: `docker-compose restart` |
| Старая версия в браузере | Очистить кэш: Ctrl+Shift+Delete |
| dist/ не копируется | Проверить путь `/var/www/strong.webtga.ru/` |
| API недоступен | Проверить Directus запущен: `docker-compose ps` |

---

**🚀 Готов к деплою?**
