# Server Deployment Guide

Полное руководство для развертывания Super Strong Backend на продакшене.

## Архитектура

```
Internet
    ↓
[nginx/reverse proxy]
    ↓
[PostgREST API] → [PostgreSQL Database]
    ↓
Frontend (web/mobile)
```

## Требования

- PostgreSQL 16+
- PostgREST 12+
- Docker + Docker Compose (опционально)
- 2GB RAM минимум
- 10GB диск минимум

## Вариант 1: Docker Compose (Рекомендуется)

### Шаг 1: Подготовка окружения

```bash
# Создать директорию проекта
mkdir -p /opt/super-strong
cd /opt/super-strong

# Создать .env файл
cat > .env << 'EOF'
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE
POSTGRES_DB=super_strong

# PostgREST
PGRST_DB_URI=postgres://postgres:YOUR_SECURE_PASSWORD_HERE@postgres:5432/super_strong
PGRST_DB_SCHEMA=public
PGRST_DB_ANON_ROLE=anon
PGRST_SERVER_PROXY_URI=http://localhost:3000

# Security
PGRST_JWT_SECRET=YOUR_JWT_SECRET_KEY_HERE_MIN_32_CHARS

# CORS
PGRST_OPENAPI_SERVER_PROXY_URI=http://your-domain.com/api
EOF
```

### Шаг 2: Создать docker-compose.yml

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: super_strong_postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - super_strong

  postgrest:
    image: postgrest/postgrest:latest
    container_name: super_strong_api
    environment:
      PGRST_DB_URI: ${PGRST_DB_URI}
      PGRST_DB_SCHEMA: ${PGRST_DB_SCHEMA}
      PGRST_DB_ANON_ROLE: ${PGRST_DB_ANON_ROLE}
      PGRST_SERVER_PROXY_URI: ${PGRST_SERVER_PROXY_URI}
      PGRST_JWT_SECRET: ${PGRST_JWT_SECRET}
      PGRST_OPENAPI_SERVER_PROXY_URI: ${PGRST_OPENAPI_SERVER_PROXY_URI}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - super_strong

volumes:
  postgres_data:
    driver: local

networks:
  super_strong:
    driver: bridge
EOF
```

### Шаг 3: Получить миграции

```bash
# Клонировать или скопировать database/migrations
# Предполагаем что repo уже есть

# Или создать вручную
mkdir -p database/migrations
# Скопировать 001_init_schema.sql в эту папку
```

### Шаг 4: Запустить

```bash
# Запустить контейнеры
docker-compose up -d

# Проверить статус
docker-compose ps

# Проверить логи
docker-compose logs -f

# Проверить что PostgREST работает
curl http://localhost:3000/
```

## Вариант 2: Ручная установка (Linux)

### Шаг 1: Установить PostgreSQL 16

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y postgresql-16

# Стартуем
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Проверяем
sudo systemctl status postgresql
```

### Шаг 2: Создать базу данных

```bash
# Подключаемся как postgres
sudo -i -u postgres
psql

# В psql:
CREATE USER super_strong_admin WITH PASSWORD 'YOUR_SECURE_PASSWORD';
CREATE DATABASE super_strong OWNER super_strong_admin;
\c super_strong

-- Создаём роль для PostgREST
CREATE ROLE anon NOLOGIN;

-- Даём права
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Смотрим версию PostgreSQL
SELECT version();

\q
exit
```

### Шаг 3: Применить миграции

```bash
# Скопировать миграцию
sudo cp database/migrations/001_init_schema.sql /tmp/

# Применить
sudo -u postgres psql super_strong < /tmp/001_init_schema.sql

# Проверить таблицы
sudo -u postgres psql super_strong -c "\dt"
```

### Шаг 4: Установить PostgREST

```bash
# Скачать последнюю версию
cd /tmp
wget https://github.com/PostgREST/postgrest/releases/download/v12.0.0/postgrest-v12.0.0-linux-x64-static.tar.xz
tar xf postgrest-v12.0.0-linux-x64-static.tar.xz
sudo mv postgrest /usr/local/bin/

# Создать config файл
sudo mkdir -p /etc/postgrest
sudo cat > /etc/postgrest/postgrest.conf << 'EOF'
db-uri = "postgres://super_strong_admin:YOUR_SECURE_PASSWORD@localhost:5432/super_strong"
db-schema = "public"
db-anon-role = "anon"
server-port = 3000
jwt-secret = "YOUR_JWT_SECRET_KEY_HERE_MIN_32_CHARS"
EOF

# Создать systemd сервис
sudo cat > /etc/systemd/system/postgrest.service << 'EOF'
[Unit]
Description=PostgREST API
After=postgresql.service

[Service]
Type=simple
User=www-data
ExecStart=/usr/local/bin/postgrest /etc/postgrest/postgrest.conf
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Стартуем
sudo systemctl daemon-reload
sudo systemctl start postgrest
sudo systemctl enable postgrest
sudo systemctl status postgrest

# Проверяем
curl http://localhost:3000/
```

