# STORO PLATFORM — Master Build Plan
**Version:** 1.0 | **Date:** 2026-04-06  
**Repos:** storo.id (client portal) · storoengine (webstore template) · sharelink.id (referral API)

---

## 1. EXECUTIVE SUMMARY

Storo is a **managed webstore service** (agency model). VenteraAI does all technical work — clients pay setup fee + monthly + 5% per transaction. This document covers everything that needs to be built, in what order, across all repos.

**Three repos, one platform:**
```
storo.id (this repo)
  └── Marketing landing page          ✅ Done
  └── Client portal + dashboard       ❌ Build
  └── Onboarding wizard               ❌ Build
  └── Superadmin dashboard            ❌ Build
  └── Referral system (via API)       ❌ Integrate

storoengine (adewap23/storoengine)
  └── Storefront (products, cart, checkout)  ✅ Implemented
  └── Admin dashboard                         ✅ Implemented
  └── Payment (Xendit + Midtrans)            ✅ Implemented
  └── Shipping (Biteship 11+ couriers)       ✅ Implemented
  └── Shopee import (6 Excel files)          ✅ Implemented
  └── Blog CMS + API automation              ✅ Implemented
  └── Payment/shipping config wiring        ⏳ Incomplete
  └── Template versioning system            ❌ Build

sharelink.id (PTVENTERA-AI/sharelink.id)
  └── Referral API: api.reflink.id/v1       ✅ Running
  └── Storo campaign setup                  ❌ Configure
```

---

## 2. CROSS-REPO PRD SYNC

### 2.1 Source of Truth

| Topic | Primary PRD | Secondary Reference |
|-------|-------------|---------------------|
| Client portal pages | `storo-platform-PRD.md` §4 | This document |
| Storoengine tech stack | `storo-engine-PRD-v2.md` §4 | `PRD/storo-engine-PRD.md` in storoengine repo |
| Database schema | `storo-engine-PRD-v2.md` §5 | `storo-platform-PRD.md` §5 |
| Payment flow | `storo-engine-PRD-v2.md` §6 | — |
| Shipping | `storo-engine-PRD-v2.md` §7 (Biteship) | — |
| Domain management | `storo-platform-PRD.md` §6 | — |
| Referral system | This document §4 | sharelink.id API docs |

### 2.2 Key Decisions (Synced from Both PRDs)

| Decision | Outcome |
|----------|---------|
| **Agency model** | VenteraAI does ALL setup. Clients cannot self-build. |
| **Product import** | Engineer only. NO product upload in client dashboard. |
| **Payment** | Xendit (primary) + Midtrans. Centralized under VenteraAI account. Disbursement manual. |
| **Shipping** | Biteship. 1 API key (VenteraAI). Origin address per-store. |
| **Auth (storo.id)** | Supabase Auth (default) with Clerk as optional swap via `AUTH_PROVIDER` env var. |
| **Auth (storoengine)** | Clerk (already implemented). No change. |
| **Database** | Single shared Supabase instance. Multi-tenant via `store_id`. RLS enforces isolation. |
| **Hosting** | Vercel per client. ENV: same Supabase URL, unique `STORE_ID`. |
| **Domain** | Free: namatoko.storo.id. Paid: buy via Namecheap API. Custom: manual DNS. |
| **Referral** | Via sharelink.id API (api.reflink.id/v1). Campaign: "storo-referral-2026". |

---

## 3. FINAL DECISIONS (Confirmed)

