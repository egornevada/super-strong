#!/bin/bash

# 🚀 Import Data to Production Directus Server
# Usage: ./import-data.sh <server-url> <admin-email> <admin-password>

if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
  echo "Usage: ./import-data.sh <server-url> <admin-email> <admin-password>"
  echo "Example: ./import-data.sh https://your-domain.com admin@your-domain.com password123"
  exit 1
fi

SERVER_URL="$1"
ADMIN_EMAIL="$2"
ADMIN_PASSWORD="$3"

echo "🔐 Authenticating to Directus..."
TOKEN=$(curl -s -X POST "$SERVER_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | jq -r '.data.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Authentication failed"
  exit 1
fi

echo "✅ Authenticated: $TOKEN"

# Clear existing data (optional - uncomment if needed)
# echo "🗑️  Clearing existing data..."
# curl -s -X DELETE "$SERVER_URL/api/items/exercises" -H "Authorization: Bearer $TOKEN"
# curl -s -X DELETE "$SERVER_URL/api/items/categories" -H "Authorization: Bearer $TOKEN"

echo ""
echo "📋 Importing categories..."
CATEGORIES=$(jq '.data' export-categories.json)
curl -s -X POST "$SERVER_URL/api/items/categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "$CATEGORIES" | jq '.data | length'

echo "✅ Categories imported"

echo ""
echo "💪 Importing exercises..."
EXERCISES=$(jq '.data' export-exercises.json)
curl -s -X POST "$SERVER_URL/api/items/exercises" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "$EXERCISES" | jq '.data | length'

echo "✅ Exercises imported"

echo ""
echo "🎉 Import complete!"
echo ""
echo "Verify:"
echo "  curl $SERVER_URL/api/items/categories"
echo "  curl $SERVER_URL/api/items/exercises"
