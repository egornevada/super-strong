# Security TODO

## High Priority 🔴

### 1. Telegram initData Signature Verification
**Status:** ❌ NOT IMPLEMENTED
**Severity:** HIGH
**Description:** Currently using `initDataUnsafe` which can be spoofed/modified in localStorage

**What needs to be done:**
- [ ] Validate `initData` signature on backend using HMAC-SHA256
- [ ] Use Telegram Bot Token to verify signature
- [ ] Create backend service (Supabase Edge Function or Node.js server) to validate and return sanitized user data
- [ ] Update frontend to send `initData` (not just `initDataUnsafe`) to backend for validation
- [ ] Return secure session token after validation
- [ ] Store session token instead of raw user data in localStorage

**Implementation Options:**
1. **Supabase Edge Functions** (recommended)
   - Serverless, no additional infra
   - Can be called directly from frontend
   - Access to Bot Token via secrets

2. **Node.js/Express backend**
   - More control
   - Can add additional validations
   - Need separate deployment

**Resources:**
- Telegram Bot API: https://core.telegram.org/bots/webapps#validating-data-received-from-the-web-app
- Example validation: https://github.com/Telegram-Mini-Apps/TMA.js/blob/master/packages/sdk/src/utils/validators.ts

**Estimated effort:** 2-3 hours

---

### 2. Bot Token Management
**Status:** ❌ NOT READY
**Severity:** HIGH
**Description:** Need to securely store and use Telegram Bot Token

**Requirements:**
- [ ] Store Bot Token in Supabase secrets (not in .env)
- [ ] Never expose Bot Token to frontend
- [ ] Use Bot Token only in backend for signature verification

---

## Medium Priority 🟡

### 3. Session Security
**Status:** ⚠️ PARTIALLY IMPLEMENTED
**Description:** Current localStorage session can be hijacked

**Improvements needed:**
- [ ] Add session expiration (1 week?)
- [ ] Add CSRF token for API requests
- [ ] Consider HttpOnly cookies instead of localStorage (more secure)
- [ ] Add refresh token mechanism

---

### 4. Rate Limiting
**Status:** ❌ NOT IMPLEMENTED
**Description:** API endpoints should have rate limiting

**Needed for:**
- [ ] User creation/login attempts
- [ ] Workout save operations
- [ ] Exercise sync operations

---

## Low Priority 🟢

### 5. Audit Logging
**Status:** ❌ NOT IMPLEMENTED
**Description:** Log auth events for security monitoring

**Log events:**
- [ ] User creation
- [ ] Login attempts (successful and failed)
- [ ] Data modifications
- [ ] Failed signature validations

---

## Implementation Checklist

**Phase 1 (Critical):**
- [ ] Implement initData signature verification
- [ ] Set up secure Bot Token storage

**Phase 2 (Important):**
- [ ] Add session expiration
- [ ] Add CSRF protection

**Phase 3 (Nice to have):**
- [ ] Rate limiting
- [ ] Audit logging

---

## Архитектурные компоненты для уточнения 🏗️

### Текущий стек Supabase Docker:

**Запущены (нужны ✅):**
- PostgreSQL (5432) - база данных
- Auth (GoTrue) - авторизация через Supabase
- Studio (3001) - веб-интерфейс для управления БД (для разработки)

**Запущены (лишние ❌):**
- **Kong (8000)** - API маршрутизатор/gateway
  - Назначение: маршрутизирует запросы на разные сервисы Supabase
  - Зачем нам: НЕ НУЖЕН - Python Backend (8001) сам создаёт endpoints
  - Статус: МОЖНО УДАЛИТЬ

- **PostgREST (3000)** - автоматический REST API к PostgreSQL
  - Назначение: генерирует REST endpoints из таблиц БД
  - Зачем нам: НЕ НУЖЕН - Python Backend (8001) сам работает с БД через SQL
  - Статус: МОЖНО УДАЛИТЬ

**Остальные (опционально ❓):**
- Storage API (5000) - загрузка файлов
  - Нужен если: загружаешь картинки/видео в приложение
  - Статус: МОЖНО ОСТАВИТЬ для удобства

- Analytics/Logflare (4000) - логирование и аналитика
  - Нужен если: хочешь видеть логи и метрики
  - Статус: МОЖНО УДАЛИТЬ для разработки

- Realtime - синхронизация в реальном времени
  - Нужен если: нужна real-time синхронизация между клиентами
  - Статус: МОЖНО УДАЛИТЬ если нет requirements

### Минимальный рабочий стек:
```
React Frontend (5173)
    ↓
Python Backend (8001)
    ↓
PostgreSQL (5432)
```

### Рекомендуемый для разработки:
```
React Frontend (5173)
    ↓
Python Backend (8001)
    ↓
PostgreSQL (5432)
+ Studio (3001) - для просмотра/редактирования БД
+ Storage (5000) - если нужна загрузка файлов
```

---

## Notes

- This project initially focused on Directus integration
- Migration to Supabase is ongoing
- Security improvements should be done before production deployment
- Remember: `initDataUnsafe` is for testing only!
- Kong и PostgREST идут в комплекте Supabase но не нужны для текущей архитектуры