| # | Topic | Decision |
|---|-------|---------|
| 1 | **Auth** | Supabase Auth only (not Clerk). Single source of truth. |
| 2 | **Namecheap** | Mock API first → real keys provided by owner later. Base XML API at `https://api.namecheap.com/xml.response`. Build adapter so swap is one file change. |
| 3 | **storoengine source of truth** | `PTVENTERA-AI/storoengine` (private org, latest). `adewap23/storoengine` is public mirror. Sync needed later. |
| 4 | **Client notifications** | Only ONE trigger: when `onboarding_requests.status = 'live'`. No other status notifications. |
| 5 | **Client can add products** | Yes — simple product form in client dashboard. NOT Shopee bulk import. Client enters: name, price, image upload, stock, description. Synced to their storoengine store via Supabase (shared DB, same `store_id`). |
| 6 | **Disbursement cycle** | Client chooses: Weekly / Monthly / Manual (admin-initiated). KYC at Xendit required before any automated disbursement. Until KYC is approved: manual only (admin transfers + marks as paid). |
| 7 | **Payment for disbursement** | Manual payment system. Admin creates disbursement record, marks as paid after bank transfer. Future: auto-disburse after Xendit KYC approval per client. |

---

## 3b. WHAT'S ANSWERED: Key Questions

### Shipping & Payment?
**Already implemented in storoengine.** No new integration needed.
- Biteship: 11+ couriers, real-time rates, waybill tracking → `/api/shipping/rates`
- Xendit: checkout → `/api/checkout`, webhook → `/api/webhooks/xendit`
- Midtrans: checkout → `/api/checkout`, webhook → `/api/webhooks/midtrans`

**What's still needed:**
- Wire payment config UI → `stores.payment_config` JSONB in DB
- Wire shipping origin UI → `stores.shipping_origin` JSONB in DB
- Read-only disbursement view in storoengine admin

### No Shopee Bulk Import for Clients?
**Confirmed.** Shopee 6-file import is engineer-only (storoengine `/dashboard/import`). However, clients **can add individual products** from their storo.id dashboard — simple product form (name, price, image, stock, description). This writes directly to shared Supabase with their `store_id`. No import/export needed.

### Auth Flexibility (Supabase + Clerk)?
**Auth abstraction layer** in `src/lib/auth/`:
```typescript
// Swap via AUTH_PROVIDER=supabase|clerk in .env
export { getUser, requireAuth, signOut } from './auth'
```
Supabase Auth is default (natural fit: same DB, RLS works natively, no extra service).

### Multi-Store Template Updates?
**Git tag versioning strategy:**
```
storoengine tags: v1.0.0 → v1.0.1 (patch) → v1.1.0 (feature) → v2.0.0 (breaking)
Per-client repo: .storo-version file = "1.0.0"
Update script: git pull template v1.0.1 --no-ff (skips .env, public/)
Superadmin: shows which stores are behind + one-click update
```

### Superadmin Dashboard?
**New route group `/superadmin`** in storo.id. VenteraAI team-only (role-based).
Controls: onboarding queue, store provisioning, billing, disbursements, pricing, templates, platform settings.

---

## 4. REFERRAL SYSTEM (via sharelink.id)

### 4.1 Overview

Integrate sharelink.id (`api.reflink.id/v1`) to power a simple referral program for Storo.id clients.

**Mechanics:**
- Each registered client gets a unique referral code
- Share link: `storo.id/r/{CODE}` → landing page with special CTA
- When referee signs up & completes onboarding → referrer gets reward
- Reward type: **Rp 200.000 discount on next monthly fee** (or cash credit)

### 4.2 API Integration Points

**Base URL:** `https://api.reflink.id/v1`  
**Auth:** `Authorization: Bearer sk_live_{SHARELINK_SECRET_KEY}`

| When | API Call | Purpose |
|------|----------|---------|
| Client signs up | `POST /referrals` with `referrerId = userId` | Generate their referral link |
| Referee lands on `/r/{CODE}` | `GET /referrals/validate/{CODE}` | Check if code is valid, show campaign reward |
| Referee completes sign-up | `POST /events` `{ type: 'signup', referralCode, referredUserId }` | Trigger signup event |
| Referee completes onboarding | `POST /events` `{ type: 'purchase', referralCode, metadata: { plan, setupFee } }` | Trigger conversion event |
| Client views dashboard | `GET /referrals?referrerId={userId}` | Show their referral stats |
| Superadmin approves reward | `PATCH /rewards/{id}/approve` then `/distribute` | Process discount/credit |

