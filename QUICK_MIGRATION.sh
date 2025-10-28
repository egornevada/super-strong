#!/bin/bash

# 🚀 Быстрая шпаргалка для миграции данных
# Выполняй по частям эти команды в Termius на сервере

echo "==============================================="
echo "📋 МИГРАЦИЯ ДАННЫХ НА PRODUCTION СЕРВЕР"
echo "Домен: https://strong.webtga.ru/"
echo "==============================================="
echo ""

# ШАГИ:
echo "ШАГ 1: Загрузить 3 файла в /root/directus/ через Termius"
echo "  - export-categories.json"
echo "  - export-exercises.json"
echo "  - import-data.sh"
echo ""
echo "ШАГ 2: Подключиться по SSH и выполнить:"
echo ""

echo "# Сделать скрипт исполняемым"
echo "chmod +x /root/directus/import-data.sh"
echo ""

echo "# Перейти в директорию"
echo "cd /root/directus"
echo ""

echo "# Запустить импорт (замени ПАРОЛЬ на реальный пароль админа)"
echo "./import-data.sh https://strong.webtga.ru admin@strong.webtga.ru ПАРОЛЬ"
echo ""

echo "ШАГ 3: Проверить результат"
echo ""

echo "# Проверить категории (должно быть 8)"
echo "curl -s https://strong.webtga.ru/api/items/categories | jq '.data | length'"
echo ""

echo "# Проверить упражнения (должно быть 16)"
echo "curl -s https://strong.webtga.ru/api/items/exercises | jq '.data | length'"
echo ""

echo "==============================================="
echo "✅ ГОТОВО! Категории и упражнения импортированы"
echo "==============================================="
