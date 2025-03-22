#!/bin/bash

# Print colorful messages
print_success() {
    echo -e "\033[0;32m$1\033[0m"
}

print_error() {
    echo -e "\033[0;31m$1\033[0m"
}

print_info() {
    echo -e "\033[0;34m$1\033[0m"
}

# Check Node.js version
print_info "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js version 20 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js version must be 20 or higher. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js version $(node -v) is installed."

# Check Go version
print_info "Checking Go version..."
if ! command -v go &> /dev/null; then
    print_error "Go is not installed. Please install Go."
    exit 1
fi
print_success "Go version $(go version) is installed."

# Install frontend dependencies
print_info "Installing frontend dependencies..."
cd frontend || exit
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install frontend dependencies."
        exit 1
    fi
else
    print_info "Frontend dependencies already installed."
fi
print_success "Frontend dependencies installed successfully."
cd ..

# Install backend dependencies
print_info "Installing backend dependencies..."
cd backend || exit
go mod tidy
if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies."
    exit 1
fi
print_success "Backend dependencies installed successfully."
cd ..

# Start servers
print_info "Starting servers..."

# Start backend server in the background
print_info "Starting Go backend server..."
cd backend || exit
go run cmd/server/main.go &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2
print_success "Backend server started with PID: $BACKEND_PID"

# Start frontend server
print_info "Starting frontend dev server..."
cd frontend || exit
npm run dev

# When npm run dev is terminated, also kill the backend
kill $BACKEND_PID
print_info "Shutting down backend server..."

print_success "All servers stopped. Goodbye!"
