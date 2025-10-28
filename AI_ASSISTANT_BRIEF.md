# 📋 For AI Assistant - Project Brief & Deployment Guide

This file is for another AI assistant to help quickly deploy Super Strong to production.

---

## Quick Project Summary

**Super Strong** is a fitness app:
- **Frontend**: React 19 + TypeScript + Vite (builds to `/dist`)
- **Backend**: Directus CMS (runs in Docker)
- **Database**: PostgreSQL (in Docker)
- **Data**: Exercises & categories (stored in Directus)

**User flow:**
1. See calendar
2. Click date
3. Select exercises
4. Add sets (reps/weight)
5. Save workout

---

## What the User Needs

Deploy the app to production:
1. Build frontend (React)
2. Upload to server with Nginx
3. Run Directus backend (Docker)
4. Configure SSL certificates
5. Verify everything works

**Timeline:** 30-60 minutes

---

## Documentation Provided

The user has created 7 deployment guides:

### For Immediate Action
1. **QUICK_DEPLOY.md** ⭐ PRIMARY GUIDE
   - Copy-paste commands for 30-min deployment
   - Best for first deployment
   - Length: ~3 pages

2. **DEPLOYMENT_CHECKLIST.md**
   - Step-by-step checklist
   - Test each component
   - Track progress
   - Length: ~2 pages

### For Understanding
3. **DEPLOYMENT_GUIDE.md** (Very detailed)
   - Full explanation of each step
   - Why you're doing things
   - Troubleshooting
   - Length: ~10 pages

4. **README_DEPLOYMENT.md**
   - Overview & navigation
   - File organization
   - Quick reference
   - Length: ~4 pages

### For Setup
5. **ENV_TEMPLATES.md**
   - Environment variable templates
   - Password generation examples
   - Copy-paste ready
   - Length: ~3 pages

6. **PROJECT_CONTEXT.md**
   - Project architecture
   - File structure
   - Tech stack
   - Length: ~4 pages

7. **DIRECTUS_SETUP_GUIDE.md**
   - How to add exercises
   - Database schema
   - Troubleshooting
   - Length: ~5 pages

---

## Your Task as AI Assistant

When user provides these docs, help them:

1. **Choose deployment method**
   - Recommend QUICK_DEPLOY.md for speed
   - Or DEPLOYMENT_GUIDE.md for understanding

2. **Execute deployment steps**
   - Copy commands from QUICK_DEPLOY.md
   - Verify each step with DEPLOYMENT_CHECKLIST.md
   - Debug with DEPLOYMENT_GUIDE.md if issues

3. **Configuration help**
   - Generate strong passwords/keys
   - Fill ENV_TEMPLATES.md with values
   - Create nginx config

4. **Data migration**
   - Help import local exercises to production
   - Or guide adding exercises manually
   - Verify data loaded correctly

5. **Verification**
   - Test API endpoints
   - Check frontend loads
   - Verify CORS working
   - Test full user flow

6. **Troubleshooting**
   - Debug connection issues
   - Fix configuration errors
   - Resolve Docker issues
   - Help with nginx/SSL

---

## Critical Information

### Architecture
```
Frontend (React)        → Nginx (web server) → https://your-domain.com
Backend (Directus)     → Docker container   → https://your-domain.com/api
Database (PostgreSQL)  → Docker container   → PostgreSQL:5432
```

### Key Technologies
- **Build:** Vite (fast React build)
- **Styling:** Tailwind CSS
- **Backend:** Directus (headless CMS)
- **Database:** PostgreSQL
- **Containerization:** Docker & Docker Compose
- **Web Server:** Nginx (reverse proxy)
- **SSL:** Let's Encrypt (free HTTPS)

### Environment Variables (Production)
```
VITE_DIRECTUS_URL=https://your-domain.com/api    # Frontend
DB_PASSWORD=STRONG_PASSWORD                        # Backend
ADMIN_PASSWORD=STRONG_PASSWORD                     # Backend
KEY=32_CHAR_RANDOM_STRING                          # Backend security
SECRET=32_CHAR_RANDOM_STRING                       # Backend security
```

### Important Directories (on server)
```
/var/www/super-strong/dist/         → Frontend files
/root/directus/.env                 → Backend config (SENSITIVE!)
/etc/nginx/sites-available/         → Web server config
/etc/letsencrypt/live/              → SSL certificates
```

---

## Common User Needs

### 1. "How do I deploy this?"
→ Send them: **QUICK_DEPLOY.md**
→ Follow up with: **DEPLOYMENT_CHECKLIST.md**

### 2. "How do I add exercises?"
→ Send them: **DIRECTUS_SETUP_GUIDE.md**
→ Walk through Directus UI steps

### 3. "What environment variables do I need?"
→ Send them: **ENV_TEMPLATES.md**
→ Help generate secure passwords

