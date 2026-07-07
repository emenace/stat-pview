module.exports = {
  apps: [
    {
      name: 'stat-pview',
      script: 'src/server.js',
      instances: 'max',       // Utilize all available CPU cores
      exec_mode: 'cluster',   // Run in cluster mode for load balancing & high availability
      watch: false,           // Do not restart on file changes in production
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // Logs configuration
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      
      // Auto-restart parameters
      max_memory_restart: '300M', // Restart if RAM usage exceeds 300MB
      autorestart: true,
      exp_backoff_restart_delay: 100
    }
  ]
};
