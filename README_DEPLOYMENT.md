# 🚀 Super Strong - Deployment Documentation

Complete guide for deploying the app to production.

---

## 📚 Documentation Files

### For Quick Deployment
1. **QUICK_DEPLOY.md** ⭐ START HERE
   - 30-minute deployment with copy-paste commands
   - Best for first-time deployment

2. **DEPLOYMENT_CHECKLIST.md**
   - Step-by-step verification checklist
   - Test each component as you go

### For Understanding
3. **DEPLOYMENT_GUIDE.md**
   - Detailed explanation of each step
   - Why you're doing each step
   - Troubleshooting guide

4. **PROJECT_CONTEXT.md**
   - Project architecture overview
   - How components work together
   - What data flows where

5. **DIRECTUS_SETUP_GUIDE.md**
   - How to add exercises and categories
   - Directus admin interface guide
   - Database schema reference

### For Configuration
6. **ENV_TEMPLATES.md**
   - All environment variable templates
   - How to generate secure passwords
   - Security best practices

---

## 🎯 Quick Start (30 minutes)

### Step 1: Read first
👉 Open **QUICK_DEPLOY.md** - follow all commands in order

### Step 2: Verify during deployment
👉 Use **DEPLOYMENT_CHECKLIST.md** - check items as you complete them

### Step 3: If stuck
👉 Read **DEPLOYMENT_GUIDE.md** - detailed explanations

### Step 4: For data/content
👉 Reference **DIRECTUS_SETUP_GUIDE.md** - how to add exercises

### Step 5: For env variables
👉 Use **ENV_TEMPLATES.md** - copy-paste templates

---

## 🔄 What You're Deploying

```
Super Strong App
│
├── Frontend (React + Vite)
│   ├── Built to: /dist folder
│   ├── Deployed on: Nginx web server
│   └── Accessible at: https://your-domain.com
│
├── Backend (Directus API)
│   ├── Runs in: Docker container
│   ├── Database: PostgreSQL (also in Docker)
│   └── Accessible at: https://your-domain.com/api
│
└── Data
    ├── Exercises (stored in PostgreSQL)
    ├── Categories (stored in PostgreSQL)
    └── User tracking (stored in browser memory - lost on refresh)
```

---

## 📋 Prerequisites

Before starting, you need:

- [ ] VPS or server with Ubuntu 22.04 LTS
- [ ] Domain name (bought and DNS configured)
- [ ] SSH access to server
- [ ] Local copy of project with all exercises added
- [ ] Database backup from local (optional, can re-add data manually)

### Recommended Providers
- **Cheap:** DigitalOcean ($5-12/month), Linode, Vultr
- **All-in-one:** Railway, Render (automatic deployment)
- **Enterprise:** AWS, Google Cloud, Azure

---

## 🛠️ System Requirements

### Server (VPS)
- **OS:** Ubuntu 22.04 LTS (or similar)
- **CPU:** 1+ core
- **RAM:** 2GB+ (4GB+ recommended)
- **Storage:** 20GB+ (for OS, app, database)
- **Bandwidth:** Unlimited or 5TB+/month

### Local Machine (for building)
- Node.js 18+
- pnpm package manager
- Git

---

## 🚢 Deployment Workflow

### Day 1: Setup
```
1. Rent server (5 min)
2. Configure DNS (5 min)
3. Install system packages (3 min)
4. Get SSL certificate (5 min)
5. Deploy frontend (5 min)
6. Deploy backend (5 min)
7. Add data (5 min)
8. Verify (5 min)
```

**Total: ~40 minutes**

### After First Deployment
- Monitor logs for 1 week
- Make sure backups are running
- Update documentation if needed

---

## 🔐 Security Checklist

Before going live:

- [ ] All default passwords changed
- [ ] SSL certificate installed (HTTPS)
- [ ] Database passwords are strong (20+ chars)
- [ ] Admin password is strong (20+ chars)
- [ ] KEY and SECRET are random 32+ chars
- [ ] CORS only allows your domain
- [ ] Firewall blocks unnecessary ports
- [ ] SSH key setup (no password login)
- [ ] Automated backups enabled

See **ENV_TEMPLATES.md** for password generation.

---

## 🎛️ Configuration Files

### Frontend
- `vite.config.ts` - Build configuration
- `.env.local` - Local development
- `.env.production` - Production build (if needed)
- `tailwind.config.cjs` - Styling
- `tsconfig.app.json` - TypeScript config

### Backend
- `.env` - Environment variables (on server)
- `docker-compose.yml` - Docker setup (on server)
- `docker-compose.prod.yml` - Production variant

### Server (Nginx)
- `/etc/nginx/sites-available/super-strong` - Web server config
- `/etc/letsencrypt/live/your-domain.com/` - SSL certificates

---

## 📊 Important Directories

### On Your Server

