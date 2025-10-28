# Super Strong - Production Deployment Guide

## Overview
Deploy both the React frontend and Directus backend to a production server.

## Architecture Options

### Option 1: Single Server (Recommended for simplicity)
```
Your Server (VPS/Dedicated)
├── React App (nginx/Apache - static files)
├── Directus API (Node.js + PM2)
└── PostgreSQL (database)
```

### Option 2: Separate Servers
```
Frontend Server:        Backend Server:
├── React App          ├── Directus
├── nginx              ├── PostgreSQL
└── SSL cert           └── SSL cert
```

---

## Part 1: Frontend (React App) Deployment

### Step 1: Build Production Bundle

```bash
# In project directory
pnpm build

# Output: dist/ folder with optimized files
```

### Step 2: Configure Environment for Production

Create `.env.production`:
```
VITE_DIRECTUS_URL=https://your-domain.com/api
```

Update `.env.local` if deploying to same domain:
```
VITE_DIRECTUS_URL=https://your-domain.com/api
```

### Step 3: Upload to Server

Option A: Using SCP
```bash
scp -r dist/ user@your-server.com:/var/www/super-strong/
```

Option B: Using Git
```bash
# On server
git clone https://github.com/your-username/super-strong.git
cd super-strong
pnpm install
pnpm build
```

### Step 4: Web Server Configuration (nginx)

Create `/etc/nginx/sites-available/super-strong`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Certificate (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Root directory with React build
    root /var/www/super-strong/dist;
    index index.html;

    # API proxy to Directus
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

    # React Router fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/super-strong /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

---

## Part 2: Directus Backend Deployment

### Option A: Docker Deployment (Recommended)

#### Prerequisites
- Docker & Docker Compose installed on server
- PostgreSQL credentials

#### Step 1: Prepare docker-compose.yml for Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  directus:
    image: directus/directus:latest
    container_name: directus
    ports:
      - "8055:8055"
    environment:
      KEY: ${DIRECTUS_KEY:-your-secret-key-change-this}
      SECRET: ${DIRECTUS_SECRET:-your-secret-change-this}

      DB_CLIENT: postgres
      DB_HOST: postgres
      DB_PORT: 5432
      DB_DATABASE: ${DB_NAME:-directus}
      DB_USER: ${DB_USER:-directus}
      DB_PASSWORD: ${DB_PASSWORD:-change-this-password}

      ADMIN_EMAIL: ${ADMIN_EMAIL:-admin@example.com}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD:-change-this}

      # IMPORTANT for production
      PUBLIC_URL: https://your-domain.com/api
      NODE_ENV: production

      CORS_ENABLED: 'true'
      CORS_ORIGIN: 'https://your-domain.com'
      CACHE_ENABLED: 'true'
      CACHE_STORE: memory

    depends_on:
      - postgres
    volumes:
      - ./uploads:/directus/uploads
      - ./database:/directus/database
    restart: unless-stopped
    networks:
      - directus-network

  postgres:
    image: postgres:16-alpine
    container_name: directus_postgres
    environment:
      POSTGRES_DB: ${DB_NAME:-directus}
      POSTGRES_USER: ${DB_USER:-directus}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-change-this-password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - directus-network

volumes:
  postgres_data:

networks:
  directus-network:
```

#### Step 2: Create .env file for Production

Create `.env` on server:

```
# Database
DB_CLIENT=postgres
DB_HOST=postgres
DB_PORT=5432
DB_NAME=directus
DB_USER=directus
DB_PASSWORD=your-strong-password-here

# Directus
KEY=your-random-secret-key-min-32-chars
SECRET=your-random-secret-min-32-chars
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=your-strong-admin-password

# URLs
PUBLIC_URL=https://your-domain.com/api
CORS_ORIGIN=https://your-domain.com

# Environment
NODE_ENV=production
```

#### Step 3: Run on Server

```bash
# SSH into server
ssh user@your-server.com

# Clone or upload project
git clone <your-repo>
cd super-strong

# Create volumes and start
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

#### Step 4: Verify Directus is Running

```bash
curl https://your-domain.com/api/system/info
```

---

### Option B: Node.js Direct Deployment (without Docker)

#### Step 1: Install Dependencies

```bash
# On server
npm install -g pm2
node -v  # v18+ required
```

#### Step 2: Create Directus Project

```bash
# On server
npx create-directus-app ./directus-server \
  --db-client=postgres \
  --db-host=localhost \
  --db-port=5432 \
  --db-name=directus \
  --db-user=directus \
  --db-password=your-password
```

#### Step 3: Configure Environment

`.env` in directus-server:

```
# Database
DB_CLIENT=postgres
DB_HOST=localhost
DB_NAME=directus
DB_USER=directus
DB_PASSWORD=your-password

# Security
KEY=your-32-char-secret-key
SECRET=your-32-char-secret

# Admin
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=your-admin-password

# Public URL
PUBLIC_URL=https://your-domain.com/api
NODE_ENV=production
```

