module.exports = {
  apps: [
    {
      name: 'pesisir-api',
      script: 'src/server.ts',
      interpreter: 'bun',
      env: {
        NODE_ENV: 'production',
      },
      env_file: '.env',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/error.log',
      out_file: 'logs/output.log',
      merge_logs: true,
      pid_file: 'pids/pesisir-api.pid',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: 10000,
    },
  ],
};
