@echo off
REM Super Strong Backend - Development Setup Script (Windows)

echo.
echo 🚀 Super Strong Backend - Setup (Windows)
echo ================================

REM Check Python version
echo ✓ Checking Python version...
python --version

REM Create virtual environment
echo ✓ Creating virtual environment...
python -m venv venv

REM Activate venv
echo ✓ Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo ✓ Upgrading pip...
python -m pip install --upgrade pip setuptools wheel

REM Install dependencies
echo ✓ Installing dependencies...
pip install -r requirements.txt

REM Create .env if doesn't exist
if not exist .env (
    echo ✓ Creating .env from .env.example...
    copy .env.example .env
    echo   ⚠️  Please update .env with your configuration
) else (
    echo ✓ .env already exists
)

echo.
echo ================================
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Make sure Docker is running
echo 2. Start Docker services: docker-compose -f docker-compose.dev.yml up -d
echo 3. Activate venv: venv\Scripts\activate.bat
echo 4. Run backend: uvicorn app.main:app --reload
echo.
echo API Documentation: http://localhost:8000/docs
echo.
