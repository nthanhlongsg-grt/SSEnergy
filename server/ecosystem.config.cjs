/**
 * PM2 Ecosystem Config — dùng cho Mắt Bão / cPanel Linux hosting
 *
 * Cách dùng:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup   (để auto-start khi server reboot)
 */

module.exports = {
  apps: [
    {
      name: 'growatt-api',
      script: './dist/index.js',

      // Chỉ chạy 1 instance vì SQLite không hỗ trợ multi-process writes
      instances: 1,
      exec_mode: 'fork',

      // Tự động restart nếu app crash
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',

      // Environment variables
      env: {
        NODE_ENV: 'production',
        TZ: 'Asia/Ho_Chi_Minh',
      },

      // Log files — tạo thư mục logs/ trước khi chạy
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Delay khi restart để tránh crash loop
      restart_delay: 3000,
      min_uptime: '5s',
    },
  ],
}
