#!/bin/bash
# PayMigo Docker Deployment Script
# Run this script to set up and start your PayMigo project with Docker

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════"
echo "   PayMigo Docker Setup & Deployment Script"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop."
    echo "   Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

echo "✓ Docker is installed"
echo ""

# Step 1: Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Step 1: Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your credentials:"
    echo "   - DB_PASSWORD: Strong password for PostgreSQL"
    echo "   - JWT_SECRET: Random secret key for JWT"
    echo "   - FIREBASE_*: Your Firebase credentials"
    echo "   - RAZORPAY_*: Your Razorpay API keys"
    echo ""
    echo "   After editing .env, run this script again."
    exit 1
else
    echo "✓ .env file exists"
fi

echo ""
echo "🔍 Validating docker-compose.yml..."
docker compose config > /dev/null 2>&1 || {
    echo "❌ docker-compose.yml is invalid"
    exit 1
}
echo "✓ docker-compose.yml is valid"
echo ""

echo "🏗️  Step 2: Building Docker images..."
docker compose build

echo ""
echo "🚀 Step 3: Starting services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

echo ""
echo "✅ Step 4: Checking service status..."
docker compose ps

echo ""
echo "📊 Checking health status..."
echo ""

# Check Backend
if curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo "✓ Backend is running (http://localhost:5000)"
else
    echo "⏳ Backend is starting... (this may take 30 seconds)"
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✓ Frontend is running (http://localhost:3000)"
else
    echo "⏳ Frontend is starting..."
fi

# Check ML Service
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "✓ ML Service is running (http://localhost:8000)"
else
    echo "⏳ ML Service is starting..."
fi

# Check PostgreSQL
if docker compose exec -T postgres pg_isready -U paymigo > /dev/null 2>&1; then
    echo "✓ PostgreSQL is running"
else
    echo "⏳ PostgreSQL is starting..."
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "   Setup Complete! 🎉"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📱 Access your services:"
echo "   • Frontend:    http://localhost:3000"
echo "   • Backend:     http://localhost:5000"
echo "   • ML Service:  http://localhost:8000"
echo "   • ML Docs:     http://localhost:8000/docs"
echo ""
echo "🔄 Next step: Run database migrations"
echo "   docker compose exec backend npx prisma migrate deploy"
echo ""
echo "📚 Documentation:"
echo "   • DOCKER_DEPLOYMENT_GUIDE.md - Complete guide (8500+ words)"
echo "   • DOCKER_QUICK_REFERENCE.md - Command cheatsheet"
echo "   • SETUP_COMPLETE.md - What was created"
echo ""
echo "🛑 To stop services:"
echo "   docker compose down"
echo ""
echo "📖 View logs:"
echo "   docker compose logs -f backend"
echo ""
echo "════════════════════════════════════════════════════════════"