#### Step 4: Start with PM2

```bash
cd directus-server
pm2 start "npm start" --name directus

# Make it restart on reboot
pm2 startup
pm2 save
```

#### Step 5: Nginx Proxy

Same nginx config as Part 1, Step 4 (proxy to localhost:8055)

---

## Part 3: Production Checklist

### Before Going Live

- [ ] Change all default passwords
- [ ] Update `VITE_DIRECTUS_URL` in app to production URL
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly (only your domain)
- [ ] Set strong database password
- [ ] Configure firewall rules
- [ ] Enable backups (PostgreSQL)
- [ ] Test API endpoint from frontend
- [ ] Clear browser cache and test app
- [ ] Check console for errors (F12)

### Security

```bash
# Firewall (ufw example)
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

### Database Backups (PostgreSQL)

```bash
# Manual backup
pg_dump -h localhost -U directus -d directus > backup.sql

# Automated backup (daily at 2 AM)
# Add to crontab: 0 2 * * * pg_dump -h localhost -U directus -d directus > /backups/directus-$(date +\%Y\%m\%d).sql
```

---

## Part 4: Environment Variables Summary

### Frontend (.env)
```
VITE_DIRECTUS_URL=https://your-domain.com/api
```

### Backend (.env)
```
# Database
DB_CLIENT=postgres
DB_HOST=localhost (or service name in Docker)
DB_PORT=5432
DB_NAME=directus
DB_USER=directus
DB_PASSWORD=STRONG_PASSWORD

# Security
KEY=32-character-random-string
SECRET=32-character-random-string

# Admin
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=STRONG_PASSWORD

# URLs
PUBLIC_URL=https://your-domain.com/api
CORS_ORIGIN=https://your-domain.com

# Environment
NODE_ENV=production
```

---

## Part 5: Development Server Architecture

### Current Setup
```
Localhost Development
├── React (Vite) http://localhost:5173
├── Directus API http://localhost:8055
└── PostgreSQL (Docker port 5432)
```

### Minimal Production Setup
```
Production Server
├── React Static (nginx) https://your-domain.com
├── Directus API (Docker/Node) https://your-domain.com/api
└── PostgreSQL (Docker/System)
```

---

## Part 6: Migration from Local to Production

### Step 1: Backup Local Database

```bash
# Export exercises and categories from local Directus
docker exec directus_postgres pg_dump -U directus -d directus > local_backup.sql
```

### Step 2: Restore on Production

```bash
# On production server
docker exec directus_postgres psql -U directus -d directus < local_backup.sql
```

Or manually re-add exercises via Directus UI (admin panel on production)

---

## Part 7: Monitoring & Logs

### Docker Logs
```bash
docker-compose logs -f directus
docker-compose logs -f postgres
```

### Nginx Logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### PM2 Logs (if using Node.js directly)
```bash
pm2 logs directus
pm2 monit
```

---

## Part 8: Common Production Issues

### Issue: App shows 403 on exercises API
**Check**: CORS_ORIGIN matches your frontend domain
```bash
curl -H "Origin: https://your-domain.com" https://your-domain.com/api/items/exercises
```

### Issue: Large file uploads fail
**Solution**: Increase nginx body size in config:
```nginx
client_max_body_size 100M;
```

### Issue: Slow database queries
**Check**: PostgreSQL logs
```bash
docker-compose logs postgres | grep slow
```

### Issue: Directus not accessible
**Check**: Firewall, docker status, logs
```bash
docker-compose -f docker-compose.prod.yml ps
sudo ufw status
```

---

## Part 9: Recommended Hosting Providers

- **VPS**: DigitalOcean, Linode, Vultr, Hetzner
- **Managed**: Railway, Render, Fly.io
- **Database**: Amazon RDS, DigitalOcean Managed, Render PostgreSQL

---

## Part 10: Domain & DNS Setup

1. Buy domain (namecheap.com, godaddy.com, etc.)
2. Point DNS to server IP:
   - A record: `your-domain.com` → `your.server.ip`
   - A record: `www.your-domain.com` → `your.server.ip`
3. Wait 24-48 hours for DNS propagation
4. Test: `ping your-domain.com`

---

## Quick Start Commands

```bash
# Build frontend
pnpm build

# Deploy to server
scp -r dist/ user@server:/var/www/super-strong/

# Start Directus
docker-compose -f docker-compose.prod.yml up -d

# Check everything
docker-compose ps
curl https://your-domain.com/api/system/info
```

---

## Next Steps

1. Choose hosting provider
2. Setup server (Ubuntu 22.04 recommended)
3. Install Docker & nginx
4. Configure DNS
5. Get SSL certificate
6. Deploy both frontend & backend
7. Test thoroughly before launching

**Questions? Refer to:**
- Directus docs: https://docs.directus.io/self-hosted/
- Nginx docs: https://nginx.org/en/docs/
- Docker docs: https://docs.docker.com/

---

**Last Updated**: 2025-10-28
**Status**: Production-ready guide
