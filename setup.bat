@echo off
REM Quick Start Setup Script for Coconut Advisory System (Windows)

echo 🥥 Coconut Advisory System - Setup
echo ====================================

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.9+
    exit /b 1
)
echo ✓ Python found

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 16+
    exit /b 1
)
echo ✓ Node.js found

REM Setup Backend
echo.
echo Setting up Backend...
cd backend

if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    echo ✓ Virtual environment created
)

REM Activate venv
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt
echo ✓ Backend dependencies installed

REM Setup .env
if not exist ".env" (
    copy .env.example .env
    echo ⚠ Created .env file. Please edit it with your GROQ_API_KEY
)

cd ..

REM Setup Frontend
echo.
echo Setting up Frontend...
cd frontend

if not exist "node_modules" (
    echo Installing Node dependencies...
    call npm install
    echo ✓ Frontend dependencies installed
)

cd ..

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Edit backend\.env with your GROQ_API_KEY
echo 2. Run backend: cd backend ^&^& venv\Scripts\activate ^&^& python -m app.main
echo 3. Run frontend: cd frontend ^&^& npm start
echo 4. Configure API endpoint in app Settings
echo.
echo API Docs will be available at: http://localhost:8000/docs
pause
