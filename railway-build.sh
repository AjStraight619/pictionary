#!/bin/bash
set -e

# Install dependencies
echo "Installing build dependencies..."
apt-get update
apt-get install -y sqlite3 libsqlite3-dev gcc build-essential

# Create data directory
echo "Creating data directory..."
mkdir -p /data
chmod 777 /data

# Build the application with CGO enabled
echo "Building the Go application with CGO_ENABLED=1..."
cd backend
export CGO_ENABLED=1
go build -o ../main ./cmd/server/main.go

echo "Build completed successfully!" 