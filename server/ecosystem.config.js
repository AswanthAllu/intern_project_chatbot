// PM2 Ecosystem Configuration for Linux Deployment
module.exports = {
  apps: [
    {
      name: 'ai-chatbot-server',
      script: 'server.js',
      cwd: '/path/to/your/app/server', // Update this path
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 5005,
        HOST: '0.0.0.0'
      },
      
      // Resource limits
      max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART || '1G',
      min_uptime: '10s',
      max_restarts: 10,
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto restart on file changes (disable in production)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', 'ml_training'],
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      
      // Auto restart conditions
      restart_delay: 4000,
      autorestart: true,
      
      // Source map support
      source_map_support: true,
      
      // Node.js options
      node_args: '--max-old-space-size=2048'
    }
  ],
  
  deploy: {
    production: {
      user: 'ubuntu', // Change to your Linux username
      host: ['your-server-ip'], // Change to your server IP
      ref: 'origin/main',
      repo: 'https://github.com/your-username/your-repo.git', // Change to your repo
      path: '/home/ubuntu/ai-chatbot',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};
