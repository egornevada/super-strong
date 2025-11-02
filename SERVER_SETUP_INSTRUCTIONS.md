# Super Strong - Server Setup Instructions

This document provides step-by-step instructions for deploying the Super Strong application with PostgreSQL and PostgREST on a production server.

## Prerequisites

- Docker and Docker Compose installed
- Git installed
- Access to the server with sudo/root privileges
- Domain name (optional, for HTTPS setup)
- Sufficient disk space for database

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Super Strong Web App (React + TypeScript)          │
│  (Deployed on web server or CDN)                   │
└────────────────┬────────────────────────────────────┘
                 │ HTTP/HTTPS
                 ↓
┌─────────────────────────────────────────────────────┐
│  PostgREST API Server (Port 3000)                   │
│  - RESTful API for database operations              │
│  - Automatic OpenAPI documentation                 │
└────────────────┬────────────────────────────────────┘
                 │ TCP
                 ↓
┌─────────────────────────────────────────────────────┐
│  PostgreSQL Database (Port 5432)                    │
│  - users table (profiles, Telegram IDs)            │
│  - workouts table (workout sessions)                │
│  - workout_sets table (individual sets)             │
└─────────────────────────────────────────────────────┘
```

## Step 1: Clone Repository and Navigate to Database Directory

```bash
# Clone the repository
git clone <repository-url> super-strong
cd super-strong

# Navigate to database directory
cd database
```

## Step 2: Prepare Docker Compose Configuration

Create a production-ready `docker-compose.yml` with environment-specific settings:

```bash
# Copy the existing docker-compose.yml as a base
cp docker-compose.yml docker-compose.prod.yml
```

Update `docker-compose.prod.yml` for production:
- Change PostgreSQL password to a strong random password
- Update PostgREST configuration if needed
- Add volume mounting for persistent data
- Configure logging

Example production updates:

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: "your-strong-password-here"  # Change this!
    volumes:
      - /data/postgres:/var/lib/postgresql/data  # Use persistent volume
      - ./migrations:/docker-entrypoint-initdb.d
    networks:
      - super-strong-network
```

## Step 3: Start PostgreSQL and PostgREST

```bash
# Start services with production compose file
docker-compose -f docker-compose.prod.yml up -d

# Verify services are running
docker ps

# Check logs
docker logs super-strong-postgres
docker logs super-strong-postgrest
```

## Step 4: Verify Database Setup

Connect to PostgreSQL and verify the schema:

```bash
# Access PostgreSQL
docker exec -it super-strong-postgres psql -U postgres -d super_strong

# Run these SQL commands to verify setup:
# \dt                 -- List all tables
# \d users            -- Show users table structure
# \d workouts         -- Show workouts table structure
# \d workout_sets     -- Show workout_sets table structure
# SELECT COUNT(*) FROM users;  -- Check if tables work
```

## Step 5: Test PostgREST API

```bash
# Check PostgREST health
curl http://localhost:3000/

# Get OpenAPI documentation
curl http://localhost:3000/ | jq

# Test creating a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "first_name": "Test",
    "last_name": "User"
  }'

# Get users
curl http://localhost:3000/users
```

## Step 6: Configure Application

Update your application configuration to point to the production server:

### Environment Variables

Create `.env.production` in your application root:

```env
VITE_API_URL=https://your-domain.com/api  # Or http://server-ip:3000 for internal testing
VITE_LOG_LEVEL=info
```

### Update Configuration Files

The application expects PostgREST API at the URL specified in `VITE_API_URL`.

Default endpoints used:
- `GET /users?username=eq.{username}` - Get user by username
- `POST /users` - Create new user
- `PATCH /users?id=eq.{id}` - Update user
- `GET /workouts?user_id=eq.{id}&...` - Get user workouts
- `POST /workouts` - Create workout
- `POST /workout_sets` - Create workout set
- `DELETE /workout_sets?workout_id=eq.{id}` - Delete sets
- `DELETE /workouts?id=eq.{id}` - Delete workout

## Step 7: Setup Reverse Proxy (Optional but Recommended)

For security and HTTPS support, setup Nginx as reverse proxy:

```bash
# Install Nginx
sudo apt-get update
sudo apt-get install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/super-strong-api
```