### 4. "Why isn't it working?"
→ Check: **DEPLOYMENT_GUIDE.md** troubleshooting
→ Debug based on error messages

### 5. "What's the project structure?"
→ Send them: **PROJECT_CONTEXT.md**
→ Explain tech stack & architecture

---

## Deployment Steps Summary

1. **Prepare** (5 min)
   - Rent server
   - Configure DNS
   - Install Docker/Nginx

2. **Build Frontend** (2 min)
   - Run: `pnpm build`
   - Generates `/dist` folder

3. **Deploy Frontend** (5 min)
   - Upload `/dist` to server
   - Configure Nginx
   - Restart Nginx

4. **Deploy Backend** (10 min)
   - Create `.env` file
   - Create `docker-compose.yml`
   - Run: `docker-compose up -d`

5. **Add Data** (5 min)
   - Import from backup OR
   - Add exercises manually via UI

6. **Verify** (5 min)
   - Test frontend loads
   - Test API works
   - Test user flow

---

## Estimated Timeline

- **Experienced:** 30 minutes
- **First time:** 60-90 minutes
- **If debugging:** 2-3 hours

---

## What NOT to Do

❌ Don't skip SSL certificate (HTTPS required)
❌ Don't use weak passwords (< 15 chars)
❌ Don't expose .env file (contains secrets)
❌ Don't forget DNS configuration
❌ Don't deploy without backups
❌ Don't use default Directus credentials

---

## Testing Checklist

After deployment, verify:

```bash
# 1. Frontend loads
curl https://your-domain.com/

# 2. API responds
curl https://your-domain.com/api/system/info

# 3. Data exists
curl https://your-domain.com/api/items/exercises

# 4. Docker running
docker-compose ps

# 5. Nginx working
sudo systemctl status nginx

# 6. Browser test
Open: https://your-domain.com
- No blank page
- No console errors
- Calendar visible
- Click date → exercises load
```

---

## Quick Reference Commands

```bash
# Build frontend
pnpm build

# Start Docker
docker-compose up -d

# Check Docker logs
docker-compose logs -f directus

# View Nginx logs
tail -f /var/log/nginx/error.log

# Verify SSL
curl -I https://your-domain.com

# Check database
curl https://your-domain.com/api/items/exercises
```

---

## Contact Points

The user might ask about:

1. **Choosing hosting**
   → Recommend: DigitalOcean, Linode, Render

2. **Domain setup**
   → Guide: A records → server IP

3. **SSL certificates**
   → Explain: Let's Encrypt (free, automatic renewal)

4. **Docker issues**
   → Show: `docker-compose logs` for debugging

5. **Data migration**
   → Help: Export from local, import to server

6. **Performance tuning**
   → Suggest: Caching, compression, CDN

---

## Success Criteria

The deployment is successful when:

✅ `https://your-domain.com` loads without errors
✅ Browser shows calendar app (no blank page)
✅ Clicking date loads exercises
✅ Exercises have correct categories
✅ No 403/404 errors in console
✅ API endpoint responds: `curl https://your-domain.com/api/system/info`
✅ Admin UI works: `https://your-domain.com/api/admin`
✅ SSL certificate shows green lock

---

## Files You Have

```
super-strong/
├── QUICK_DEPLOY.md              ← START HERE
├── DEPLOYMENT_CHECKLIST.md
├── DEPLOYMENT_GUIDE.md
├── README_DEPLOYMENT.md
├── PROJECT_CONTEXT.md
├── DIRECTUS_SETUP_GUIDE.md
├── ENV_TEMPLATES.md
├── AI_ASSISTANT_BRIEF.md        ← You are here
│
└── [Source code]
    ├── src/
    ├── package.json
    ├── docker-compose.yml       ← For local dev
    ├── vite.config.ts
    └── ...
```

---

## Your Role

Act as a deployment assistant:

1. **Guide** - Help them follow QUICK_DEPLOY.md
2. **Verify** - Check each step with DEPLOYMENT_CHECKLIST.md
3. **Debug** - Use DEPLOYMENT_GUIDE.md for troubleshooting
4. **Explain** - Reference PROJECT_CONTEXT.md for architecture
5. **Configure** - Use ENV_TEMPLATES.md for variables
6. **Support** - Answer deployment questions

---

## Key Success Tips

✅ Have strong passwords ready before starting
✅ Follow QUICK_DEPLOY.md step-by-step
✅ Don't skip DNS configuration (wait for propagation)
✅ Don't skip SSL certificate
✅ Test each step before moving forward
✅ Check logs when something doesn't work
✅ Keep .env file secure (don't share)

---

**You have everything needed to help deploy this app!**
**Refer to the deployment docs for specific details.**

---

**Last Updated:** 2025-10-28
**Status:** Ready for deployment
**Estimated deployment time:** 30-60 minutes
