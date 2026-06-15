# Onboardly — Deploy Guide
## From zero to live URL in ~15 minutes

---

## STEP 1: Stripe Setup (5 min)

### 1a. Create Products

Go to: https://dashboard.stripe.com/products/create

**Product 1 — Starter**
- Name: `Onboardly Starter`
- Pricing: Recurring · $19.00 · Monthly
- Click "Save product"
- Copy the **Price ID** → looks like `price_1ABC...`
- Save as: `STRIPE_STARTER_PRICE_ID`

**Product 2 — Pro**
- Name: `Onboardly Pro`
- Pricing: Recurring · $49.00 · Monthly
- Click "Save product"
- Copy the **Price ID** → looks like `price_1XYZ...`
- Save as: `STRIPE_PRO_PRICE_ID`

### 1b. Get API Keys

Go to: https://dashboard.stripe.com/apikeys

- Copy **Secret key** (starts with `sk_test_...`)
- Save as: `STRIPE_SECRET_KEY`

### 1c. Set Up Webhook (after deploy — come back to this)

Go to: https://dashboard.stripe.com/webhooks/create

- Endpoint URL: `https://YOUR-RAILWAY-URL/v1/webhooks/stripe`
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- Click "Add endpoint"
- Copy **Signing secret** (starts with `whsec_...`)
- Save as: `STRIPE_WEBHOOK_SECRET`

---

## STEP 2: Resend Email Setup (2 min)

Go to: https://resend.com/api-keys

- Create API key → copy it
- Save as: `RESEND_API_KEY`
- Save your sending email as: `EMAIL_FROM=onboarding@yourdomain.com`
  (or use `onboarding@resend.dev` for testing)

---

## STEP 3: Deploy to Railway (8 min)

### 3a. Push to GitHub first

```bash
cd deliverables/onboardly

# Initialize git
git init
git add .
git commit -m "Initial commit — Onboardly v1.0"

# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/onboardly.git
git push -u origin main
```

### 3b. Deploy on Railway

1. Go to: https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select your `onboardly` repo
4. Railway auto-detects the monorepo

**Add PostgreSQL:**
- Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
- Railway auto-sets `DATABASE_URL` ✓

**Set environment variables** (click your service → Variables tab):

```
JWT_SECRET=<generate: openssl rand -hex 32>
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
RESEND_API_KEY=re_...
EMAIL_FROM=onboarding@yourdomain.com
FRONTEND_URL=https://YOUR-WEB-SERVICE.railway.app
NEXT_PUBLIC_API_URL=https://YOUR-API-SERVICE.railway.app/v1
NODE_ENV=production
```

### 3c. Run Database Migration

In Railway dashboard → your API service → **Shell** tab:

```bash
psql $DATABASE_URL -f db/schema.sql
```

Or via Railway CLI:
```bash
npm install -g @railway/cli
railway login
railway run psql $DATABASE_URL -f apps/api/db/schema.sql
```

### 3d. Get Your Live URLs

After deploy completes (~3 min):
- API: `https://api-production-xxxx.railway.app`
- Web: `https://web-production-xxxx.railway.app`

Update `FRONTEND_URL` and `NEXT_PUBLIC_API_URL` with these values, then redeploy.

---

## STEP 4: Go Live Checklist

- [ ] Visit your live URL — landing page loads
- [ ] Register a test account
- [ ] Add a test client
- [ ] Start an onboarding run
- [ ] Test Stripe checkout with card `4242 4242 4242 4242`
- [ ] Verify webhook fires in Stripe dashboard
- [ ] Check plan upgrades to "starter" after payment

---

## STEP 5: Launch

Once live, post these in order:

**Reddit r/freelance:**
```
I built a free tool to automate client onboarding — intake forms, contracts, 
welcome emails all in one workflow. Would love feedback from freelancers.
[link]
```

**Product Hunt:**
- Submit at: https://www.producthunt.com/posts/new
- Tagline: "Client onboarding automation for freelancers"
- Best day to launch: Tuesday–Thursday

**Twitter/X:**
```
Just launched Onboardly — automate your client onboarding in 10 minutes.

Stop copy-pasting welcome emails and chasing contract signatures.

✅ Intake forms
✅ Document tracking  
✅ Automated email sequences
✅ $19/mo

[link] 🧵
```

---

## Revenue Milestones

| Milestone | Customers needed |
|---|---|
| Cover hosting ($10/mo) | 1 Starter |
| $100 MRR | 6 Starter or 3 Pro |
| $500 MRR | 27 Starter or 11 Pro |
| $1K MRR | 53 Starter or 21 Pro |
| $5K MRR | 263 Starter or 102 Pro |

**First goal: 3 paying customers = $57/mo = profitable.**
