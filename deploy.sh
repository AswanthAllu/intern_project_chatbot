#!/bin/bash

# =============================================================================
# AI Chatbot Application - Quick Deploy Script for Linux
# =============================================================================

set -e

echo "🚀 AI Chatbot Quick Deploy Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    print_error "This script is designed for Linux systems only"
    exit 1
fi

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Consider using a non-root user for security."
fi

print_status "Starting AI Chatbot deployment..."

# Step 1: System requirements check
print_status "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js 18+ first."
    echo "Run: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16+ required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js version: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm not found. Please install npm."
    exit 1
fi

print_success "npm version: $(npm --version)"

# Step 2: Choose deployment method
echo ""
print_status "Choose deployment method:"
echo "1) PM2 (Process Manager) - Recommended"
echo "2) Docker Compose - Containerized"
echo "3) Systemd Service - System service"
echo "4) Development mode - For testing"

read -p "Enter your choice (1-4): " deploy_choice

case $deploy_choice in
    1)
        DEPLOY_METHOD="pm2"
        print_status "Selected: PM2 deployment"
        ;;
    2)
        DEPLOY_METHOD="docker"
        print_status "Selected: Docker deployment"
        ;;
    3)
        DEPLOY_METHOD="systemd"
        print_status "Selected: Systemd service"
        ;;
    4)
        DEPLOY_METHOD="dev"
        print_status "Selected: Development mode"
        ;;
    *)
        print_error "Invalid choice. Defaulting to PM2."
        DEPLOY_METHOD="pm2"
        ;;
esac

# Step 3: Environment setup
print_status "Setting up environment..."

if [ ! -f "server/.env" ]; then
    if [ -f "server/.env.linux" ]; then
        cp server/.env.linux server/.env
        print_success "Environment template copied"
        print_warning "Please edit server/.env with your configuration"
        
        read -p "Do you want to edit the .env file now? (y/N): " edit_env
        if [[ $edit_env =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} server/.env
        fi
    else
        print_error "Environment template not found. Please create server/.env"
        exit 1
    fi
else
    print_success "Environment file already exists"
fi

# Step 4: Install dependencies
print_status "Installing dependencies..."

cd server
npm install
print_success "Server dependencies installed"

cd ../client
npm install
print_success "Client dependencies installed"

# Step 5: Build client
print_status "Building client application..."
npm run build
print_success "Client built successfully"

cd ..

# Step 6: Deploy based on chosen method
case $DEPLOY_METHOD in
    "pm2")
        print_status "Deploying with PM2..."
        
        # Install PM2 if not present
        if ! command -v pm2 &> /dev/null; then
            print_status "Installing PM2..."
            sudo npm install -g pm2
        fi
        
        cd server
        
        # Update ecosystem config
        if [ -f "ecosystem.config.js" ]; then
            print_status "Starting application with PM2..."
            pm2 start ecosystem.config.js
            pm2 save
            pm2 startup
            print_success "Application started with PM2"
        else
            print_status "Starting application with PM2 (simple mode)..."
            pm2 start server.js --name "ai-chatbot"
            pm2 save
            pm2 startup
            print_success "Application started with PM2"
        fi
        ;;
        
    "docker")
        print_status "Deploying with Docker..."
        
        if ! command -v docker &> /dev/null; then
            print_error "Docker not found. Please install Docker first."
            exit 1
        fi
        
        if ! command -v docker-compose &> /dev/null; then
            print_error "Docker Compose not found. Please install Docker Compose first."
            exit 1
        fi
        
        docker-compose up -d
        print_success "Application started with Docker Compose"
        ;;
        
    "systemd")
        print_status "Deploying with Systemd..."
        
        # Update service file with current path
        if [ -f "server/ai-chatbot.service" ]; then
            sed -i "s|/path/to/your/app|$(pwd)|g" server/ai-chatbot.service
            sudo cp server/ai-chatbot.service /etc/systemd/system/
            sudo systemctl daemon-reload
            sudo systemctl enable ai-chatbot
            sudo systemctl start ai-chatbot
            print_success "Application started as systemd service"
        else
            print_error "Service file not found"
            exit 1
        fi
        ;;
        
    "dev")
        print_status "Starting in development mode..."
        cd server
        npm run dev &
        print_success "Application started in development mode"
        print_warning "This is for testing only. Use PM2 or Docker for production."
        ;;
esac

# Step 7: Verify deployment
print_status "Verifying deployment..."
sleep 5

if curl -f http://localhost:5005/api/health &> /dev/null; then
    print_success "✅ Application is running successfully!"
    print_status "Application URL: http://localhost:5005"
    print_status "Health check: http://localhost:5005/api/health"
else
    print_error "❌ Application health check failed"
    print_status "Check logs for errors:"
    case $DEPLOY_METHOD in
        "pm2") echo "  pm2 logs" ;;
        "docker") echo "  docker-compose logs" ;;
        "systemd") echo "  sudo journalctl -u ai-chatbot -f" ;;
        "dev") echo "  Check terminal output" ;;
    esac
fi

# Step 8: Display next steps
echo ""
print_success "🎉 Deployment completed!"
print_status "Next steps:"
echo "1. Configure your API keys in server/.env"
echo "2. Set up domain and SSL (optional)"
echo "3. Configure firewall if needed"
echo "4. Set up monitoring and backups"

case $DEPLOY_METHOD in
    "pm2")
        echo ""
        print_status "PM2 Commands:"
        echo "  pm2 status          - Check status"
        echo "  pm2 logs            - View logs"
        echo "  pm2 restart all     - Restart app"
        echo "  pm2 stop all        - Stop app"
        ;;
    "docker")
        echo ""
        print_status "Docker Commands:"
        echo "  docker-compose ps   - Check status"
        echo "  docker-compose logs - View logs"
        echo "  docker-compose restart - Restart"
        echo "  docker-compose down - Stop"
        ;;
    "systemd")
        echo ""
        print_status "Systemd Commands:"
        echo "  sudo systemctl status ai-chatbot  - Check status"
        echo "  sudo journalctl -u ai-chatbot -f  - View logs"
        echo "  sudo systemctl restart ai-chatbot - Restart"
        echo "  sudo systemctl stop ai-chatbot    - Stop"
        ;;
esac

print_success "Deployment script completed!"
