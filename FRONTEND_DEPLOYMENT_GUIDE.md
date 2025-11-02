# Frontend Deployment Guide

Руководство для развертывания Super Strong Frontend на продакшене.

## Подключение к серверу

### Шаг 1: Установить переменные окружения

Создать файл `.env` в корне проекта:

```bash
cat > .env << 'EOF'
# API endpoint - указать ваш сервер
VITE_API_URL=https://api.your-domain.com
VITE_DIRECTUS_URL=https://directus.your-domain.com

# Telegram WebApp Token (если используется)
VITE_TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
EOF
```

### Шаг 2: Обновить API путь (если не совпадает)

Проверить файл `src/lib/api.ts`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

Если нужно изменить - отредактировать этот файл.

## Варианты развертывания

### Вариант 1: Vercel/Netlify (Рекомендуется)

#### Vercel

```bash
# Установить Vercel CLI
npm install -g vercel

# Логин
vercel login

# Развернуть
vercel

# Настроить env переменные в dashboard vercel.com
# VITE_API_URL=https://api.your-domain.com
# VITE_DIRECTUS_URL=https://directus.your-domain.com
```

#### Netlify

```bash
# Установить Netlify CLI
npm install -g netlify-cli

# Логин
netlify login

# Развернуть
netlify deploy --prod

# Или использовать git интеграцию через dashboard netlify.com
```

### Вариант 2: Docker

```bash
# Создать Dockerfile
cat > Dockerfile << 'EOF'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
ENV VITE_API_URL=https://api.your-domain.com
ENV VITE_DIRECTUS_URL=https://directus.your-domain.com
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
EOF

# Построить образ
docker build -t super-strong-frontend .

# Запустить контейнер
docker run -d \
  -p 3000:3000 \
  -e VITE_API_URL=https://api.your-domain.com \
  -e VITE_DIRECTUS_URL=https://directus.your-domain.com \
  super-strong-frontend
```

### Вариант 3: Nginx на Linux сервере

```bash
# Собрать фронт
npm run build

# Установить nginx
sudo apt install nginx

# Создать конфиг
sudo cat > /etc/nginx/sites-available/super-strong << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL сертификаты (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    root /var/www/super-strong/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy к PostgREST
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PATCH, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# Активировать конфиг
sudo ln -s /etc/nginx/sites-available/super-strong /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default 2>/dev/null || true

# Проверить конфиг
sudo nginx -t

# Перезагрузить nginx
sudo systemctl reload nginx

# SSL сертификат (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

## Проверка что работает

### 1. Открыть приложение

```
https://your-domain.com
```

### 2. Открыть DevTools → Console

```javascript
// Проверить что API доступен
fetch('https://api.your-domain.com/users')
  .then(r => r.json())
  .then(data => console.log('API works:', data))
  .catch(err => console.error('API error:', err))
```

### 3. Проверить Network tab

- Все запросы должны идти на `https://api.your-domain.com`
- Статус должны быть 200, 201, 204
- Нет CORS ошибок

## Переменные окружения

### Основные

| Переменная | Обязательна | Значение |
|---|---|---|
| `VITE_API_URL` | Да | URL PostgREST API |
| `VITE_DIRECTUS_URL` | Да | URL Directus (для упражнений) |

### Опциональные

| Переменная | Значение |
|---|---|
| `VITE_TELEGRAM_BOT_TOKEN` | Token для Telegram WebApp |
| `VITE_DEBUG_MODE` | true/false для дополнительных логов |

## Оптимизация

### 1. Минимизация бандла

```bash
# Проверить размер бандла
npm run build

# Анализировать
npm install --save-dev rollup-plugin-visualizer
```

### 2. Кэширование на клиенте

Nginx автоматически кэширует static файлы благодаря:
- Content-Type заголовкам
- Cache-Control заголовкам в dist файлах

### 3. CDN (CloudFlare, Cloudfront)

```bash
# Добавить CDN перед nginx сервером
# Это даст:
# - Глобальное кэширование
# - DDoS protection
# - Лучшую скорость по всему миру
```

## Мониторинг

### Проверить логи nginx

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Проверить логи приложения

```bash
# DevTools Console в браузере
# Или проверить браузерное хранилище
localStorage.getItem('super-strong-user-session')
```

## Troubleshooting

### "Cannot GET /" при обновлении страницы

**Решение**: Nginx должен отправлять index.html для всех маршрутов:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### API не доступен (CORS ошибка)

**Решение**: Убедиться что PostgREST запущен и доступен:

```bash
curl https://api.your-domain.com/users
```

Если PostgREST не отвечает - проверить сервер БД.

### Белый экран при загрузке

1. Открыть DevTools → Console
2. Проверить ошибки в консоли
3. Проверить что `VITE_API_URL` и `VITE_DIRECTUS_URL` установлены

### Медленная загрузка

```bash
# Проверить размер бандла
npm run build

# Проверить что gzip включён в nginx
# и что файлы кэшируются правильно
```

## GitHub Actions CI/CD (Автоматический деплой)

```bash
# Создать .github/workflows/deploy.yml
mkdir -p .github/workflows

cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.API_URL }}
          VITE_DIRECTUS_URL: ${{ secrets.DIRECTUS_URL }}

      - name: Deploy to server
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.DEPLOY_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan -H ${{ secrets.SERVER_HOST }} >> ~/.ssh/known_hosts
          scp -r dist/* ${{ secrets.DEPLOY_USER }}@${{ secrets.SERVER_HOST }}:/var/www/super-strong/
          ssh ${{ secrets.DEPLOY_USER }}@${{ secrets.SERVER_HOST }} 'sudo systemctl reload nginx'
EOF

# GitHub Secrets которые нужно добавить:
# - API_URL: https://api.your-domain.com
# - DIRECTUS_URL: https://directus.your-domain.com
# - SERVER_HOST: ваш сервер
# - DEPLOY_USER: пользователь на сервере
# - DEPLOY_KEY: SSH приватный ключ
```

## Production Checklist

- [ ] Все env переменные установлены
- [ ] SSL сертификат включен
- [ ] CORS настроен правильно
- [ ] gzip compression включен
- [ ] Static файлы кэшируются
- [ ] PostgREST доступен
- [ ] Directus доступен
- [ ] Логи настроены
- [ ] Бэкапы настроены
- [ ] Мониторинг настроен
- [ ] Firewall настроен

---

**Версия**: 1.0
**Дата**: 2025-11-02
**Для Super Strong v0.0.0**