### 4.3 Campaign Setup (One-time)

Configure once in sharelink.id dashboard:
```
Campaign: "Storo Referral Program 2026"
Campaign ID: "camp_storo_2026"
Trigger event: "purchase" (after onboarding complete)
Reward for referrer: Rp 200.000 credit (type: credit)
Reward for referred: 10% discount on setup fee (type: discount)
Auto-approve: false (manual review by superadmin)
```

### 4.4 Env Vars (add to .env.local)
```
SHARELINK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_SHARELINK_PUBLISHABLE_KEY=pk_live_...
SHARELINK_CAMPAIGN_ID=camp_storo_2026
```

### 4.5 New UI Components

**Client dashboard — Referral tab** (add to `/dashboard`):
```
src/components/dashboard/client/ReferralCard.tsx
  - My referral code: [STORO-XXXXXX] [Copy]
  - My referral link: storo.id/r/XXXXXX [Copy] [Share WA]
  - Stats: X clicks | Y sign-ups | Z conversions
  - Pending rewards: Rp 200.000 (status: waiting approval)
  - Reward history table
```

**Landing page referral redirect:**
```
src/app/r/[code]/page.tsx
  - Validate code via GET /referrals/validate/{code}
  - If valid: show special landing with referrer's name + reward offer
  - Store code in sessionStorage → pre-fill at sign-up
  - If invalid: redirect to /sign-up normally
```

**Superadmin — Referral Management:**
```
/superadmin/referrals/page.tsx
  - List all active referral campaigns
  - Pending rewards to approve/distribute
  - Top referrers leaderboard
  - Fraud flag review
```

### 4.6 Sign-up Flow with Referral

```
User visits storo.id/r/JOHN50
  → validate code → show personalized CTA
  → sessionStorage: { referralCode: "JOHN50" }
  → User clicks "Daftar Sekarang"

User registers at /sign-up
  → After successful auth, call: POST /events { type: 'signup', referralCode: 'JOHN50', referredUserId }
  → Create client record with referral_code: "JOHN50" in clients table

User completes onboarding (Step 7 submit)
  → Call: POST /events { type: 'purchase', referralCode: 'JOHN50', metadata: { plan: 'starter', setupFee: 1500000 } }
  → Reward created for referrer (pending review)

Superadmin approves + distributes reward
  → Referrer gets Rp 200.000 credit applied to next invoice
```

---

## 5. COMPLETE BUILD PLAN

### REPO 1: storo.id

#### Sprint 1 — Foundation

| Task | Files |
|------|-------|
| Auth abstraction layer | `src/lib/auth/index.ts`, `supabase.ts`, `clerk.ts` |
| Supabase server client | `src/lib/supabase/server.ts`, update `client.ts` |
| Middleware (protect routes) | `src/middleware.ts` |
| Sign-in page | `src/app/(auth)/sign-in/page.tsx` |
| Sign-up page (with referral code capture) | `src/app/(auth)/sign-up/page.tsx` |
| Referral landing redirect | `src/app/r/[code]/page.tsx` |
| Footer component | `src/components/Footer.tsx` |

**Design:** Auth pages — centered white card, storo-logo.png, brand blue form, gradient background blobs.

#### Sprint 2 — Onboarding Wizard