## Вариант 3: Использование Managed Services

### AWS RDS + Lambda + API Gateway

```bash
# 1. Создать RDS PostgreSQL инстанс
# 2. Применить миграции через psql
# 3. Создать Lambda функцию которая запускает PostgREST в контейнере
# 4. Проксировать через API Gateway
```

## Проверка что работает

```bash
# 1. Проверить что PostgREST доступен
curl http://your-server:3000/

# 2. Проверить таблицы
curl http://your-server:3000/users

# 3. Проверить что БД работает
curl http://your-server:3000/workouts

# 4. Проверить OpenAPI документацию
curl http://your-server:3000/

# Ответ должен быть JSON с информацией о API
```

## Безопасность

### ОБЯЗАТЕЛЬНО выполнить:

1. **Изменить пароли**
   ```bash
   # Не оставлять default пароли!
   ALTER USER postgres WITH PASSWORD 'VERY_SECURE_PASSWORD_HERE';
   ALTER USER super_strong_admin WITH PASSWORD 'ANOTHER_SECURE_PASSWORD_HERE';
   ```

2. **Защитить PostgreSQL**
   ```bash
   # Отредактировать /etc/postgresql/16/main/postgresql.conf
   listen_addresses = 'localhost'  # Только локальный доступ

   # Если нужен удалённый доступ - использовать шифрование SSL
   ```

3. **JWT Secret**
   - Минимум 32 символа
   - Случайная строка: `openssl rand -base64 32`
   - Хранить в защищённом месте

4. **Firewall**
   ```bash
   # Разрешить только необходимые порты
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

5. **Обновление**
   ```bash
   # Регулярно обновлять PostgreSQL и PostgREST
   sudo apt update && sudo apt upgrade
   ```

## Frontend подключение

Фронт автоматически подключится если:

1. PostgREST доступен по http://your-server:3000
2. CORS включён (PostgREST позволяет по умолчанию)
3. Все миграции применены

### Убедиться что работает:

```bash
# Из браузера открыть DevTools Console
fetch('http://your-server:3000/users')
  .then(r => r.json())
  .then(data => console.log(data))

# Должны увидеть список пользователей
```

## Мониторинг

### Проверить логи PostgREST
```bash
sudo journalctl -u postgrest -f
```

### Проверить логи PostgreSQL
```bash
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### Использование pg_stat для мониторинга
```bash
sudo -u postgres psql super_strong
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

## Резервное копирование

```bash
# Полный бэкап
sudo -u postgres pg_dump super_strong > /backups/super_strong_$(date +%Y%m%d).sql

# Автоматический ежедневный бэкап (cron)
0 2 * * * sudo -u postgres pg_dump super_strong > /backups/super_strong_$(date +\%Y\%m\%d).sql

# Восстановление
sudo -u postgres psql super_strong < /backups/super_strong_20251102.sql
```

## Troubleshooting

### PostgREST не стартует

```bash
# Проверить конфиг
postgrest /etc/postgrest/postgrest.conf --dump-config

# Проверить подключение к БД
psql -U super_strong_admin -d super_strong -h localhost -c "SELECT version();"
```

### Таблицы не видны в API

```bash
# Убедиться что таблицы существуют
sudo -u postgres psql super_strong -c "\dt"

# Убедиться что права даны анон роли
sudo -u postgres psql super_strong << 'EOF'
SELECT * FROM information_schema.role_table_grants
WHERE grantee='anon';
EOF
```

### CORS ошибки

```bash
# PostgREST автоматически разрешает CORS
# Если не работает - проверить конфиг:
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     http://your-server:3000/ -v
```

## Дополнительные ресурсы

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgREST Documentation](https://postgrest.org/)
- [PostgREST API Docs](https://postgrest.org/en/latest/)
- [Row Level Security](https://www.postgresql.org/docs/current/sql-createpolicy.html)

---

**Версия**: 1.0
**Дата**: 2025-11-02
**Для Super Strong v0.0.0**
