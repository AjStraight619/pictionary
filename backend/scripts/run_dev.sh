#!/bin/bash


if [ -f .env ]; then
  echo "Loading environment variables from .env file"
  export $(grep -v '^#' .env | xargs)
else
  echo "No .env file found. Using default environment variables."
fi

if [ "$1" = "seed" ]; then
  echo "Running seed script to populate the database..."
  cd backend
  go run scripts/seed_words.go
  echo "Database seeding complete!"
  exit 0
fi

# Run the server
cd backend/cmd/server
go run main.go 