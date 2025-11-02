# Quick Start - Развертывание на Production

## TL;DR - За 10 минут

### На сервере (Backend)

```bash
# 1. Скопировать файлы
git clone https://github.com/your-repo/super-strong.git
cd super-strong

# 2. Создать .env
cat > .env << 'EOF'
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
PGRST_DB_URI=postgres://postgres:YOUR_SECURE_PASSWORD@postgres:5432/super_strong
PGRST_JWT_SECRET=$(openssl rand -base64 32)
EOF

# 3. Запустить
docker-compose up -d

# 4. Проверить
curl http://localhost:3000/users
```

**✅ Backend готов!**

### На клиенте (Frontend)

```bash
# 1. Установить переменные
cat > .env << 'EOF'
VITE_API_URL=https://api.your-domain.com
VITE_DIRECTUS_URL=https://directus.your-domain.com
EOF

# 2. Собрать
npm install
npm run build

# 3. Развернуть на Vercel
vercel --prod

# Или на своём nginx сервере
scp -r dist/* user@server:/var/www/super-strong/
```

**✅ Frontend готов!**

---

## Полная инструкция

### Шаг за шагом (Backend)

**1. Выбрать вариант развертывания**

- **Docker Compose** (рекомендуется) - самый простой
- **Ручная установка** - для серверов без Docker
- **Managed Services** - AWS RDS + Lambda

Читай `SERVER_DEPLOYMENT_GUIDE.md`

**2. Подготовить сервер**

```bash
# Docker вариант
sudo apt install docker.io docker-compose
git clone <repo>
cd super-strong
```

**3. Запустить базу и API**

```bash
docker-compose up -d
docker-compose logs -f  # проверить логи
```

**4. Проверить что работает**

```bash
curl http://localhost:3000/users
# Должен ответить JSON
```

---

### Шаг за шагом (Frontend)

**1. Настроить переменные окружения**

```bash
# .env в корне проекта
VITE_API_URL=https://api.your-domain.com
VITE_DIRECTUS_URL=https://directus.your-domain.com
```

**2. Выбрать где развернуть**

- **Vercel** (рекомендуется) - 1 клик, бесплатно
- **Netlify** - похоже на Vercel
- **Свой nginx** - полный контроль
- **Docker** - всё в контейнере

Читай `FRONTEND_DEPLOYMENT_GUIDE.md`

**3. Развернуть**

```bash
# Vercel вариант
npm install -g vercel
vercel --prod

# Или собрать и залить на свой сервер
npm run build
scp -r dist/* user@server:/var/www/super-strong/
```

**4. Проверить что работает**

Открыть приложение в браузере → должно работать!

---

## Архитектура

```
┌─────────────────────────────────────────────┐
│          User's Browser                      │
│  (Frontend React + TypeScript)              │
└──────────────────┬──────────────────────────┘
                   │
                   │ HTTPS
                   ↓
┌─────────────────────────────────────────────┐
│     nginx / Vercel / Netlify                │
│     (Static hosting + CORS proxy)           │
└──────────────────┬──────────────────────────┘
                   │
                   │ HTTPS
                   ↓
┌─────────────────────────────────────────────┐
│          PostgREST API                       │
│   (Auto-generated REST API from DB)         │
└──────────────────┬──────────────────────────┘
                   │
                   │ TCP:5432
                   ↓
┌─────────────────────────────────────────────┐
│        PostgreSQL Database                   │
│  (users, workouts, workout_sets tables)    │
└─────────────────────────────────────────────┘
```

---

## Что нужно изменить в коде

**Если API на другом адресе:**

Отредактировать `src/lib/api.ts`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
//                      ↓
//              Это заменяется переменной окружения
```

**Если Directus на другом адресе:**

Отредактировать `src/services/directusApi.ts`:

```typescript
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || "http://localhost:8055";
```

---

## Безопасность

### ОБЯЗАТЕЛЬНО выполнить:

1. ✅ Изменить пароли PostgreSQL
2. ✅ Генерировать JWT secret: `openssl rand -base64 32`
3. ✅ Включить HTTPS (Let's Encrypt)
4. ✅ Настроить Firewall
5. ✅ Обновить PostgreSQL и PostgREST

Полная информация в `SERVER_DEPLOYMENT_GUIDE.md`

---

## Проверка что всё работает

```bash
# 1. Backend доступен
curl https://api.your-domain.com/users

# 2. Frontend загружается
open https://your-domain.com

# 3. DevTools Console показывает, что данные загружаются
# Нет CORS ошибок
# Нет 404 на API запросы

# 4. Можно авторизоваться и создавать тренировки
```

---

## Troubleshooting

| Проблема | Решение |
|---|---|
| 404 на `/users` | Миграции БД не применены. Запусти `docker-compose down && docker-compose up -d` |
| CORS ошибка | PostgREST не доступен. Проверь `VITE_API_URL` и что PostgREST запущен |
| Белый экран | Открой DevTools Console и ищи ошибки |
| БД не запускается | Проверь пароль в .env и что порт 5432 свободен |

---

## Дальше

- **Логирование**: Настроить CloudWatch / ELK
- **Бэкапы**: Автоматический pg_dump каждый день
- **Мониторинг**: Uptime monitoring (Updown.io, StatusPage)
- **CDN**: CloudFlare для быстрой доставки
- **Масштабирование**: Если много юзеров - добавить кэш (Redis)

---

**Версия**: 1.0
**Дата**: 2025-11-02
**Для Super Strong v0.0.0**