| Step | Component | Notes |
|------|-----------|-------|
| Container | `OnboardingWizard.tsx` | Progress bar, step routing, sessionStorage state |
| Step 1 | `Step1Profile.tsx` | Nama, WA, Shopee store name, alamat |
| Step 2 | `Step2Identity.tsx` | KTP upload (Supabase Storage), bank details |
| Step 3 | `Step3Plan.tsx` | Plan cards: Starter/Pro/Advance/Flexible/Custom |
| Step 4 | `Step4Template.tsx` | Template grid from `templates` table |
| Step 5 | `Step5Domain.tsx` | 3 tabs: subdomain / Namecheap search / own domain |
| Step 6 | `Step6Status.tsx` | **NOT upload.** Info screen: "Tim kami akan setup toko Anda" |
| Step 7 | `Step7Review.tsx` | Summary + total cost + T&C + submit |

API routes needed:
- `GET /api/slugs/check?slug=xxx` — check subdomain availability
- `POST /api/domains/search` — Namecheap domain search
- `POST /api/onboarding/submit` — save onboarding request

#### Sprint 3 — Client Dashboard

| Route | Component | What it shows |
|-------|-----------|---------------|
| `/dashboard` | `DashboardOverview.tsx` | Onboarding status, notifications, quick stats |
| `/dashboard/stores` | `StoresList.tsx` | Store cards (name, domain, status badge, plan) |
| `/dashboard/stores/[id]` | `StoreDetail.tsx` | Timeline, engineer notes, live link |
| `/dashboard/domains` | `DomainsList.tsx` | Domain cards: expiry, DNS status, auto-renew |
| `/dashboard/domains/search` | `DomainSearch.tsx` | Namecheap search + results table + cart |
| `/dashboard/billing` | `BillingPage.tsx` | Active plan, invoice history, disbursements (read-only) |
| `/dashboard/profile` | `ProfilePage.tsx` | Edit nama/WA, bank rekening, KTP |
| `/dashboard/help` | `HelpPage.tsx` | Export Shopee guide, FAQ, WA contact |
| `/dashboard/products` | `ProductsList.tsx` | Client's products (read from shared Supabase by store_id) |
| `/dashboard/products/new` | `AddProductForm.tsx` | Simple form: name, price, image upload, stock, description |
| `/dashboard/products/[id]` | `EditProductForm.tsx` | Edit individual product |
| `/dashboard` (referral tab) | `ReferralCard.tsx` | Referral code, link, stats, reward history |

**Store status badges:**
🟡 pending · 🔵 reviewing · 🟠 in_progress · 🟢 live · 🔴 rejected

#### Sprint 4 — Superadmin Dashboard

**Route group:** `/superadmin/*` — `superadmin_users` table, role check.

| Route | Purpose |
|-------|---------|
| `/superadmin` | KPI overview: revenue, active stores, pending requests |
| `/superadmin/onboarding` | **Primary workflow:** request queue, assign engineer, update status |
| `/superadmin/stores` | All stores: client, plan, status, engine version |
| `/superadmin/stores/[id]` | Store detail + edit status + notes |
| `/superadmin/users` | All clients: name, email, WA, plan, store count |
| `/superadmin/users/[id]` | Client detail + history |
| `/superadmin/billing` | All invoices, overdue flag |
| `/superadmin/disbursements` | Create + manage disbursements (all stores) |
| `/superadmin/disbursements/new` | Select store + period → auto-calc (gross/PG fee/ops fee/net) → mark paid |
| `/superadmin/disbursements/[id]` | Detail: payment reference, receipt, client bank info |
| `/superadmin/kyc` | KYC status per client (Xendit KYC approved = auto disburse enabled) |
| `/superadmin/pricing` | Edit plan prices (stored in DB) |
| `/superadmin/templates` | Manage template gallery |
| `/superadmin/referrals` | Approve/distribute referral rewards |
| `/superadmin/settings` | Platform settings (fees, WA number, etc.) |

**Superadmin sidebar icons:** All from Lucide. No emojis.

#### Sprint 5 — Public Pages & Polish

| Task | File |
|------|------|
| `/pricing` — full comparison table | `src/app/pricing/page.tsx` |
| `/templates` — gallery from DB | `src/app/templates/page.tsx` |
| Add Footer to layout | Update `src/app/layout.tsx` |

