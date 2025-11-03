#!/bin/bash

# Backup script для скачивания данных из PostgreSQL (super_strong)
# Использование: bash backup-postgres.sh

BACKUP_DIR="$(dirname "$0")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== PostgreSQL Backup Script ==="
echo "Database: super_strong"
echo "Backup directory: $BACKUP_DIR"
echo ""

# Бекап всей БД
DB_BACKUP="$BACKUP_DIR/super_strong_full_${TIMESTAMP}.sql"
echo "Создаю полный бекап БД..."
pg_dump -h localhost -U postgres -d super_strong > "$DB_BACKUP" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✓ Полный бекап сохранён: $DB_BACKUP"
  echo ""
else
  echo "✗ Ошибка при создании полного бекапа (может быть PostgreSQL не запущен)"
  echo ""
fi

# Бекап только тренировок (JSON)
WORKOUTS_BACKUP="$BACKUP_DIR/super_strong_workouts_${TIMESTAMP}.json"
echo "Извлекаю только тренировки..."

cat > /tmp/export_workouts.sql << 'EOF'
\c super_strong

-- Export workouts and sets as JSON
\a
\t
SELECT json_pretty(json_agg(json_build_object(
  'id', w.id,
  'user_id', w.user_id,
  'workout_date', w.workout_date,
  'created_at', w.created_at,
  'sets', (
    SELECT json_agg(json_build_object(
      'id', ws.id,
      'exercise_id', ws.exercise_id,
      'reps', ws.reps,
      'weight', ws.weight,
      'set_order', ws.set_order,
      'created_at', ws.created_at
    ) ORDER BY ws.set_order)
    FROM workout_sets ws
    WHERE ws.workout_id = w.id
  )
))) FROM workouts w;
EOF

psql -h localhost -U postgres -f /tmp/export_workouts.sql > "$WORKOUTS_BACKUP" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✓ Тренировки сохранены: $WORKOUTS_BACKUP"
  echo ""
else
  echo "✗ Ошибка при извлечении тренировок"
  echo ""
fi

# Бекап пользователей (JSON)
USERS_BACKUP="$BACKUP_DIR/super_strong_users_${TIMESTAMP}.json"
echo "Извлекаю пользователей..."

cat > /tmp/export_users.sql << 'EOF'
\c super_strong

-- Export users as JSON
\a
\t
SELECT json_pretty(json_agg(json_build_object(
  'id', id,
  'username', username,
  'telegram_id', telegram_id,
  'first_name', first_name,
  'last_name', last_name,
  'created_at', created_at
))) FROM users;
EOF

psql -h localhost -U postgres -f /tmp/export_users.sql > "$USERS_BACKUP" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✓ Пользователи сохранены: $USERS_BACKUP"
  echo ""
else
  echo "✗ Ошибка при извлечении пользователей"
  echo ""
fi

# Очистка временных файлов
rm -f /tmp/export_workouts.sql /tmp/export_users.sql

echo "=== Backup завершён ==="
echo "Файлы сохранены в: $BACKUP_DIR"
echo ""
echo "Для восстановления используйте pg_restore или psql:"
echo "  psql -h localhost -U postgres -d super_strong < super_strong_full_${TIMESTAMP}.sql"
