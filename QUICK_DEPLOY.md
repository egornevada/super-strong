# ⚡ Quick Deploy - 30 Minutes

Copy-paste commands to deploy Super Strong to production.

## Prerequisites
- VPS with Ubuntu 22.04
- Domain with DNS pointing to server IP
- SSH access to server

---

## Step 1: Server Setup (5 min)

```bash
# Connect to server
ssh root@your-server.com

# Update system
apt update && apt upgrade -y

# Install packages
apt install -y nginx docker.io docker-compose git curl certbot python3-certbot-nginx
```

---

## Step 2: Domain & SSL (5 min)

```bash
# Create directories
mkdir -p /var/www/super-strong
mkdir -p /root/directus

# Get SSL certificate
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Verify certificate
ls /etc/letsencrypt/live/your-domain.com/
```

---

## Step 3: Deploy Frontend (5 min)

### On your local machine:
```bash
pnpm build
scp -r dist/ user@your-server.com:/var/www/super-strong/
```

### On server - Create nginx config:

```bash
cat > /etc/nginx/sites-available/super-strong << 'EOF'
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

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    root /var/www/super-strong/dist;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:8055/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
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
EOF
```

Enable nginx:
```bash
ln -s /etc/nginx/sites-available/super-strong /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## Step 4: Deploy Backend (10 min)

### Create .env file:

```bash
cat > /root/directus/.env << 'EOF'
DB_CLIENT=postgres
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=directus
DB_USER=directus
DB_PASSWORD=STRONG_PASSWORD_12345678

KEY=YOUR_32_CHAR_RANDOM_KEY_HERE1234567890
SECRET=YOUR_32_CHAR_RANDOM_SECRET_HERE1234567890

ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=STRONG_ADMIN_PASSWORD

PUBLIC_URL=https://your-domain.com/api
CORS_ORIGIN=https://your-domain.com
NODE_ENV=production
CACHE_ENABLED=true
CACHE_STORE=memory
EOF
```

### Create docker-compose.yml:

```bash
cat > /root/directus/docker-compose.yml << 'EOF'
version: '3.8'
services:
  directus:
    image: directus/directus:latest
    container_name: directus
    ports:
      - "127.0.0.1:8055:8055"
    env_file: .env
    depends_on:
      - postgres
    volumes:
      - ./uploads:/directus/uploads
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    container_name: directus_postgres
    environment:
      POSTGRES_DB: directus
      POSTGRES_USER: directus
      POSTGRES_PASSWORD: STRONG_PASSWORD_12345678
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
EOF
```

### Start Docker:

```bash
cd /root/directus
docker-compose up -d

# Wait 10 seconds for startup
sleep 10

# Verify
docker-compose ps
curl https://your-domain.com/api/system/info
```

---

## Step 5: Add Data (5 min)

### Option A: Import local backup

```bash
# Upload your local backup
scp backup.sql root@your-server.com:/root/directus/

# Import
cd /root/directus
docker-compose exec postgres psql -U directus -d directus < backup.sql
```

### Option B: Add data manually

1. Open: https://your-domain.com/api/admin
2. Login: admin@your-domain.com / your-admin-password
3. Click "Exercises"
4. Add exercises (8+ with categories)

---

## Step 6: Verify (2 min)

```bash
# Test frontend
curl https://your-domain.com/

# Test API
curl https://your-domain.com/api/items/exercises

# Test admin
# Open browser: https://your-domain.com/api/admin
```

Open browser: **https://your-domain.com**
- Should show app
- No errors in F12 console
- Click date → should load exercises

---

## Done! 🎉

Your app is live at: **https://your-domain.com**

---

## Quick Commands Reference

```bash
# View logs
docker-compose -f /root/directus/docker-compose.yml logs -f directus

# Restart Directus
cd /root/directus && docker-compose restart

# Backup database
docker-compose exec postgres pg_dump -U directus -d directus > backup.sql

# Check health
curl https://your-domain.com/api/system/info
```

---

## Troubleshooting

**App shows blank page:**
- Check F12 console for errors
- Verify API URL in app

**API returns 403:**
- Check CORS_ORIGIN in .env matches domain
- Restart: `docker-compose restart`

**Directus won't start:**
- Check logs: `docker-compose logs directus`
- Verify .env variables

**Nginx 502 error:**
- Directus not running: `docker-compose ps`
- Check: `curl http://localhost:8055`

---

**Time: ~30 minutes to full deployment**
**Difficulty: Medium**
**Support: See DEPLOYMENT_GUIDE.md for detailed docs**