#### Sprint 6 — API Routes (storo.id)

| Route | Purpose |
|-------|---------|
| `GET /api/auth/callback` | Supabase OAuth callback |
| `GET /api/slugs/check` | Subdomain availability check |
| `POST /api/domains/search` | Namecheap domain search |
| `POST /api/domains/purchase` | Purchase domain |
| `POST /api/domains/configure-dns` | Auto DNS + Vercel config |
| `POST /api/onboarding/submit` | Save onboarding to DB |
| `POST /api/referral/event` | Proxy to sharelink.id events API (server-side) |
| `GET /api/superadmin/stores` | Admin store list |
| `PATCH /api/superadmin/stores/[id]` | Update store status |
| `GET /api/superadmin/disbursements` | List disbursements |
| `POST /api/superadmin/disbursements` | Create disbursement |

---

### REPO 2: storoengine

#### Sprint 7 — Complete Wiring

| Task | File |
|------|------|
| Wire payment config → DB | `settings/payment/page.tsx` + API update |
| Wire shipping origin → DB | `settings/shipping/page.tsx` + API update |
| Connect store homepage to Supabase | `(store)/store/page.tsx` |
| Connect stats cards to real data | `components/dashboard/stats-cards.tsx` |
| Connect recent orders | `components/dashboard/recent-orders.tsx` |
| Disbursement read-only view | New: `dashboard/disbursements/page.tsx` |

#### Sprint 8 — Template Versioning

| Task | File |
|------|------|
| Tag v1.0.0 | `git tag v1.0.0` |
| Version file | `.storo-version` (add to .gitignore of per-client repos) |
| Update script | `scripts/check-version.sh`, `scripts/apply-update.sh` |
| Exclude from updates | `.env.local`, `public/logo*`, `public/favicon*` |

---

## 6. DATABASE ADDITIONS (storo.id needs these)

All added to shared Supabase instance.

### New tables (from storo-platform-PRD.md §5.2):
- `clients` — client profiles (linked to Supabase Auth user_id)
- `onboarding_requests` — request queue with status tracking
- `client_notifications` — notification feed
- `invoices` — billing records
- `templates` — template gallery (engineer-managed)
- `reserved_slugs` — subdomain lock
- `domain_orders` — Namecheap purchases
- `domain_search_cache` — 15-minute cache

