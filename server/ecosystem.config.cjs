module.exports = {
  apps: [
    {
      name: 'sge-baohanh-api',
      cwd: __dirname,
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        TZ: 'Asia/Ho_Chi_Minh',
      },
    },
  ],
}
