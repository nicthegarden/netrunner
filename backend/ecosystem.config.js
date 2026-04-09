{
  "apps": [
    {
      "name": "netrunner-backend",
      "script": "./src/index.js",
      "instances": "max",
      "exec_mode": "cluster",
      "watch": false,
      "max_memory_restart": "500M",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      },
      "env_staging": {
        "NODE_ENV": "staging",
        "PORT": 3001
      },
      "error_file": "./logs/pm2-error.log",
      "out_file": "./logs/pm2-out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "merge_logs": true,
      "autorestart": true,
      "max_restarts": 10,
      "min_uptime": "10s",
      "listen_timeout": 3000,
      "kill_timeout": 5000,
      "ignore_watch": [
        "node_modules",
        "logs",
        ".env",
        ".env.local"
      ]
    }
  ]
}
