# Readloop

## Production deployment (pm2)

The app is a single Next.js server (`web/`) with an in-process cron scheduler
(`web/src/jobs/scheduler.ts`), started via the `register()` instrumentation
hook when the server boots. pm2 keeps that one process alive across crashes
and reboots.

**One-time setup on the server:**

```bash
cd web
npm ci
npm run build
```

**Start (or reload if already running) in production:**

```bash
npm run deploy
```

This runs pending Drizzle migrations once, then starts/reloads the app under
pm2 using `ecosystem.config.cjs`. Run `npm run deploy` again for every future
release — it reloads the existing process rather than stacking a duplicate.

**Persist across server reboots** (one-time per machine):

```bash
npx pm2 startup   # prints and/or installs an OS-level init script
npx pm2 save      # snapshots the current process list to restore on boot
```

**Logs:**

```bash
npm run pm2:logs
```

**Stop:**

```bash
npm run pm2:stop
```

### Important: keep this at exactly 1 instance

`ecosystem.config.cjs` pins `instances: 1` / `exec_mode: "fork"`. The cron
scheduler keeps each user's scheduled job in an in-memory `Map`, rebuilt once
at process boot. Running more than one instance (or cluster mode) would
schedule — and send — every user's digest multiple times. Don't change this
without replacing the in-memory scheduler state with something shared
(e.g. a DB-backed lock or a dedicated job queue).
