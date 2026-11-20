// pm2 process definition for production. Run migrations separately before
// starting/reloading this (see README) — pm2 only manages the `next start`
// process and should not re-run migrations on every crash-restart.
module.exports = {
  apps: [
    {
      name: "readloop",
      // Run the Next.js production server directly rather than through
      // `npm start`, so pm2 manages the actual node process (and its PID/
      // restarts) instead of an intermediate npm wrapper process.
      script: "node_modules/.bin/next",
      args: "start",
      cwd: __dirname,
      // Must stay at 1: the cron scheduler (src/jobs/scheduler.ts) keeps
      // per-user state in an in-memory Map and is rebuilt once at process
      // boot via the instrumentation hook. Running more than one instance
      // (or cluster mode) would schedule and send every user's digest
      // multiple times.
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "30s",
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
