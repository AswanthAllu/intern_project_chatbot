#!/bin/bash

# =============================================================================
# AI Chatbot Application - Dependencies Installation Script
# =============================================================================

set -e

echo "📦 Installing AI Chatbot dependencies..."

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

# Install Python ML dependencies
print_status "Installing Python ML dependencies..."
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

# Install Python packages for ML training
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install transformers
pip install datasets
pip install accelerate
pip install peft
pip install bitsandbytes
pip install safetensors
pip install scikit-learn
pip install numpy
pip install pandas
pip install matplotlib
pip install seaborn
pip install jupyter

print_success "Python ML dependencies installed"

# Install Ollama (optional)
print_status "Installing Ollama (optional)..."
if ! command -v ollama &> /dev/null; then
    print_warning "Ollama not found. Installing..."
    curl -fsSL https://ollama.ai/install.sh | sh
    print_success "Ollama installed successfully"
    print_status "Starting Ollama service..."
    sudo systemctl enable ollama
    sudo systemctl start ollama
else
    print_success "Ollama already installed"
fi

# Install MongoDB (optional - for local database)
print_status "Installing MongoDB (optional)..."
read -p "Do you want to install MongoDB locally? (y/N): " install_mongo
if [[ $install_mongo =~ ^[Yy]$ ]]; then
    print_status "Installing MongoDB..."
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    sudo apt update
    sudo apt install -y mongodb-org
    sudo systemctl enable mongod
    sudo systemctl start mongod
    print_success "MongoDB installed and started"
else
    print_status "Skipping MongoDB installation (using cloud database)"
fi

# Install Nginx (optional - for reverse proxy)
print_status "Installing Nginx (optional)..."
read -p "Do you want to install Nginx for reverse proxy? (y/N): " install_nginx
if [[ $install_nginx =~ ^[Yy]$ ]]; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    print_success "Nginx installed and started"
    print_status "Nginx configuration will need to be set up manually"
else
    print_status "Skipping Nginx installation"
fi

# Install SSL certificates (optional)
print_status "SSL Certificate setup (optional)..."
read -p "Do you want to install Let's Encrypt SSL certificates? (y/N): " install_ssl
if [[ $install_ssl =~ ^[Yy]$ ]]; then
    sudo apt install -y certbot python3-certbot-nginx
    print_success "Certbot installed"
    print_warning "Run 'sudo certbot --nginx -d your-domain.com' to get SSL certificates"
else
    print_status "Skipping SSL certificate installation"
fi

# Set up firewall
print_status "Configuring firewall..."
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 5005  # Application port
sudo ufw allow 3005  # Client port (if serving client from same server)
sudo ufw --force enable
print_success "Firewall configured"

print_success "✅ Dependencies installation completed!"
print_status "Summary of installed components:"
echo "- Node.js and npm"
echo "- Python ML libraries (PyTorch, Transformers, etc.)"
echo "- PM2 process manager"
if command -v ollama &> /dev/null; then
    echo "- Ollama (local LLM server)"
fi
if command -v mongod &> /dev/null; then
    echo "- MongoDB (local database)"
fi
if command -v nginx &> /dev/null; then
    echo "- Nginx (web server)"
fi
echo "- UFW firewall (configured)"

print_status "Next steps:"
echo "1. Configure your .env file"
echo "2. Update ecosystem.config.js"
echo "3. Start the application with PM2"
