#!/bin/bash

# This script should be run from the project root directory with: ./backend/scripts/run_dev.sh

# Load environment variables from .env file in the root directory
if [ -f .env ]; then
  echo "Loading environment variables from .env file"
  export $(grep -v '^#' .env | xargs)
else
  echo "No .env file found. Using default environment variables."
fi

# Run the server
cd backend/cmd/server
go run main.go 