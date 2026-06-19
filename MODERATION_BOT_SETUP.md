# Moderation Bot Setup

The background moderation worker (`lib/moderationWorker.ts`) needs an admin
account to act as. This account is NOT created automatically — create it
yourself (e.g. directly in your Neon DB, same way you created the flag post).

## Required

1. A user row with:
   - `isAdmin: true`
   - `email` matching `MODERATOR_BOT_EMAIL` (see below)
   - Any username/password (the bot signs its own JWT, it never logs in
     through `/api/login`, so the password is irrelevant)

2. Environment variables (add to `.env`):

```
MODERATOR_BOT_EMAIL=moderation@feedbacktn.local
MODERATOR_POLL_INTERVAL_MS=15000
APP_ORIGIN=http://localhost:3000
```

   - `MODERATOR_BOT_EMAIL` — must match the admin account's email exactly
   - `MODERATOR_POLL_INTERVAL_MS` — how often (ms) the worker checks for open
     reports. 15s is fine for local testing; for the live CTB instance you
     may want something like 10-20s so solvers aren't waiting forever
   - `APP_ORIGIN` — the origin the worker uses to fetch internal pages
     (must be reachable from inside the same container/instance)

## How it works

On server boot (`instrumentation.ts`), the worker starts an interval that:

1. Queries `Report` rows where `status = 'open'`
2. For each one, checks the `details` field for a `/post/<id>` pattern
3. If found, visits that path using a JWT signed for the moderator account
4. Marks the report `reviewed`

No human interaction required — this replaces any manual dashboard click.

## Verifying it works locally

1. Create the moderator account + env vars above
2. Run `npm run dev`
3. Submit a report with `/post/<id>` in the `details` field
4. Wait up to `MODERATOR_POLL_INTERVAL_MS`
5. Check the report's status flips to `reviewed` in the dashboard
