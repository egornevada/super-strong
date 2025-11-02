# Production Setup - Пошаговая инструкция

## 📋 Архитектура системы

```
┌────────────────────────────────────────────────────┐
│                   Frontend (React)                  │
│  VITE_API_URL=https://api.your-domain.com          │
│  VITE_DIRECTUS_URL=https://directus.your-domain   │
└────────┬─────────────────────────────┬─────────────┘
         │                             │
         ↓                             ↓
    ┌─────────────────┐        ┌──────────────────┐
    │  PostgREST API  │        │  Directus CMS    │
    │  (Port 3000)    │        │  (Port 1055)     │
    │                 │        │                  │
    │ GET /workouts  │        │ GET /items/      │
    │ GET /users     │        │     exercises    │
    │ POST /workouts │        │                  │
    └────────┬────────┘        └──────────┬───────┘
             │                            │
             └──────────────┬─────────────┘
                            │
                            ↓
                    ┌────────────────┐
                    │  PostgreSQL 16 │
                    │                │
                    │ Database:      │
                    │ - super_strong │
                    │ - directus     │
                    └────────────────┘
```

## 📊 Базы данных

| БД | Сервис | Таблицы |
|---|---|---|
| `super_strong` | PostgREST | users, workouts, workout_sets |
| `directus` | Directus CMS | categories, exercises, files, users_directus |

---

## 🎯 Вариант 1: Docker Compose (Рекомендуется)

### Шаг 1: Подготовить сервер

```bash
# 1. SSH на сервер
ssh root@your-server-ip

# 2. Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Установить Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Проверить
docker --version
docker-compose --version
```

### Шаг 2: Клонировать репозиторий

```bash
# Создать директорию
mkdir -p /opt/super-strong
cd /opt/super-strong

# Клонировать код
git clone https://github.com/your-org/super-strong.git .

# Или если уже есть код
git pull origin main
```

### Шаг 3: Создать конфиги окружения

```bash
# Генерировать JWT secret (32+ символа)
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT Secret: $JWT_SECRET"

# Создать основной .env для Postgres и PostgREST
cat > .env << EOF
# PostgreSQL для PostgREST (super_strong БД)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(openssl rand -base64 16)
POSTGRES_DB=super_strong

# PostgREST
PGRST_DB_URI=postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/super_strong
PGRST_DB_SCHEMAS=public
PGRST_DB_ANON_ROLE=anon
PGRST_JWT_SECRET=${JWT_SECRET}
PGRST_OPENAPI_SERVER_PROXY_URL=https://api.your-domain.com

# Directus
DIRECTUS_KEY=your-directus-key-here
DIRECTUS_SECRET=$(openssl rand -base64 32)
DIRECTUS_DB_CLIENT=postgres
DIRECTUS_DB_HOST=postgres
DIRECTUS_DB_PORT=5432
DIRECTUS_DB_DATABASE=directus
DIRECTUS_DB_USER=postgres
DIRECTUS_DB_PASSWORD=${POSTGRES_PASSWORD}
DIRECTUS_ADMIN_EMAIL=admin@your-domain.com
DIRECTUS_ADMIN_PASSWORD=$(openssl rand -base64 16)
DIRECTUS_CORS_ENABLED=true
DIRECTUS_CORS_ORIGIN=*
EOF

# Сохранить пароли в безопасном месте!
echo "ВАЖНО! Сохранить пароли:"
cat .env
```

### Шаг 4: Использовать правильный docker-compose.yml

Проверить что в `database/docker-compose.yml` есть оба сервиса.

Если нет Directus - добавить в `database/docker-compose.yml`:

```bash
cat > docker-compose.production.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: super-strong-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d:ro
    networks:
      - super-strong-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  postgrest:
    image: postgrest/postgrest:latest
    container_name: super-strong-postgrest
    environment:
      PGRST_DB_URI: ${PGRST_DB_URI}
      PGRST_DB_SCHEMAS: ${PGRST_DB_SCHEMAS}
      PGRST_DB_ANON_ROLE: ${PGRST_DB_ANON_ROLE}
      PGRST_JWT_SECRET: ${PGRST_JWT_SECRET}
      PGRST_OPENAPI_SERVER_PROXY_URL: ${PGRST_OPENAPI_SERVER_PROXY_URL}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - super-strong-network
    restart: unless-stopped

  directus:
    image: directus/directus:latest
    container_name: super-strong-directus
    environment:
      KEY: ${DIRECTUS_KEY}
      SECRET: ${DIRECTUS_SECRET}
      DB_CLIENT: ${DIRECTUS_DB_CLIENT}
      DB_HOST: ${DIRECTUS_DB_HOST}
      DB_PORT: ${DIRECTUS_DB_PORT}
      DB_DATABASE: ${DIRECTUS_DB_DATABASE}
      DB_USER: ${DIRECTUS_DB_USER}
      DB_PASSWORD: ${DIRECTUS_DB_PASSWORD}
      ADMIN_EMAIL: ${DIRECTUS_ADMIN_EMAIL}
      ADMIN_PASSWORD: ${DIRECTUS_ADMIN_PASSWORD}
      CORS_ENABLED: ${DIRECTUS_CORS_ENABLED}
      CORS_ORIGIN: ${DIRECTUS_CORS_ORIGIN}
    ports:
      - "8055:8055"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - directus_uploads:/directus/uploads
    networks:
      - super-strong-network
    restart: unless-stopped

networks:
  super-strong-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  directus_uploads:
    driver: local
EOF
```

### Шаг 5: Запустить контейнеры

```bash
# Остановить старые контейнеры (если они есть)
docker-compose down 2>/dev/null || true

# Запустить новые
docker-compose -f docker-compose.production.yml up -d

# Проверить статус
docker-compose -f docker-compose.production.yml ps

# Смотреть логи (Ctrl+C для выхода)
docker-compose -f docker-compose.production.yml logs -f
```

### Шаг 6: Проверить что работает

```bash
# 1. PostgREST API
curl http://localhost:3000/
# Должен вернуть JSON

# 2. Таблицы PostgREST
curl http://localhost:3000/users
curl http://localhost:3000/workouts

# 3. Directus
curl http://localhost:8055/
# Должен вернуть HTML (админ панель)

# 4. Базы данных
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d super_strong -c "\dt"
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d directus -c "\dt"
```

---

## 🌐 Шаг 7: Настроить Nginx reverse proxy

```bash
# Установить nginx
sudo apt install -y nginx

# Создать конфиг
sudo tee /etc/nginx/sites-available/super-strong > /dev/null << 'EOF'
# HTTP → HTTPS редирект
server {
    listen 80;
    server_name api.your-domain.com directus.your-domain.com your-domain.com;
    return 301 https://$server_name$request_uri;
}

# PostgREST API (https://api.your-domain.com)
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PATCH, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' '*' always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}

# Directus (https://directus.your-domain.com)
server {
    listen 443 ssl http2;
    server_name directus.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/directus.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/directus.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8055;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;

        # Directus WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Frontend (https://your-domain.com)
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    root /var/www/super-strong/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
EOF

# Активировать конфиг
sudo ln -s /etc/nginx/sites-available/super-strong /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default 2>/dev/null || true

# Проверить синтаксис
sudo nginx -t

# Перезагрузить
sudo systemctl reload nginx
```

### Шаг 8: Установить SSL сертификаты

```bash
# Установить certbot
sudo apt install -y certbot python3-certbot-nginx

# Получить сертификаты
sudo certbot certonly --standalone \
  -d api.your-domain.com \
  -d directus.your-domain.com \
  -d your-domain.com

# Автоматическое обновление
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Шаг 9: Развернуть Frontend

```bash
# На локальном компьютере собрать
npm run build

