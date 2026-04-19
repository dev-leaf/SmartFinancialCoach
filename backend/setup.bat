@echo off
REM Smart Expense Manager Backend - Setup Guide for Windows

echo.
echo 🚀 Smart Expense Manager - Backend Setup
echo ==========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js installed: %NODE_VERSION%

echo.
echo 📝 Next Steps:
echo ==============
echo.
echo 1. Install dependencies:
echo    npm install
echo.
echo 2. Copy environment file:
echo    copy .env.example .env
echo.
echo 3. Update .env with your PostgreSQL credentials:
echo    DATABASE_URL=postgresql://user:password@localhost:5432/smart_expense_db
echo.
echo 4. Create PostgreSQL database:
echo    createdb smart_expense_db
echo    (or use pgAdmin GUI)
echo.
echo 5. Setup Prisma and run migrations:
echo    npm run prisma:generate
echo    npm run prisma:migrate
echo.
echo 6. Start development server:
echo    npm run start:dev
echo.
echo ✅ Backend will run on: http://localhost:3000
echo.
