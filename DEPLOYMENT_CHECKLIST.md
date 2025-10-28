# 📋 Deployment Checklist - Super Strong Production

## Quickstart
```bash
# Build
pnpm build

# Deploy frontend: upload /dist folder to server
scp -r dist/ user@server:/var/www/super-strong/

# Deploy backend: docker-compose on server
docker-compose -f docker-compose.prod.yml up -d
```

---

## ✅ Pre-Deployment

### Local Setup
- [ ] `pnpm build` succeeds without errors
- [ ] `pnpm lint` passes
- [ ] No console errors when testing
- [ ] `.env.local` has correct DIRECTUS_URL

### Backup Data
- [ ] Export database: `docker exec directus_postgres pg_dump -U directus -d directus > backup.sql`
- [ ] Save locally
- [ ] Verify backup file size > 0

---

## 🖥️ Server Setup

### Initial Server
- [ ] VPS created (Ubuntu 22.04 LTS recommended)
- [ ] SSH access verified
- [ ] Root password secured / SSH key setup

### System Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx docker.io docker-compose git curl certbot python3-certbot-nginx
```

- [ ] Packages installed successfully
- [ ] Docker version: `docker --version` (20.10+)

---

## 🌐 Domain & DNS

- [ ] Domain purchased
- [ ] DNS A records configured:
  ```
  your-domain.com        → your.server.ip
  www.your-domain.com    → your.server.ip
  ```
- [ ] DNS propagated: `nslookup your-domain.com` (shows your IP)
- [ ] Wait 5-10 minutes if just setup

---

## 🔒 SSL Certificate

```bash
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```

- [ ] Certificate obtained
- [ ] Location: `/etc/letsencrypt/live/your-domain.com/`
- [ ] Auto-renewal enabled (every 90 days)

---

## 📱 Frontend Deployment

### Upload App
```bash
# Option 1: SCP (from local machine)
pnpm build
scp -r dist/ user@your-server.com:/var/www/super-strong/

# Option 2: Git (on server)
git clone https://github.com/your-username/super-strong.git /var/www/super-strong
cd /var/www/super-strong
pnpm install
pnpm build
```

- [ ] `/var/www/super-strong/dist/` exists on server
- [ ] Files visible: `ls /var/www/super-strong/dist/`

### Nginx Configuration

Create `/etc/nginx/sites-available/super-strong`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    root /var/www/super-strong/dist;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:8055/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable nginx:
```bash
sudo ln -s /etc/nginx/sites-available/super-strong /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

- [ ] Nginx config valid: `sudo nginx -t` (should say OK)
- [ ] Nginx restarted successfully
- [ ] Open https://your-domain.com (should show app)

---

## 🗄️ Backend Deployment (Directus)

### Create Production .env

Create `/root/directus/.env`:

```
# Database
DB_CLIENT=postgres
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=directus
DB_USER=directus
DB_PASSWORD=YOUR_STRONG_DB_PASSWORD_HERE

# Security
KEY=YOUR_32_CHAR_RANDOM_STRING_abcdefghijklmnopqrstuvwxyz1234
SECRET=YOUR_32_CHAR_RANDOM_STRING_ZYXWVUTSRQPONMLKJIHGFEDCBA9876

# Admin
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=YOUR_STRONG_ADMIN_PASSWORD

# URLs
PUBLIC_URL=https://your-domain.com/api
CORS_ORIGIN=https://your-domain.com
CORS_CREDENTIALS=true

# Environment
NODE_ENV=production
CACHE_ENABLED=true
CACHE_STORE=memory
```

- [ ] `.env` created
- [ ] All passwords are STRONG (20+ chars, mixed case/numbers)
- [ ] Domain URLs updated
- [ ] KEY and SECRET are 32+ random characters

### Docker Compose

Copy this to `/root/directus/docker-compose.yml`:

```yaml
version: '3.8'

services:
  directus:
    image: directus/directus:latest
    container_name: directus
    ports:
      - "127.0.0.1:8055:8055"
    environment:
      KEY: ${KEY}
      SECRET: ${SECRET}
      DB_CLIENT: ${DB_CLIENT}
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      DB_DATABASE: ${DB_DATABASE}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      PUBLIC_URL: ${PUBLIC_URL}
      CORS_ORIGIN: ${CORS_ORIGIN}
      CORS_CREDENTIALS: ${CORS_CREDENTIALS}
      NODE_ENV: ${NODE_ENV}
      CACHE_ENABLED: ${CACHE_ENABLED}
      CACHE_STORE: ${CACHE_STORE}
    depends_on:
      - postgres
    volumes:
      - ./uploads:/directus/uploads
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    container_name: directus_postgres
    environment:
      POSTGRES_DB: ${DB_DATABASE}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

- [ ] File created: `/root/directus/docker-compose.yml`
- [ ] Matches your `.env` variables

### Start Directus

```bash
cd /root/directus
docker-compose up -d
```

- [ ] All containers running: `docker-compose ps`
- [ ] Directus healthy: `curl https://your-domain.com/api/system/info` (should return JSON)

