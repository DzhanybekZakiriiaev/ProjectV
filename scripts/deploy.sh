#!/bin/bash
# Deployment script for ProjectV Middleware

set -e

echo "🚀 Starting ProjectV deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Set project name
PROJECT_NAME=${COMPOSE_PROJECT_NAME:-projectv}
export COMPOSE_PROJECT_NAME=$PROJECT_NAME

echo "📦 Project name: $PROJECT_NAME"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from env.example..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ Created .env file. Please edit it with your configuration."
    else
        echo "❌ env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -p $PROJECT_NAME down 2>/dev/null || true

# Remove old containers with wrong names (if any)
echo "🧹 Cleaning up old containers..."
docker ps -a --filter "name=mongo" --format "{{.Names}}" | grep -v "^${PROJECT_NAME}-" | xargs -r docker rm -f 2>/dev/null || true

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose -p $PROJECT_NAME up -d --build

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
timeout=60
counter=0
while ! docker-compose -p $PROJECT_NAME exec -T mongo mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo "❌ MongoDB failed to start within $timeout seconds"
        docker-compose -p $PROJECT_NAME logs mongo
        exit 1
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done
echo " ✅ MongoDB is ready"

# Wait for API to be ready
echo "⏳ Waiting for API to be ready..."
timeout=60
counter=0
while ! curl -f http://localhost:3100/health > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo "❌ API failed to start within $timeout seconds"
        docker-compose -p $PROJECT_NAME logs api
        exit 1
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done
echo " ✅ API is ready"

# Show status
echo ""
echo "✨ Deployment complete!"
echo ""
echo "📊 Container status:"
docker-compose -p $PROJECT_NAME ps

echo ""
echo "🌐 Services:"
echo "   - API: http://localhost:3100"
echo "   - Health: http://localhost:3100/health"
echo "   - Swagger Docs: http://localhost:3100/docs"
echo ""
echo "📝 Next steps:"
echo "   1. Create an admin user: docker-compose exec api node scripts/create-admin.js"
echo "   2. Check logs: docker-compose logs -f"
echo "   3. View deployment guide: cat DEPLOYMENT.md"
echo ""

