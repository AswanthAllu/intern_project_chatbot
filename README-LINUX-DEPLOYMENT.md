# 🐧 AI Chatbot - Linux Deployment Ready

## 🎯 Quick Start

### One-Command Deployment
```bash
git clone https://github.com/your-username/ai-chatbot.git
cd ai-chatbot
chmod +x deploy.sh
./deploy.sh
```

### Manual Deployment
```bash
# 1. Setup environment
cd server
cp .env.linux .env
nano .env  # Configure your API keys

# 2. Install dependencies
npm install
cd ../client && npm install && npm run build

# 3. Start with PM2
cd ../server
npm install -g pm2
pm2 start ecosystem.config.js
```

## 📦 What's Included

### ✅ Linux-Optimized Configuration
- **Environment Templates**: `.env.linux` with Linux-specific settings
- **Process Management**: PM2 ecosystem configuration
- **System Service**: Systemd service file
- **Reverse Proxy**: Nginx configuration
- **Container Support**: Docker and Docker Compose files

### ✅ Automated Setup Scripts
- **`deploy.sh`**: One-command deployment script
- **`scripts/setup-linux.sh`**: System setup and dependencies
- **`scripts/install-dependencies.sh`**: ML libraries and services
- **`scripts/backup-database.sh`**: Database backup automation

### ✅ Production Features
- **Health Monitoring**: `/api/health` endpoint
- **Process Clustering**: PM2 cluster mode
- **Log Management**: Structured logging
- **Security Headers**: Nginx security configuration
- **SSL Support**: Let's Encrypt integration
- **Firewall Rules**: UFW configuration

## 🚀 Deployment Options

### Option 1: PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Monitor
pm2 monit
pm2 logs
```

**Benefits:**
- ✅ Zero-downtime restarts
- ✅ Automatic crash recovery
- ✅ Cluster mode for scaling
- ✅ Built-in monitoring
- ✅ Log management

### Option 2: Docker
```bash
# Start with Docker Compose
docker-compose up -d

# Monitor
docker-compose ps
docker-compose logs -f
```

**Benefits:**
- ✅ Isolated environment
- ✅ Easy scaling
- ✅ Consistent deployments
- ✅ Built-in service orchestration

### Option 3: Systemd Service
```bash
# Install as system service
sudo cp server/ai-chatbot.service /etc/systemd/system/
sudo systemctl enable ai-chatbot
sudo systemctl start ai-chatbot
```

**Benefits:**
- ✅ System-level integration
- ✅ Automatic startup on boot
- ✅ Resource management
- ✅ Security isolation

## 🔧 Configuration

### Required Environment Variables
```env
# API Keys (Get from respective platforms)
GEMINI_API_KEY=your_gemini_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
HF_API_KEY=your_huggingface_api_key

# Database (MongoDB Atlas recommended)
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# Security
JWT_SECRET=your_secure_random_string

# Server
PORT=5005
NODE_ENV=production
```

### Optional Services
- **MongoDB**: Local database installation
- **Ollama**: Local LLM server
- **Nginx**: Reverse proxy and SSL
- **Redis**: Caching layer

## 📊 System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04+ (or compatible Linux)
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB
- **Network**: Internet connection for API calls

### Recommended Requirements
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: High-speed internet

## 🔍 Monitoring

### Health Checks
```bash
# Application health
curl http://localhost:5005/api/health

# PM2 status
pm2 status
pm2 monit

# System resources
htop
df -h
free -h
```

### Log Locations
- **Application**: `./logs/`
- **PM2**: `~/.pm2/logs/`
- **Nginx**: `/var/log/nginx/`
- **System**: `/var/log/syslog`

## 🔒 Security

### Firewall Configuration
```bash
sudo ufw allow 22     # SSH
sudo ufw allow 80     # HTTP
sudo ufw allow 443    # HTTPS
sudo ufw allow 5005   # Application
sudo ufw enable
```

### SSL Certificate
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

## 🔄 Maintenance

### Updates
```bash
# Pull latest code
git pull origin main

# Update dependencies
npm install

# Rebuild client
cd client && npm run build

# Restart application
pm2 restart all
```

### Backups
```bash
# Run backup script
npm run backup:db

# Manual MongoDB backup
mongodump --uri="$MONGO_URI" --out=./backup-$(date +%Y%m%d)
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
sudo lsof -i :5005
sudo kill -9 <PID>
```

**Permission denied:**
```bash
sudo chown -R $USER:$USER /path/to/app
chmod +x scripts/*.sh
```

**MongoDB connection failed:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Test connection
mongo "mongodb://localhost:27017/chatbotGeminiDB4"
```

**PM2 not starting:**
```bash
# Check logs
pm2 logs

# Reset PM2
pm2 kill
pm2 start ecosystem.config.js
```

## 📞 Support

### Getting Help
1. Check application logs: `pm2 logs`
2. Verify environment variables: `cat .env`
3. Test API endpoints: `curl http://localhost:5005/api/health`
4. Check system resources: `htop`, `df -h`
5. Review firewall: `sudo ufw status`

### Performance Optimization
- Use PM2 cluster mode for multiple CPU cores
- Set up Redis for caching
- Use Nginx for static file serving
- Implement database indexing
- Monitor memory usage and optimize

## 🎉 Success Indicators

### Application Running Successfully
- ✅ Health check returns 200: `curl http://localhost:5005/api/health`
- ✅ PM2 shows running status: `pm2 status`
- ✅ Logs show no errors: `pm2 logs`
- ✅ Database connection established
- ✅ API endpoints responding

### Ready for Production
- ✅ SSL certificate installed
- ✅ Firewall configured
- ✅ Monitoring set up
- ✅ Backup system in place
- ✅ Process management configured

**Your AI Chatbot is now ready for Linux deployment! 🚀**