---

## 🔄 Data Migration

### Option 1: Import from Local Backup

```bash
# On server
cd /root/directus
docker-compose exec postgres psql -U directus -d directus < /path/to/backup.sql
```

- [ ] Backup uploaded to server
- [ ] Data imported successfully
- [ ] Check: `curl https://your-domain.com/api/items/exercises` (returns exercise data)

### Option 2: Re-add Data Manually

- [ ] Open https://your-domain.com/api/admin
- [ ] Login with admin credentials
- [ ] Add exercises via UI (see DIRECTUS_SETUP_GUIDE.md)
- [ ] Add 8+ exercises with categories

---

## ✔️ Verification

### Frontend Works
- [ ] `https://your-domain.com` loads (no blank page)
- [ ] Shows calendar (no errors in F12 console)
- [ ] Click date → shows exercises page
- [ ] All CSS/styling loads correctly

### Backend Works
- [ ] `https://your-domain.com/api/system/info` returns JSON
- [ ] `https://your-domain.com/api/admin` loads admin UI
- [ ] Can login with admin credentials
- [ ] Exercises exist in database

### Integration Works
- [ ] Open app: `https://your-domain.com`
- [ ] Open DevTools (F12)
- [ ] Go to Network tab
- [ ] Click calendar date
- [ ] Verify API call: `https://your-domain.com/api/items/exercises`
- [ ] Status: 200 OK (green)
- [ ] Response contains exercise data

### HTTPS Works
- [ ] Browser shows green lock icon
- [ ] No mixed content warnings (F12 console)
- [ ] `https://` URLs work (not http://)

---

## 🔐 Security Checklist

- [ ] All default passwords changed
- [ ] Database password is 20+ chars
- [ ] Admin password is 20+ chars
- [ ] KEY and SECRET are random
- [ ] CORS_ORIGIN only allows your domain
- [ ] Firewall allows only 22, 80, 443

```bash
# Firewall setup (ufw)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

- [ ] Firewall rules configured
- [ ] SSH key setup (no password login)

---

## 📊 Monitoring

### Logs
```bash
# Directus logs
docker-compose logs -f directus

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Database connection issues
docker-compose logs -f postgres
```

- [ ] Check logs for errors
- [ ] No 500 errors
- [ ] No connection timeouts

### Performance
```bash
# Check space
df -h

# Check memory
free -h

# Check processes
docker-compose ps
```

- [ ] Disk space > 20% free
- [ ] Memory available
- [ ] All containers running

---

## 🔄 Backups

### Database Backup Script

Create `/root/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

docker-compose -f /root/directus/docker-compose.yml exec -T postgres \
  pg_dump -U directus -d directus \
  > $BACKUP_DIR/directus-$(date +%Y%m%d_%H%M%S).sql

# Keep only last 30 days
find $BACKUP_DIR -name "directus-*.sql" -mtime +30 -delete
```

Add to crontab (daily at 2 AM):
```bash
sudo crontab -e
# Add: 0 2 * * * /root/backup.sh
```

- [ ] Backup script created
- [ ] Added to crontab
- [ ] First backup executed manually

---

## 🚀 Post-Launch

### Monitor First Week
- [ ] Check logs daily
- [ ] Monitor performance
- [ ] Test user workflows
- [ ] Respond to any issues

### Ongoing Maintenance
- [ ] Weekly backup verification
- [ ] Monthly security updates: `sudo apt update && apt upgrade`
- [ ] Monitor disk space
- [ ] Check certificate renewal

---

## ❌ Troubleshooting

| Issue | Command | Solution |
|-------|---------|----------|
| App blank page | F12 console | Check API errors |
| API 403 Forbidden | `curl -H "Origin: https://..." /api/...` | Fix CORS in `.env` |
| Directus won't start | `docker-compose logs directus` | Check environment variables |
| Database won't connect | `docker-compose logs postgres` | Check password in `.env` |
| Nginx 502 | `curl http://localhost:8055` | Directus not running locally |

---

## 📞 Support Resources

- Directus: https://docs.directus.io/
- Nginx: https://nginx.org/en/docs/
- Docker: https://docs.docker.com/
- Let's Encrypt: https://letsencrypt.org/

---

**Estimated time: 30-60 minutes**
**Status: Copy this checklist and check off items as you complete**
