@echo off
REM PayMigo Docker Deployment Script for Windows
REM Run this script to set up and start your PayMigo project with Docker

setlocal enabledelayedexpansion

echo.
echo ================================================================
echo    PayMigo Docker Setup ^& Deployment Script (Windows)
echo ================================================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [X] Docker is not installed. Please install Docker Desktop.
    echo     Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker compose version >nul 2>&1
if errorlevel 1 (
    echo [X] Docker Compose is not installed.
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo.

REM Step 1: Check if .env exists
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo [OK] .env file created
    echo.
    echo [!] IMPORTANT: Edit .env and add your credentials:
    echo     - DB_PASSWORD: Strong password for PostgreSQL
    echo     - JWT_SECRET: Random secret key for JWT
    echo     - FIREBASE_*: Your Firebase credentials
    echo     - RAZORPAY_*: Your Razorpay API keys
    echo.
    echo     After editing .env, run this script again.
    pause
    exit /b 1
) else (
    echo [OK] .env file exists
)

echo.
echo Validating docker-compose.yml...
docker compose config >nul 2>&1
if errorlevel 1 (
    echo [X] docker-compose.yml is invalid
    pause
    exit /b 1
)
echo [OK] docker-compose.yml is valid
echo.

echo Building Docker images...
docker compose build
if errorlevel 1 (
    echo [X] Build failed
    pause
    exit /b 1
)

echo.
echo Starting services...
docker compose up -d
if errorlevel 1 (
    echo [X] Failed to start services
    pause
    exit /b 1
)

echo.
echo Waiting for services to be healthy (10 seconds)...
timeout /t 10 /nobreak

echo.
echo Checking service status...
echo.
docker compose ps

echo.
echo ================================================================
echo    Setup Complete! [OK]
echo ================================================================
echo.
echo Access your services:
echo   * Frontend:    http://localhost:3000
echo   * Backend:     http://localhost:5000
echo   * ML Service:  http://localhost:8000
echo   * ML Docs:     http://localhost:8000/docs
echo.
echo Next step: Run database migrations
echo   docker compose exec backend npx prisma migrate deploy
echo.
echo Documentation:
echo   * DOCKER_DEPLOYMENT_GUIDE.md - Complete guide
echo   * DOCKER_QUICK_REFERENCE.md - Command cheatsheet
echo   * SETUP_COMPLETE.md - What was created
echo.
echo To stop services:
echo   docker compose down
echo.
echo View logs:
echo   docker compose logs -f backend
echo.
echo ================================================================
echo.
pause
