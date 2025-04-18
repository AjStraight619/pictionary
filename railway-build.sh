#!/bin/bash
set -e

# Install dependencies
echo "Installing build dependencies..."
apt-get update
apt-get install -y sqlite3 libsqlite3-dev gcc build-essential redis-tools

# Create data directory
echo "Creating data directory..."
mkdir -p /data
chmod 777 /data

# Set environment variables for Redis
export REDIS_URL=${REDIS_URL:-"redis://redis:6379"}
echo "Using Redis URL: $REDIS_URL"

# Build the application with CGO enabled
echo "Building the Go application with CGO_ENABLED=1..."
cd backend
export CGO_ENABLED=1
go build -o ../main ./cmd/server/main.go

# Initialize and migrate database (only if tables don't exist)
echo "Checking database status..."
DB_PATH="/data/game.db"
if [ ! -f "$DB_PATH" ] || [ ! "$(sqlite3 $DB_PATH "SELECT name FROM sqlite_master WHERE type='table' AND name='words';")" ]; then
    echo "Setting up words table and seeding initial data..."
    go run ./scripts/seed_words.go
    echo "Database initialized successfully!"
else
    echo "Database already exists with words table. Skipping initialization."
fi

echo "Testing Redis connection..."
redis-cli -u $REDIS_URL ping || echo "Warning: Redis not available yet. Will retry at runtime."

echo "Build completed successfully!" 