#!/bin/bash

# =============================================================================
# AI Chatbot Application - Linux Setup Script
# =============================================================================
# This script sets up the environment for deploying the AI Chatbot on Linux

set -e  # Exit on any error

echo "🐧 Starting Linux setup for AI Chatbot Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Consider using a non-root user for security."
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
print_status "Installing Node.js and npm..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js installed successfully"
else
    print_success "Node.js already installed: $(node --version)"
fi

# Install Python and pip
print_status "Installing Python and pip..."
sudo apt install -y python3 python3-pip python3-venv
print_success "Python installed: $(python3 --version)"

# Install PM2 globally
print_status "Installing PM2 process manager..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_success "PM2 installed successfully"
else
    print_success "PM2 already installed: $(pm2 --version)"
fi

# Install Git
print_status "Installing Git..."
if ! command -v git &> /dev/null; then
    sudo apt install -y git
    print_success "Git installed successfully"
else
    print_success "Git already installed: $(git --version)"
fi

# Install additional system dependencies
print_status "Installing system dependencies..."
sudo apt install -y \
    curl \
    wget \
    unzip \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Create application directories
print_status "Creating application directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p ml_training/models
mkdir -p ml_training/datasets
mkdir -p ml_training/checkpoints
mkdir -p temp

# Set proper permissions
print_status "Setting directory permissions..."
chmod 755 logs uploads ml_training temp
chmod +x scripts/*.sh

# Install application dependencies
print_status "Installing Node.js dependencies..."
npm install

print_success "✅ Linux setup completed successfully!"
print_status "Next steps:"
echo "1. Copy .env.linux to .env and update configuration"
echo "2. Update ecosystem.config.js with your server details"
echo "3. Run 'npm run pm2:start' to start the application"
echo "4. Check logs with 'npm run pm2:logs'"
