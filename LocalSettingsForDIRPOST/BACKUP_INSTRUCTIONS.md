# Docker Backup Instructions

## Quick Backup Command

```bash
docker run --rm -v super-strong_postgres_data:/postgres_data -v /Users/egornevada/Desktop/super-strong/LocalSettingsForDIRPOST:/backup alpine tar czf /backup/postgres_volume_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C / postgres_data
```

## What This Does
1. Creates a compressed backup of the PostgreSQL volume
2. Saves it with timestamp: `postgres_volume_backup_YYYYMMDD_HHMMSS.tar.gz`
3. Stores in `/Users/egornevada/Desktop/super-strong/LocalSettingsForDIRPOST/`

## When to Backup
- After major code changes
- Before critical database modifications
- At end of each development session
- Before pulling/merging branches that affect database

## Backup Files to Keep Updated
1. **postgres_volume_backup_*.tar.gz** - Full PostgreSQL database volume
2. **docker-compose.yml.backup** - Current docker-compose configuration
   ```bash
   cp /Users/egornevada/Desktop/super-strong/docker-compose.yml /Users/egornevada/Desktop/super-strong/LocalSettingsForDIRPOST/docker-compose.yml.backup
   ```

## Recovery Process
1. Stop containers: `docker-compose down`
2. Remove old volume: `docker volume rm super-strong_postgres_data`
3. Restore from backup: `docker run --rm -v super-strong_postgres_data:/postgres_data -v /Users/egornevada/Desktop/super-strong/LocalSettingsForDIRPOST:/backup alpine tar xzf /backup/postgres_volume_backup_*.tar.gz -C /`
4. Start containers: `docker-compose up -d`

## Quick Reference
- Volume name: `super-strong_postgres_data`
- Backup location: `/Users/egornevada/Desktop/super-strong/LocalSettingsForDIRPOST/`
- Docker compose: `/Users/egornevada/Desktop/super-strong/docker-compose.yml`
