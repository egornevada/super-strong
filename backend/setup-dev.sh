#!/bin/bash

# Super Strong Backend - Development Setup Script

set -e

echo "🚀 Super Strong Backend - Setup"
echo "================================"

# Check Python version
echo "✓ Checking Python version..."
python_version=$(python3 --version 2>&1)
echo "  Found: $python_version"

# Create virtual environment
echo "✓ Creating virtual environment..."
python3 -m venv venv

# Activate venv
echo "✓ Activating virtual environment..."
source venv/bin/activate || . venv/Scripts/activate

# Upgrade pip
echo "✓ Upgrading pip..."
pip install --upgrade pip setuptools wheel

# Install dependencies
echo "✓ Installing dependencies..."
pip install -r requirements.txt

# Create .env if doesn't exist
if [ ! -f ".env" ]; then
    echo "✓ Creating .env from .env.example..."
    cp .env.example .env
    echo "  ⚠️  Please update .env with your configuration"
else
    echo "✓ .env already exists"
fi

echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure Docker is running"
echo "2. Start Docker services: docker-compose -f docker-compose.dev.yml up -d"
echo "3. Activate venv: source venv/bin/activate"
echo "4. Run backend: uvicorn app.main:app --reload"
echo ""
echo "API Documentation: http://localhost:8000/docs"
