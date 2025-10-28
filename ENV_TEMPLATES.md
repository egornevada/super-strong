# 🔧 Environment Variables Templates

Copy these templates and fill in YOUR values.

---

## Frontend .env.local (Local Development)

File: `.env.local`

```
VITE_DIRECTUS_URL=http://localhost:8055
```

---

## Frontend .env.production (Production Build)

When building for production:

```bash
# In .env file before build:
VITE_DIRECTUS_URL=https://your-domain.com/api

# Then build:
pnpm build
```

Or in CI/CD:
```bash
VITE_DIRECTUS_URL=https://your-domain.com/api pnpm build
```

---

## Backend .env (Docker - Production)

File: `/root/directus/.env`

**⚠️ IMPORTANT: Replace all UPPERCASE values with your own!**

```
# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_CLIENT=postgres
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=directus
DB_USER=directus
DB_PASSWORD=YOUR_STRONG_DATABASE_PASSWORD_CHANGE_THIS_12345

# ============================================
# DIRECTUS SECURITY KEYS
# ============================================
# Generate random 32-char strings:
# Linux: openssl rand -hex 16
# Or any random string 32+ chars
KEY=GENERATE_RANDOM_32_CHAR_STRING_HERE_abcdefgh
SECRET=GENERATE_RANDOM_32_CHAR_STRING_HERE_ijklmnop

# ============================================
# ADMIN USER
# ============================================
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=YOUR_STRONG_ADMIN_PASSWORD_20_CHARS_MINIMUM

# ============================================
# PUBLIC URLS
# ============================================
PUBLIC_URL=https://your-domain.com/api
CORS_ORIGIN=https://your-domain.com

# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV=production
CACHE_ENABLED=true
CACHE_STORE=memory
CORS_CREDENTIALS=true
```

---

## Backend .env (Local Development)

File: `.env.local` (if running Directus locally without Docker)

```
# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_CLIENT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=directus
DB_USER=directus
DB_PASSWORD=directus

# ============================================
# DIRECTUS SECURITY KEYS
# ============================================
KEY=123456789abcdefghijklmnopqrstuvwxyz
SECRET=abcdefghijklmnopqrstuvwxyz123456789

# ============================================
# ADMIN USER
# ============================================
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password

# ============================================
# PUBLIC URLS
# ============================================
PUBLIC_URL=http://localhost:8055
CORS_ORIGIN=http://localhost:5173

# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV=development
CACHE_ENABLED=false
```

---

## Generate Strong Passwords & Keys

### On Linux/Mac:

```bash
# Generate 32-char hex string
openssl rand -hex 16

# Generate 20-char password
openssl rand -base64 15

# Generate random string (30 chars)
head -c 30 /dev/urandom | base64
```

### Online Generator:
https://www.random.org/strings/

**Format:**
- Password: 20+ characters, mixed case, numbers, symbols
- KEY/SECRET: 32+ characters, random alphanumeric

### Example:
```
Password:  Kj7$mP@xL9Q!vR2w4nY8bZ
KEY:       aB3cD9eF2gH7jK4lM8nP1qR6sT0uVwX
SECRET:    yZ5aB0cD8eF3gH1jK6lM2nP7qR9sTuV
```

---

## Environment Variables by Deployment Type

### Development (Local Machine)

```
Frontend:
VITE_DIRECTUS_URL=http://localhost:8055

Backend:
NODE_ENV=development
CACHE_ENABLED=false
DB_HOST=localhost
CORS_ORIGIN=http://localhost:5173
```

### Staging (Testing Server)

```
Frontend:
VITE_DIRECTUS_URL=https://staging.your-domain.com/api

Backend:
NODE_ENV=production
CACHE_ENABLED=true
DB_HOST=postgres (Docker) or localhost
CORS_ORIGIN=https://staging.your-domain.com
```

### Production (Live Server)

```
Frontend:
VITE_DIRECTUS_URL=https://your-domain.com/api

Backend:
NODE_ENV=production
CACHE_ENABLED=true
DB_HOST=postgres (Docker)
CORS_ORIGIN=https://your-domain.com
ADMIN_PASSWORD=VERY_STRONG_PASSWORD
DB_PASSWORD=VERY_STRONG_PASSWORD
```

---

## Docker Compose Override Values

If values differ from `.env`, can override in docker-compose.yml:

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}  # Reads from .env
      POSTGRES_USER: ${DB_USER}
      POSTGRES_DB: ${DB_DATABASE}
```

---

## Critical Security Notes

**NEVER:**
- ❌ Commit passwords to Git
- ❌ Use weak passwords (< 15 chars)
- ❌ Use same password for multiple services
- ❌ Share .env files publicly
- ❌ Use default credentials in production

**ALWAYS:**
- ✅ Use strong, random values
- ✅ Store .env in secure location
- ✅ Rotate passwords every 3 months
- ✅ Use different passwords per environment
- ✅ Use secrets management in production (AWS Secrets, HashiCorp Vault)

---

## Quick Setup Commands

### Generate all random values at once:

```bash
#!/bin/bash
echo "KEY=$(openssl rand -hex 16)"
echo "SECRET=$(openssl rand -hex 16)"
echo "DB_PASSWORD=$(openssl rand -base64 15)"
echo "ADMIN_PASSWORD=$(openssl rand -base64 15)"
```

Save output, then create `.env` file with those values.

---

## Checklist Before Deploying

- [ ] All passwords 20+ characters
- [ ] No default values used
- [ ] KEY and SECRET are different
- [ ] CORS_ORIGIN matches your domain
- [ ] PUBLIC_URL has https:// (production)
- [ ] Admin email is your email
- [ ] No whitespace in passwords
- [ ] All special characters escaped if needed

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `DB_PASSWORD=my-password` | Use special chars: `Kj7$mP@xL9` |
| `CORS_ORIGIN=http://domain.com` | Use https: `https://domain.com` |
| `PUBLIC_URL=domain.com/api` | Include https: `https://domain.com/api` |
| `KEY=123456789` | Too short - use 32+ chars |
| Same password everywhere | Use unique passwords per service |

---

**Template Status: Ready to use**
**Last Updated: 2025-10-28**
