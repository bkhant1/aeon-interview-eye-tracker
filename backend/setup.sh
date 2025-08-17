#!/bin/bash

echo "🚀 Setting up Eye Tracking Backend with PostgreSQL..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "📦 Installing Python dependencies..."
uv sync

echo "🐘 Starting PostgreSQL database..."
docker-compose up -d postgres

echo "⏳ Waiting for database to be ready..."
sleep 5

echo "🔧 Creating database tables..."
uv run python -c "
import asyncio
from database import init_db

async def setup():
    await init_db()
    print('✅ Database tables created successfully!')

asyncio.run(setup())
"

echo "🎉 Setup complete!"
echo ""
echo "📊 Database is running at: localhost:5432"
echo "🔗 API will be available at: http://localhost:8001"
echo "📈 pgAdmin (optional) at: http://localhost:8080"
echo ""
echo "🚀 To start the API server, run:"
echo "   uv run python main.py"
echo ""
echo "📝 To view the API documentation, visit:"
echo "   http://localhost:8001/docs" 