```
/var/www/super-strong/          # Frontend app
  ├── dist/                     # Built React files
  │   ├── index.html
  │   ├── assets/
  │   └── ...
  └── .env                      # Frontend config (if needed)

/root/directus/                 # Backend app
  ├── docker-compose.yml        # Docker setup
  ├── .env                      # Backend config ⚠️ IMPORTANT
  ├── uploads/                  # User uploads
  └── database/                 # Database files (Docker volume)

/etc/letsencrypt/              # SSL certificates
  └── live/your-domain.com/

/etc/nginx/sites-available/    # Nginx configs
/var/log/nginx/                # Web server logs
```

---

## 🔍 Verification Commands

### After deployment, run these to verify:

```bash
# Frontend loads
curl https://your-domain.com/ | head -20

# API responds
curl https://your-domain.com/api/system/info

# Database has data
curl https://your-domain.com/api/items/exercises

# Docker containers running
docker-compose -f /root/directus/docker-compose.yml ps

# Nginx working
sudo systemctl status nginx
```

---

## 🐛 Common Issues

| Problem | Check | Solution |
|---------|-------|----------|
| Blank page | F12 console | API URL issue - see DEPLOYMENT_GUIDE.md |
| API 403 | CORS_ORIGIN | Must match domain exactly |
| Directus won't start | Logs: `docker logs directus` | Check .env variables |
| SSL certificate error | Domain DNS | Wait for DNS propagation |
| Database won't connect | Docker running | `docker-compose ps` |

See **DEPLOYMENT_GUIDE.md** for detailed troubleshooting.

---

## 📈 After Launch

### First Week
- [ ] Monitor error logs daily
- [ ] Test all features manually
- [ ] Check performance
- [ ] Verify backups running

### Ongoing
- [ ] Weekly log review
- [ ] Monthly security updates
- [ ] Quarterly password rotation
- [ ] Document any changes

---

## 📞 Getting Help

### During Deployment
1. Check **QUICK_DEPLOY.md** - follow exact steps
2. If stuck, read **DEPLOYMENT_GUIDE.md** - detailed explanations
3. Check **DEPLOYMENT_CHECKLIST.md** - verify each step

### For Data Issues
- See **DIRECTUS_SETUP_GUIDE.md** - add exercises/categories
- See **PROJECT_CONTEXT.md** - understand data structure

### For Configuration
- See **ENV_TEMPLATES.md** - environment variables
- See **DEPLOYMENT_GUIDE.md** - full configuration details

### For Code Issues
- Check console (F12) for JavaScript errors
- Check nginx logs: `tail -f /var/log/nginx/error.log`
- Check Directus logs: `docker-compose logs directus`

---

## 🎓 Learning Resources

### Deployment Concepts
- Nginx basics: https://nginx.org/en/docs/
- Docker: https://docs.docker.com/
- SSL/HTTPS: https://letsencrypt.org/getting-started/

### Directus
- Documentation: https://docs.directus.io/
- API Reference: https://docs.directus.io/reference/
- Self-hosted guide: https://docs.directus.io/self-hosted/

### React/Frontend
- Vite guide: https://vitejs.dev/
- Deploying React: https://vitejs.dev/guide/static-deploy.html

---

## ✅ Pre-Deployment Checklist

Before opening the `QUICK_DEPLOY.md`:

- [ ] Server rented and accessible via SSH
- [ ] Domain purchased and DNS configured
- [ ] All exercises added to local Directus
- [ ] Local database backed up
- [ ] You have strong passwords ready (or will generate)
- [ ] You understand HTTPS is required (not HTTP)
- [ ] You have 1 hour free to complete deployment

---

## 📞 File Organization

All deployment docs in `/super-strong/`:

```
super-strong/
├── QUICK_DEPLOY.md              ⭐ START HERE
├── DEPLOYMENT_CHECKLIST.md      Use during deployment
├── DEPLOYMENT_GUIDE.md          For detailed info
├── PROJECT_CONTEXT.md           Understand architecture
├── DIRECTUS_SETUP_GUIDE.md      Add exercise data
├── ENV_TEMPLATES.md             Copy environment vars
├── README_DEPLOYMENT.md         This file
└── [source code...]
```

---

## 🚀 Ready to Deploy?

**Choose your path:**

### Path 1: Experienced with servers?
→ Open **QUICK_DEPLOY.md** and copy-paste commands

### Path 2: First time deploying?
→ Read **DEPLOYMENT_GUIDE.md** first, then **QUICK_DEPLOY.md**

### Path 3: Need to understand everything?
→ Start with **PROJECT_CONTEXT.md**, then **DEPLOYMENT_GUIDE.md**

---

**Status: ✅ Ready to deploy**
**Estimated time: 30-60 minutes**
**Difficulty: Medium**

---

**Need help? All answers are in these docs!**
