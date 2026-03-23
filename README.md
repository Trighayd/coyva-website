# Coyva — Personal Budget App (Starter)

Next.js 14 + Basiq CDR integration. Australian Consumer Data Right bank feeds, auto-categorisation, and a budget dashboard.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Full-stack, great DX, easy deployment |
| CDR / Open Banking | Basiq API | Handles CDR accreditation + bank connections |
| Database | PostgreSQL + Prisma | Type-safe ORM, easy migrations |
| Auth | NextAuth.js | Session management, easy to extend with OAuth |
| Hosting | Vercel (frontend) + Supabase (DB) | Both have generous free tiers |

---

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a Supabase project)
- A Basiq account (free sandbox at [app.basiq.io](https://app.basiq.io))

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd coyva-starter
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
BASIQ_API_KEY=          # From Basiq dashboard → API Keys
NEXTAUTH_SECRET=        # Run: openssl rand -base64 32
DATABASE_URL=           # Your Postgres connection string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up the database

```bash
# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to inspect data
npx prisma studio
```

### 4. Get a Basiq sandbox API key

1. Sign up at [app.basiq.io](https://app.basiq.io) — free sandbox account
2. Go to **Applications → Create application**
3. Copy the API key into `.env.local`
4. In Basiq's sandbox, you get test institutions with pre-filled transaction data

### 5. Run the dev server

```bash
npm run dev
# → http://localhost:3000
```

---

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth session
│   │   ├── basiq/
│   │   │   ├── connect/          # POST → initiate CDR consent
│   │   │   └── callback/         # GET ← bank redirects here after consent
│   │   └── transactions/
│   │       ├── route.ts          # GET transactions for dashboard
│   │       └── sync/route.ts     # POST → manual sync from bank
│   ├── connect/page.tsx          # Bank connection UI
│   └── dashboard/page.tsx        # Budget dashboard
├── lib/
│   ├── basiq.ts                  # Basiq API client (CDR layer)
│   ├── categorise.ts             # Transaction categorisation
│   └── prisma.ts                 # Prisma singleton
└── components/                   # Shared UI components
prisma/
└── schema.prisma                 # DB schema
```

---

## CDR / Basiq flow

```
User taps "Connect bank"
    ↓
POST /api/basiq/connect
    → createBasiqUser (if first time)
    → getConsentUrl
    ↓
Redirect to bank's CDR consent screen (Basiq-hosted)
    ↓
User authenticates with bank + grants consent
    ↓
GET /api/basiq/callback?userId=...&jobId=...
    → Save BankConnection to DB
    → Background: fetch 3 months of transactions
    → Categorise each transaction
    ↓
Redirect to /dashboard
```

---

## CDR compliance checklist

- [x] Consent tracked with `consentGranted` and `consentExpires` (12-month max)
- [x] Consent checked on every sync — expired consent blocked
- [x] `consentActive` flag — set to false on revocation
- [ ] **TODO**: Revocation webhook handler (Basiq calls your endpoint when user revokes at bank)
- [ ] **TODO**: Data deletion on revocation (Privacy Safeguard 12 — 2 business days)
- [ ] **TODO**: Consent renewal prompt UI (show 30 days before expiry)

---

## Moving to production

### CDR accreditation

For a public-facing app you need to be a CDR Accredited Data Recipient (ADR).
**Fastest path**: Sponsored ADR via Basiq or Frollo — they hold the accreditation,
you sign an agreement and integrate via their API (what this code already does).

Timeline: ~2–4 weeks for sponsored ADR onboarding.

### Infrastructure

- **Database**: Supabase (Postgres + row-level security) or AWS RDS
- **Hosting**: Vercel (auto-deploys from GitHub, handles Next.js perfectly)
- **Background jobs**: Upstash QStash or AWS SQS for transaction sync queue
- **Cron**: Vercel Cron or AWS EventBridge — daily sync at 6am AEST

### Security additions

- Enable Postgres SSL (`ssl: { rejectUnauthorized: true }`)
- Add rate limiting to API routes (e.g. `@upstash/ratelimit`)
- Store Basiq user IDs encrypted in DB (not strictly required but good practice)
- Add CSP headers in `next.config.mjs`

---

## Extending the app

| Feature | Approach |
|---|---|
| Budget alerts | Cron job checks category spend vs budget → push notification (Expo Notifications or web push) |
| Mobile app | React Native with Expo — reuse all API routes and categorisation logic |
| AI insights | Send monthly summary to Claude API → generate personalised insights |
| Export to CSV | Server-side CSV generation from `/api/transactions` |
| Multiple accounts | Already supported — `accountIds` is an array in `BankConnection` |
| Investment tracking | CDR roadmap includes investment data — will be available via same Basiq API |
