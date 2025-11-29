#!/bin/bash

# Docker Disk Space Cleanup Script
# This will free up space for Docker Desktop

echo "🧹 Docker Disk Space Cleanup"
echo "=============================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker is not running. Please start Docker Desktop first."
    echo ""
    echo "To start Docker Desktop:"
    echo "  open /Applications/Docker.app"
    echo ""
    exit 1
fi

echo "📊 Current Docker disk usage:"
docker system df
echo ""

echo "🗑️  Step 1: Removing stopped containers..."
docker container prune -f
echo "✅ Done"
echo ""

echo "🗑️  Step 2: Removing unused images..."
docker image prune -a -f
echo "✅ Done"
echo ""

echo "🗑️  Step 3: Removing unused volumes..."
docker volume prune -f
echo "✅ Done"
echo ""

echo "🗑️  Step 4: Removing unused networks..."
docker network prune -f
echo "✅ Done"
echo ""

echo "🗑️  Step 5: Removing build cache..."
docker builder prune -a -f
echo "✅ Done"
echo ""

echo "📊 New Docker disk usage:"
docker system df
echo ""

echo "💾 Checking Mac disk space..."
df -h / | grep -v Filesystem
echo ""

# Check Docker data directory size
DOCKER_DATA_SIZE=$(du -sh ~/Library/Containers/com.docker.docker/Data 2>/dev/null | cut -f1)
if [ ! -z "$DOCKER_DATA_SIZE" ]; then
    echo "📦 Docker data directory size: $DOCKER_DATA_SIZE"
    echo "   Location: ~/Library/Containers/com.docker.docker/Data"
    echo ""
fi

echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Restart Docker Desktop: open /Applications/Docker.app"
echo "2. Wait for Docker to fully start (whale icon in menu bar)"
echo "3. Try your deployment: cd infrastructure && cdk deploy"
echo ""
