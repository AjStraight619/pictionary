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
print_info "Starting servers in separate Ghostty windows..."

# Create temporary scripts for each server
BACKEND_SCRIPT="/tmp/pictionary_backend.sh"
FRONTEND_SCRIPT="/tmp/pictionary_frontend.sh"

# Create backend script
cat > "$BACKEND_SCRIPT" << EOF
#!/bin/bash
cd "$PWD/backend" && go run cmd/server/main.go
EOF
chmod +x "$BACKEND_SCRIPT"

# Create frontend script
cat > "$FRONTEND_SCRIPT" << EOF
#!/bin/bash
cd "$PWD/frontend" && npm run dev
EOF
chmod +x "$FRONTEND_SCRIPT"

# Open Ghostty terminals for each server
print_info "Starting Go backend server in a new Ghostty window..."
open -a Ghostty "$BACKEND_SCRIPT"

print_info "Starting frontend dev server in a new Ghostty window..."
open -a Ghostty "$FRONTEND_SCRIPT"

print_success "All servers started in separate Ghostty windows!"
print_info "Close the terminal windows to stop the servers."
