#!/bin/bash

# Restore script для восстановления данных в Directus
# Использование: bash restore-directus.sh <categories_file> <exercises_file>

if [ $# -ne 2 ]; then
  echo "Использование: bash restore-directus.sh <categories_file> <exercises_file>"
  echo ""
  echo "Пример:"
  echo "  bash restore-directus.sh directus_categories_20251103_232502.json directus_exercises_20251103_232502.json"
  exit 1
fi

DIRECTUS_URL="http://localhost:8055"
CATEGORIES_FILE=$1
EXERCISES_FILE=$2

echo "=== Directus Restore Script ==="
echo "URL: $DIRECTUS_URL"
echo ""

# Функция для восстановления коллекции
restore_collection() {
  local file=$1
  local collection=$2

  if [ ! -f "$file" ]; then
    echo "✗ Файл не найден: $file"
    return 1
  fi

  echo "Восстанавливаю $collection из $file..."

  # Читаем JSON и отправляем каждый элемент
  # ПРИМЕЧАНИЕ: Это упрощённый вариант, в боевом коде нужна обработка ошибок

  curl -s -X POST "$DIRECTUS_URL/api/items/$collection" \
    -H "Content-Type: application/json" \
    -d @"$file"

  if [ $? -eq 0 ]; then
    echo "✓ Данные $collection восстановлены"
    echo ""
  else
    echo "✗ Ошибка при восстановлении $collection"
    echo ""
  fi
}

# Восстанавливаем категории
restore_collection "$CATEGORIES_FILE" "categories"

# Восстанавливаем упражнения
restore_collection "$EXERCISES_FILE" "exercises"

echo "=== Restore завершён ==="
