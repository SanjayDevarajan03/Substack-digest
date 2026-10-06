# Substack Digest Summarizer — Project Structure

## Overview
A full-stack app that tracks Substack writers a user follows, fetches new posts on a schedule (weekly/monthly), summarizes them with an LLM, and emails a digest with links back to the original articles.

## Suggested Stack
- Backend: Node.js (Express or Fastify) or Python (FastAPI)
- Database: PostgreSQL
- Queue/scheduler: cron (node-cron / APScheduler) or a job queue (BullMQ) if you want retries
- Email: Resend, SendGrid, or Gmail API
- LLM: Claude API for summarization
- Frontend: React (Vite) + Tailwind
- Auth: simple email/password or magic link (single-user to start, so this can be minimal)

## Folder Structure

```
substack-digest/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts                 # env var loading/validation
│   │   ├── db/
│   │   │   ├── schema.sql             # or Prisma/Drizzle schema
│   │   │   ├── migrations/
│   │   │   └── client.ts
│   │   ├── models/
│   │   │   ├── writer.ts              # subscribed Substack writers
│   │   │   ├── article.ts             # fetched posts
│   │   │   ├── digest.ts              # generated digest runs
│   │   │   └── user.ts
│   │   ├── services/
│   │   │   ├── feedFetcher.ts         # pulls RSS from *.substack.com/feed
│   │   │   ├── articleParser.ts       # extracts title/body/link/pubDate
│   │   │   ├── summarizer.ts          # calls LLM, produces summary per article
│   │   │   ├── digestBuilder.ts       # assembles digest from summaries
│   │   │   └── emailSender.ts         # sends/drafts the digest email
│   │   ├── jobs/
│   │   │   ├── scheduler.ts           # cron registration
│   │   │   └── runDigest.ts           # orchestrates fetch → summarize → send
│   │   ├── routes/
│   │   │   ├── writers.ts             # CRUD for tracked writers
│   │   │   ├── digests.ts             # view past digests, trigger manual run
│   │   │   └── settings.ts            # cadence, delivery email, digest time
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   └── index.ts                   # app entrypoint
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # list of tracked writers + last digest status
│   │   │   ├── AddWriter.tsx          # add a Substack URL to track
│   │   │   ├── DigestHistory.tsx      # past digests, resend/preview
│   │   │   └── Settings.tsx           # cadence (weekly/monthly), delivery email
│   │   ├── components/
│   │   │   ├── WriterCard.tsx
│   │   │   ├── DigestPreview.tsx
│   │   │   └── ScheduleForm.tsx
│   │   ├── api/
│   │   │   └── client.ts              # calls backend REST API
│   │   └── App.tsx
│   ├── package.json
│   └── .env.example
│
├── shared/
│   └── types.ts                       # shared TS types (Writer, Article, Digest)
│
├── docker-compose.yml                 # postgres + backend + frontend
└── README.md
```

## Data Model (core tables)
- `writers`: id, substack_url, display_name, feed_url, added_at
- `articles`: id, writer_id, title, url, published_at, raw_content, fetched_at
- `summaries`: id, article_id, summary_text, generated_at
- `digests`: id, period_start, period_end, sent_at, status
- `digest_articles`: join table (digest_id, article_id) — which articles went into which digest
- `settings`: user_id, cadence (weekly/monthly), delivery_email, send_day/time

## Core Flow
1. User adds a Substack writer's URL in the frontend → backend derives the RSS feed URL (`{substack_url}/feed`) and stores it.
2. Scheduler fires on the configured cadence (cron job).
3. `runDigest` job: fetch each writer's feed → filter articles published since the last run → summarize each via LLM → build digest → send/draft email with original links → log the digest in the DB.
4. Frontend shows digest history and lets the user tweak cadence, add/remove writers, or trigger a manual run.

## Build Order (suggested)
1. DB schema + backend CRUD for writers
2. Feed fetcher + article parser (get raw RSS working end to end)
3. Summarizer service (LLM integration)
4. Digest builder + email sender
5. Scheduler/cron wiring
6. Frontend dashboard + settings UI
7. Digest history view