# Скопировать на сервер
scp -r dist/* root@your-server:/var/www/super-strong/

# Или скопировать код и собрать на сервере
git clone https://github.com/your-org/super-strong.git /var/www/super-strong
cd /var/www/super-strong
npm install
npm run build
```

---

## ✅ Проверка что всё работает

```bash
# 1. Проверить что контейнеры запущены
docker-compose -f docker-compose.production.yml ps

# 2. Проверить PostgREST
curl https://api.your-domain.com/users

# 3. Проверить Directus (должен редиректить на /admin)
curl -L https://directus.your-domain.com/

# 4. Открыть в браузере
# https://your-domain.com - должно работать приложение

# 5. В браузере DevTools Console проверить логи
# Должны быть успешные запросы к API
```

---

## 🔐 Безопасность (КРИТИЧНО!)

```bash
# 1. Изменить PostgreSQL пароли в .env
# (уже сделано если следовали выше)

# 2. Изменить Directus пароль
# Войти в https://directus.your-domain.com/admin
# Settings → User Management → Change password

# 3. Настроить Firewall
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# 4. Проверить что PostgreSQL не доступен снаружи
sudo ufw deny 5432/tcp

# 5. Создать резервную копию
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres super_strong > backup.sql
```

---

## 📝 Ответы на вопросы

### 1. Docker Compose структура
✅ Использовать `docker-compose.production.yml` (см. выше)
✅ Содержит: PostgreSQL + PostgREST + Directus
✅ Все в одной сети: super-strong-network

### 2. PostgREST конфигурация
✅ Переменные в `.env` файле
✅ Порт: 3000 (внутри контейнера и на хосте)
✅ Подключение к БД: `postgres://postgres:PASSWORD@postgres:5432/super_strong`
✅ Роль для фронта: `anon` (может читать и писать в таблицы)

### 3. Миграции
✅ `database/migrations/001_init_schema.sql` применяется автоматически
✅ PostgreSQL берёт файлы из `/docker-entrypoint-initdb.d`
✅ Первый запуск: создаются таблицы и роли
✅ Последующие запуски: миграции не применяются (уже есть)

### 4. Совместимость Directus + PostgREST
✅ **Разные БД!**
  - `super_strong` - только PostgREST (workouts, users, workout_sets)
  - `directus` - только Directus (categories, exercises, files)
✅ Одинаковая БД-система (PostgreSQL)
✅ Разные схемы и пользователи БД
✅ Пользовались одним POSTGRES_USER (postgres) с общим паролем

### 5. Frontend подключение
✅ `.env.production` на фронте:
```
VITE_API_URL=https://api.your-domain.com
VITE_DIRECTUS_URL=https://directus.your-domain.com
```
✅ PostgREST: `https://api.your-domain.com` (не /api/postgrest)
✅ Directus: `https://directus.your-domain.com` (не /api)

### 6. Пошаговые команды

```bash
# На сервере
ssh root@your-server

# 1. Подготовить
cd /opt/super-strong
git clone https://github.com/your-org/super-strong.git .
git checkout main

# 2. Создать .env (см. Шаг 3)

# 3. Запустить
docker-compose -f docker-compose.production.yml up -d

# 4. Проверить
docker-compose -f docker-compose.production.yml ps
curl http://localhost:3000/users
curl http://localhost:8055/

# 5. Настроить Nginx (см. Шаг 7)

# 6. SSL сертификаты (см. Шаг 8)

# 7. Развернуть фронт
# На локалке: npm run build
# На сервер: scp -r dist/* root@server:/var/www/super-strong/
```

---

## 🆘 Troubleshooting

### PostgreSQL не стартует
```bash
docker-compose -f docker-compose.production.yml logs postgres
# Проверить пароль в .env
```

### PostgREST не видит таблицы
```bash
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d super_strong -c "SELECT * FROM information_schema.tables WHERE table_schema='public';"
```

### Directus не подключается
```bash
docker-compose -f docker-compose.production.yml logs directus
# Проверить DIRECTUS_DB_PASSWORD совпадает с POSTGRES_PASSWORD
```

### CORS ошибки
```bash
# Проверить что PostgREST отвечает на preflight запросы
curl -X OPTIONS http://localhost:3000/ -v
```

---

**Версия**: 1.0
**Дата**: 2025-11-02
**Статус**: ✅ Production-ready