### New table for superadmin:
```sql
superadmin_users (
  id UUID PK DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,   -- Supabase Auth user_id
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'engineer',   -- 'engineer' | 'admin' | 'superadmin'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

### Add disbursement preference to `clients`:
```sql
ALTER TABLE clients ADD COLUMN disbursement_cycle TEXT DEFAULT 'manual';  -- 'weekly' | 'monthly' | 'manual'
ALTER TABLE clients ADD COLUMN kyc_status TEXT DEFAULT 'pending';          -- 'pending' | 'submitted' | 'approved' | 'rejected'
ALTER TABLE clients ADD COLUMN kyc_submitted_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN kyc_approved_at TIMESTAMPTZ;
```

### Add referral fields to `clients`:
```sql
ALTER TABLE clients ADD COLUMN referral_code TEXT;    -- code that referred this client
ALTER TABLE clients ADD COLUMN referral_ref_id TEXT;  -- sharelink referral ID
```

---

## 7. ENV VARS (storo.id)

```env
# Auth
AUTH_PROVIDER=supabase                         # or 'clerk'
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Clerk (optional, used when AUTH_PROVIDER=clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# Domain management
NAMECHEAP_API_USER=venteraai
NAMECHEAP_API_KEY=...
NAMECHEAP_CLIENT_IP=...
NAMECHEAP_USE_SANDBOX=true

# Referral system
SHARELINK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_SHARELINK_PUBLISHABLE_KEY=pk_live_...
SHARELINK_CAMPAIGN_ID=camp_storo_2026
```

---

## 8. DESIGN SYSTEM PER AREA

| Area | Primary | Accent | Font | Style |
|------|---------|--------|------|-------|
| storo.id landing | #4169df | #f3973b | Inter | Social Proof, Conversion |
| storo.id client dashboard | #4169df | #f3973b | Inter | Clean SaaS panel |
| storo.id superadmin | slate-900 | #4169df | Inter | Data-Dense, Operational |
| storoengine storefront | Deep Indigo (oklch) | Emerald (oklch) | DM Sans | Flat E-commerce |
| storoengine admin | Deep Indigo (oklch) | Emerald (oklch) | DM Sans | Admin Dashboard |

**Universal rules:**
- Icons: Lucide React only. No emojis.
- All clickable elements: `cursor-pointer`
- Transitions: `150-300ms ease-out`
- Text contrast: minimum 4.5:1 (WCAG AA)
- Responsive breakpoints: 375 / 768 / 1024 / 1440

---

## 9. NAMECHEAP API (Mock Strategy)

**PRD spec:** `https://api.namecheap.com/xml.response` (XML-based REST API).

**Mock implementation:**
```
src/lib/domains/namecheap.ts    ← adapter (real or mock based on env)
src/lib/domains/mock.ts         ← returns hardcoded available/unavailable + prices
```

```typescript
// Toggle via env
const USE_MOCK = process.env.NAMECHEAP_USE_SANDBOX === 'mock'

// Mock response for domain search
export function mockSearchDomains(query: string) {
  return [
    { domain: `${query}.com`,    available: true,  price: 185000 },
    { domain: `${query}.co.id`,  available: true,  price: 250000 },
    { domain: `${query}.id`,     available: false, price: null },
    { domain: `${query}.store`,  available: true,  price: 95000 },
    { domain: `${query}.shop`,   available: true,  price: 55000 },
  ]
}
```

When real API key is provided → swap `NAMECHEAP_USE_SANDBOX=false`, same adapter calls real XML API.

## 10. STOROENGINE SYNC NOTE

- **`PTVENTERA-AI/storoengine`** = private org repo = latest production version
- **`adewap23/storoengine`** = public mirror = older scaffold
- Access to PTVENTERA-AI/storoengine requires SSH key for org. To sync: `git remote add ptventera git@github.com:PTVENTERA-AI/storoengine.git`
- Until synced: reference `adewap23/storoengine` for public API structure. Note any changes needed.

## 11. OPEN QUESTIONS

1. ~~Superadmin auth~~ → Supabase Auth + `superadmin_users` role column ✅ Confirmed
2. ~~Namecheap~~ → Mock first, owner provides real key later ✅ Confirmed
3. ~~storoengine prod repo~~ → PTVENTERA-AI/storoengine (private) ✅ Confirmed
4. ~~Disbursement cycle~~ → Weekly / Monthly / Manual (KYC gates auto) ✅ Confirmed
5. **Referral reward type:** Rp 200.000 discount on monthly fee, or store credit? *(needs confirmation)*
6. **sharelink.id campaign:** Already created in dashboard with campaign ID? *(needs confirmation)*
7. **Client product feature:** Can client delete their own products, or only add/edit? *(needs confirmation)*

---

## 10. BUILD SEQUENCE (Recommended Order)

```
Week 1:  Sprint 1 — Auth + foundation + referral landing (/r/[code])
Week 2:  Sprint 2 — Onboarding wizard (Steps 1-7)
Week 3:  Sprint 3 — Client dashboard (all 8 routes + referral card)
Week 4:  Sprint 4 — Superadmin dashboard (all 13 routes)
Week 5:  Sprint 5 + 6 — Public pages + all API routes
Week 6:  Sprint 7 — storoengine wiring (payment/shipping/data)
Week 7:  Sprint 8 — Template versioning + superadmin version tracker
```
