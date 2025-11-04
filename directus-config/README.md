# Directus Configuration Backup

## Содержимое

- `directus-full-backup-*.sql` - полный SQL дамп БД (схема + все данные)
- `directus-schema-only-*.sql` - только структура БД (без данных)
- `README.md` - этот файл

## Как восстановить конфигурацию

### Вариант 1: Восстановить ВСЮ базу (схема + данные)

```bash
# Восстановить полный бэкап
docker exec postgres psql -U postgres -d directus < directus-full-backup-XXXX.sql
```

### Вариант 2: Восстановить только структуру (без данных)

```bash
# Восстановить только схему
docker exec postgres psql -U postgres -d directus < directus-schema-only-XXXX.sql
```

### Вариант 3: Создать новую БД и восстановить

```bash
# Создать новую пустую БД
docker exec postgres createdb -U postgres -O postgres directus_new

# Восстановить туда дамп
docker exec postgres psql -U postgres -d directus_new < directus-full-backup-XXXX.sql

# Переименовать БД
docker exec postgres psql -U postgres -c "ALTER DATABASE directus_old RENAME TO directus_backup;"
docker exec postgres psql -U postgres -c "ALTER DATABASE directus_new RENAME TO directus;"
```

## Когда был сделан этот бэкап

- **Дата:** 2025-11-04
- **Содержит:** Все коллекции (users, workouts, workout_exercises, workout_sets, exercises, categories), поля, отношения, permissions
- **Размер:** ~167KB (конфиг был очищен от test-данных)

## Примечания

- Не включает Docker контейнеры, только БД PostgreSQL
- Для полного восстановления окружения смотри `docker-compose.yml` в корне проекта
- SQL дамп содержит точное состояние БД на момент экспорта
- Рекомендуется делать дамп перед большими изменениями в схеме
