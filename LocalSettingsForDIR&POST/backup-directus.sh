#!/bin/bash

# Backup script для скачивания данных из Directus
# Использование: bash backup-directus.sh

DIRECTUS_URL="http://localhost:8055"
BACKUP_DIR="$(dirname "$0")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== Directus Backup Script ==="
echo "URL: $DIRECTUS_URL"
echo "Backup directory: $BACKUP_DIR"
echo ""

# Функция для скачивания коллекции
backup_collection() {
  local collection=$1
  local filename="$BACKUP_DIR/directus_${collection}_${TIMESTAMP}.json"

  echo "Скачиваю $collection..."
  curl -s "$DIRECTUS_URL/api/items/$collection?limit=-1" > "$filename"

  if [ $? -eq 0 ]; then
    echo "✓ Сохранено в: $filename"
    echo ""
  else
    echo "✗ Ошибка при скачивании $collection"
    echo ""
  fi
}

# Скачиваем категории
backup_collection "categories"

# Скачиваем упражнения
backup_collection "exercises"

echo "=== Backup завершён ==="
echo "Файлы сохранены в: $BACKUP_DIR"
echo ""
echo "Для восстановления используйте скрипт restore-directus.sh"
