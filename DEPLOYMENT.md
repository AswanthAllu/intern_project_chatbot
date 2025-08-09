# 🐧 Linux Deployment Guide - AI Chatbot Application

This guide provides comprehensive instructions for deploying the AI Chatbot application on Linux systems.

## 📋 Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Root or sudo access
- Domain name (optional, for SSL)
- At least 4GB RAM and 20GB storage

## 🚀 Quick Deployment Options

### Option 1: Automated Setup Script

```bash
# Clone the repository
git clone https://github.com/your-username/ai-chatbot.git
cd ai-chatbot/server

# Run automated setup
chmod +x scripts/setup-linux.sh
./scripts/setup-linux.sh

# Install dependencies
npm run install:deps

# Configure environment
cp .env.linux .env
nano .env  # Update with your configuration

# Start with PM2
npm run pm2:start
```

### Option 2: Docker Deployment

```bash
# Clone the repository
git clone https://github.com/your-username/ai-chatbot.git
cd ai-chatbot

# Configure environment
cp server/.env.linux server/.env
nano server/.env  # Update configuration

# Start with Docker Compose
docker-compose up -d

# Check status
docker-compose ps
```

### Option 3: Manual Installation

Follow the detailed steps below for manual installation.

## 📦 Manual Installation Steps

### 1. System Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python and pip
sudo apt install -y python3 python3-pip python3-venv

# Install PM2
sudo npm install -g pm2

# Install system dependencies
sudo apt install -y git curl wget unzip build-essential
```

### 2. Application Setup

```bash
# Clone repository
git clone https://github.com/your-username/ai-chatbot.git
cd ai-chatbot

# Install server dependencies
cd server
npm install

# Install client dependencies and build
cd ../client
npm install
npm run build

# Return to server directory
cd ../server
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.linux .env

# Edit configuration
nano .env
```

**Required Environment Variables:**
```env
# API Keys (REQUIRED)
GEMINI_API_KEY=your_gemini_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
HF_API_KEY=your_huggingface_api_key

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# Security
JWT_SECRET=your_secure_random_string

# Server
PORT=5005
NODE_ENV=production
```

### 4. Database Setup

**Option A: MongoDB Atlas (Recommended)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create cluster and get connection string
3. Update `MONGO_URI` in `.env`

**Option B: Local MongoDB**
```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl enable mongod
sudo systemctl start mongod

# Update .env
MONGO_URI=mongodb://localhost:27017/chatbotGeminiDB4
```

### 5. Process Management

**Using PM2 (Recommended):**
```bash
# Update ecosystem.config.js with your paths
nano ecosystem.config.js

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor
pm2 monit
```

**Using Systemd:**
```bash
# Copy service file
sudo cp ai-chatbot.service /etc/systemd/system/
sudo nano /etc/systemd/system/ai-chatbot.service  # Update paths

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable ai-chatbot
sudo systemctl start ai-chatbot

# Check status
sudo systemctl status ai-chatbot
```

### 6. Reverse Proxy Setup (Optional)

```bash
# Install Nginx
sudo apt install -y nginx

# Copy configuration
sudo cp nginx.conf /etc/nginx/sites-available/ai-chatbot
sudo ln -s /etc/nginx/sites-available/ai-chatbot /etc/nginx/sites-enabled/

# Update configuration
sudo nano /etc/nginx/sites-available/ai-chatbot  # Update domain and paths

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL Certificate (Optional)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 8. Firewall Configuration

```bash
# Configure UFW
sudo ufw allow 22     # SSH
sudo ufw allow 80     # HTTP
sudo ufw allow 443    # HTTPS
sudo ufw allow 5005   # Application
sudo ufw enable
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `DEEPSEEK_API_KEY` | DeepSeek API key | Yes |
| `HF_API_KEY` | HuggingFace API key | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `PORT` | Server port (default: 5005) | No |
| `NODE_ENV` | Environment (production) | No |

### API Keys Setup

1. **Gemini API**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **DeepSeek API**: Get from [DeepSeek Platform](https://platform.deepseek.com/api_keys)
3. **HuggingFace**: Get from [HF Settings](https://huggingface.co/settings/tokens)

## 🔍 Monitoring and Maintenance

### Health Checks

```bash
# Check application health
curl http://localhost:5005/api/health

# PM2 monitoring
pm2 monit
pm2 logs

# System monitoring
htop
df -h
free -h
```

### Backup

```bash
# Run backup script
npm run backup:db

# Manual backup
mongodump --uri="$MONGO_URI" --out=./backup-$(date +%Y%m%d)
```

### Updates

```bash
# Pull latest code
git pull origin main

# Update dependencies
npm install

# Rebuild client
cd ../client && npm run build && cd ../server

# Restart application
pm2 restart ecosystem.config.js
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   sudo lsof -i :5005
   sudo kill -9 <PID>
   ```

2. **Permission denied**
   ```bash
   sudo chown -R $USER:$USER /path/to/app
   chmod +x scripts/*.sh
   ```

3. **MongoDB connection failed**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Check connection string
   mongo "mongodb://localhost:27017/chatbotGeminiDB4"
   ```

4. **PM2 not starting**
   ```bash
   # Check logs
   pm2 logs
   
   # Reset PM2
   pm2 kill
   pm2 start ecosystem.config.js
   ```

### Log Locations

- Application logs: `./logs/`
- PM2 logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`

## 📞 Support

For deployment issues:
1. Check logs for error messages
2. Verify environment variables
3. Ensure all services are running
4. Check firewall settings
5. Verify API keys are valid

## 🔄 Scaling

For high-traffic deployments:
1. Use PM2 cluster mode
2. Set up load balancer
3. Use Redis for session storage
4. Implement database sharding
5. Use CDN for static assets
