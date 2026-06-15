# Onboardly — Client Onboarding Automation

> Automate your client onboarding. Send contracts, collect intake forms, and track progress — all in one place.
> **Score: 86/100 Gold tier** | Target: Freelancers | Pricing: $19–$49/mo

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, React, Tailwind CSS, React Query, Zustand |
| Backend | Express.js, TypeScript, Zod validation |
| Database | PostgreSQL |
| Payments | Stripe (subscriptions, webhooks, customer portal) |
| Email | Resend (welcome, document requests, reminders) |
| Deploy | Railway (one-click) |

---

## Project Structure

```
onboardly/
├── apps/
│   ├── api/          # Express backend
│   │   └── src/
│   │       ├── routes/       # auth, clients, workflows, runs, documents, billing, dashboard
│   │       ├── middleware/   # authenticate, errorHandler
│   │       ├── services/     # email
│   │       └── db/           # pool.ts
│   └── web/          # Next.js frontend
│       └── src/
│           ├── app/
│           │   ├── (auth)/   # login, register
│           │   ├── (app)/    # dashboard, clients, runs, billing
│           │   └── page.tsx  # landing page
│           ├── components/   # Sidebar, shared UI
│           └── lib/          # api.ts, store.ts
├── db/
│   └── schema.sql    # Full PostgreSQL schema
├── api/
│   └── openapi.yaml  # Full OpenAPI 3.0 spec
├── .env.example
└── railway.toml
```

---

## Local Development

### 1. Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Stripe account (for billing)
- Resend account (for emails)

### 2. Setup

```bash
# Clone and install
git clone <your-repo>
cd onboardly
npm install

# Configure environment
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, STRIPE_*, RESEND_API_KEY

# Create database
createdb onboardly
psql onboardly -f db/schema.sql

# Start dev servers (both API + web)
npm run dev
```

App runs at:
- Frontend: http://localhost:3000
- API: http://localhost:3001

### 3. Stripe Setup

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local API
stripe listen --forward-to localhost:3001/v1/webhooks/stripe

# Create products in Stripe dashboard:
# - Starter: $19/mo → copy price ID to STRIPE_STARTER_PRICE_ID
# - Pro: $49/mo → copy price ID to STRIPE_PRO_PRICE_ID
```

---

## Deploy to Production (Railway)

### Option A: Railway (Recommended — 5 minutes)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add PostgreSQL plugin
4. Set environment variables (copy from `.env.example`)
5. Deploy → get your live URL

### Option B: Vercel (Frontend) + Railway (API)

```bash
# Deploy API to Railway
railway up --service api

# Deploy frontend to Vercel
cd apps/web
vercel --prod
```

---

## Revenue Model

| Plan | Price | Limit | Target |
|---|---|---|---|
| Free trial | $0 | 14 days | Acquisition |
| Starter | $19/mo | 10 clients | Solo freelancers |
| Pro | $49/mo | Unlimited | Agencies |

**Break-even:** 3 Starter customers = $57/mo (covers hosting)
**$1K MRR:** 53 Starter or 21 Pro customers
**$5K MRR:** 263 Starter or 102 Pro customers

---

## Launch Checklist

- [ ] Deploy to Railway
- [ ] Set up Stripe products + webhook
- [ ] Configure Resend domain
- [ ] Post on Product Hunt
- [ ] Post in r/freelance, r/webdev
- [ ] Tweet launch thread
- [ ] Submit to AppSumo marketplace

---

## API Endpoints

See `api/openapi.yaml` for full spec.

| Method | Path | Description |
|---|---|---|
| POST | /v1/auth/register | Create account |
| POST | /v1/auth/login | Login |
| GET | /v1/clients | List clients |
| POST | /v1/clients | Add client |
| GET | /v1/workflows | List workflows |
| POST | /v1/runs | Start onboarding run |
| POST | /v1/runs/:id/advance | Advance to next step |
| POST | /v1/documents/:id/send | Send document to client |
| POST | /v1/billing/checkout | Create Stripe checkout |
| GET | /v1/dashboard/stats | Dashboard metrics |
