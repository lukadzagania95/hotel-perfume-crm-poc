# HOC Hotel Perfume CRM

A single-tenant operations app for hotel perfume sampling, stock tracking, receptionist email
follow-up, and conservative processing of email replies.

## Production safeguards

- Test delivery is the default: every outbound message goes only to `EMAIL_TEST_RECIPIENT`.
- Live delivery requires both `EMAIL_DELIVERY_MODE=live` and `EMAIL_LIVE_SEND_ENABLED=true`.
- The UI visibly identifies TEST or LIVE mode and the email log records actual and intended recipients.
- Scheduled sends respect each template's frequency and use idempotency keys to prevent duplicates.
- Failed sends can be retried; successful sends are not repeated inside the same schedule window.
- Incoming replies are only auto-applied when the sender is trusted, one room is referenced, the intent
  is supported, and a valid transition exists. Other messages go to manual review.
- UI access is protected with a signed, HTTP-only administrator session in production; cron endpoints use a separate
  bearer secret, and `/api/health` exposes only non-sensitive readiness state.
- Stock changes and the matching inbound-email record are committed in one database transaction.

## Local setup and personal email test

Requirements: Node.js 22+, npm, and a mailbox with SMTP and IMAP access. Gmail requires 2-Step
Verification plus an app password; use a dedicated mailbox where possible.

```bash
cp .env.example .env
npm ci
npm run db:deploy
npm run db:seed
npm run dev
```

Fill the test and mailbox values in `.env`, but keep:

```dotenv
EMAIL_DELIVERY_MODE="test"
EMAIL_LIVE_SEND_ENABLED="false"
EMAIL_TEST_RECIPIENT="your-email@example.com"
```

Open `http://localhost:3000`, go to **Email Log**, and select **Send Test Emails**. The log shows both
the actual test recipient and the hotel address that would receive the message in live mode. Reply with
one of these controlled phrases, then use **Incoming Emails → Check Inbox**:

```text
We placed a sample in room 777.
The guest used the sample in room 777.
Room 777 bought the perfume.
Room 777 checked out without buying.
```

## Switching to client recipients

First replace every placeholder hotel contact with a verified client address. Then change exactly these
two values and restart the app:

```dotenv
EMAIL_DELIVERY_MODE="live"
EMAIL_LIVE_SEND_ENABLED="true"
```

Live mode sends to each hotel's `contactEmail`; `EMAIL_TEST_RECIPIENT` is ignored. Manual live runs
respect the configured frequency and cannot force a resend.

If the sender mailbox must also move from your account to the client's account, additionally replace
`EMAIL_FROM_ADDRESS`, `SMTP_USER`, `SMTP_PASSWORD`, `IMAP_USER`, and `IMAP_PASSWORD` with the
client-owned mailbox configuration. Do not reuse your app password.

## Scheduled automation

Call these endpoints from the hosting platform scheduler using `Authorization: Bearer <CRON_SECRET>`:

- `POST /api/cron/outbound` — every hour; sends only messages that are due.
- `POST /api/cron/inbound` — every 5–15 minutes; processes up to 50 unread messages.

Manual runs remain available in the UI. The endpoints reject missing or short cron secrets.

## Deployment

The included `Dockerfile` and `compose.yaml` run migrations before startup and persist SQLite at
`/data/hoc.db`:

```bash
docker compose up --build -d
```

This SQLite profile is production-suitable for this low-volume internal CRM only when exactly one app
instance uses a persistent disk. Put it behind HTTPS, back up the `/data` volume daily, monitor
`/api/health`, and never deploy multiple writers against the same SQLite file. Migrate Prisma to managed
PostgreSQL before horizontal scaling or multi-tenant use.

### Railway

The repository also includes `railway.json`. Create one service from this GitHub repository, attach a
volume at `/data`, set `DATABASE_URL=file:/data/hoc.db`, add the remaining values from `.env.example`,
and generate a public domain. The container applies migrations and seeds default templates during
startup, after the persistent volume is mounted. Keep the service at one replica while using SQLite.

## Verification

```bash
npm run typecheck
npm test
npm run build
```

Do not commit `.env`, mailbox passwords, database files, or backup archives.