Nginx configuration example:

```nginx
upstream postgrest {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://postgrest/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/super-strong-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 8: Setup HTTPS with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal should be configured automatically
sudo systemctl enable certbot.timer
```

## Step 9: Database Backups

Setup regular backups:

```bash
# Create backup script
cat > /home/user/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/super-strong"
mkdir -p $BACKUP_DIR
docker exec super-strong-postgres pg_dump -U postgres super_strong | \
  gzip > $BACKUP_DIR/super-strong-$(date +%Y%m%d-%H%M%S).sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -type f -mtime +30 -delete
EOF

chmod +x /home/user/backup-db.sh

# Setup cron job for daily backups
crontab -e
# Add: 0 2 * * * /home/user/backup-db.sh
```

## Step 10: Monitoring and Logs

```bash
# View all container logs
docker logs -f super-strong-postgrest
docker logs -f super-strong-postgres

# Setup log rotation for persistent logs
sudo nano /etc/logrotate.d/super-strong
```

## Production Considerations

### Security

1. **Strong Passwords**: Always use strong, randomly generated passwords
2. **Database Credentials**: Store securely, never in version control
3. **HTTPS**: Always use HTTPS in production
4. **Firewall**: Only expose ports 80 and 443 to the internet
5. **Database Port**: Keep PostgreSQL port 5432 internal only
6. **RLS Policies**: Consider implementing proper Row Level Security policies

### Performance

1. **Database Indexes**: Already created on frequently queried columns
2. **Connection Pooling**: Consider PgBouncer for high traffic
3. **Caching**: Implement Redis caching layer if needed
4. **CDN**: Use CDN for static assets and web app

### Scaling

If you need to scale:

1. Use managed PostgreSQL service (AWS RDS, Heroku, DigitalOcean)
2. Setup PostgREST load balancer (multiple instances)
3. Implement caching layer
4. Consider database replication

## Updating the Application

To update to a new version:

```bash
# Pull latest code
git pull origin main

# Rebuild and restart services
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Verify everything is running
docker ps
```

## Troubleshooting

### PostgREST can't connect to database

```bash
# Check PostgreSQL logs
docker logs super-strong-postgres

# Verify database is running
docker exec super-strong-postgres pg_isready
```

### Permission denied errors

```bash
# Check file permissions
docker exec super-strong-postgres ls -la /var/lib/postgresql/data

# Fix permissions if needed
docker exec super-strong-postgres chown -R postgres:postgres /var/lib/postgresql/data
```

### Port already in use

Change port mappings in `docker-compose.prod.yml`:

```yaml
postgres:
  ports:
    - "5433:5432"  # Change 5432 to 5433 (or another free port)

postgrest:
  ports:
    - "3001:3000"  # Change 3000 to 3001 (or another free port)
```

### Database corruption

Restore from backup:

```bash
# List available backups
ls -la /backups/super-strong/

# Restore from specific backup
docker exec super-strong-postgres psql -U postgres super_strong < /path/to/backup.sql
```

## Application Configuration

The web application connects to PostgREST API using these settings:

- **API Base URL**: `VITE_API_URL` environment variable
- **Authentication**: Uses user session stored in localStorage
- **Data Format**: JSON with PostgREST conventions

### PostgREST Query Examples

Used by the application:

```bash
# Create user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","first_name":"John","telegram_id":123456}'

# Get user by username
curl "http://localhost:3000/users?username=eq.john_doe"

# Get workouts for user
curl "http://localhost:3000/workouts?user_id=eq.1&order=workout_date.desc"

# Create workout
curl -X POST http://localhost:3000/workouts \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"workout_date":"2024-11-02"}'
```

## Support and Debugging

For issues or questions:

1. Check application logs: `docker logs super-strong-postgrest`
2. Check database logs: `docker logs super-strong-postgres`
3. Test API connectivity: `curl http://localhost:3000/`
4. Verify database contents: Connect via psql and inspect data

## Next Steps

1. Deploy web application to your hosting (Vercel, Netlify, AWS, etc.)
2. Configure environment variables with your server URL
3. Test application against production database
4. Setup monitoring and alerting
5. Configure automated backups
6. Document any custom configurations for your team
