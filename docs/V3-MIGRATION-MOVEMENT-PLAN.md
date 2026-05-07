# V3 Migration — Movement Plan

> Companion to: `ARCHITECTURE-V3-MULTI-TENANT.md`
> Last updated: 2026-05-07
> Purpose: actionable sequencing of work, dependencies, risks

---

## Hidden Issues yang Ditemukan saat Audit (PRE-FLIGHT, harus di-fix dulu)

### Issue P-1: Disbursements table ghost migration ⚠️
- **Symptom:** `src/app/api/superadmin/disbursements/route.ts` insert ke tabel `disbursements`, UI render dari tabel ini, tapi **TIDAK ADA migration** `CREATE TABLE disbursements` di `supabase/migrations/`.
- **Risiko:** Tabel dibuat manual di prod (tidak track di git), atau ter-create dari migration `_remote.sql` yang ter-pull dari Supabase tanpa source-of-truth lokal.
- **Action:** Verify schema yg ada di prod, tulis migration formal `20260507000001_disbursements_table.sql` yang `CREATE TABLE IF NOT EXISTS` matches existing prod state.
- **Effort:** 1 jam.

### Issue P-2: Plan hardcoded mismatch antara wizard & lib/plans ⚠️
- **Symptom:** `Step3Plan.tsx` render plan options `starter/business/enterprise`. `lib/plans.ts` declare `starter/pro/advance/flexible/custom`. DB `onboarding_requests.plan` constraint accept semua 7 nilai (`starter/pro/advance/flexible/custom/business/enterprise`).
- **Risiko:** UI inconsistency, kemungkinan ada client yang ter-create dengan plan `business` atau `enterprise` (tidak ada di lib/plans), bisa break runtime.
- **Action:** Audit data existing (`SELECT plan, COUNT(*) FROM onboarding_requests GROUP BY plan`). Kalau ada `business`/`enterprise`, treat sebagai legacy → handle di Phase 1.
- **Effort:** 30 menit query + decide handling.

---

## Movement Plan — 5 Phase Sequenced

```
PRE-FLIGHT (1-2 hari)
  ├─ P-1: Disbursements table migration formal
  └─ P-2: Audit existing plan values + decide legacy handling
        ↓
PHASE 1: Schema Foundation (3-5 hari) ⚠️ BLOCKING
  ├─ Migration: tabel `plans` + seed
  ├─ Migration: extend `stores` (billing_model, template_variant, theme_config)
  ├─ Migration: legacy plan migration (kalau ada data starter/pro/etc → standard)
  ├─ Refactor lib/plans.ts → DB loader
  └─ Update PaymentSettingsForm: enum (storo_gateway / own_prepaid)
        ↓
        ├──────────────────────────┐
        ▼                          ▼
PHASE 2: Wallet System         PHASE 3: Storefront + Public API
(2-3 minggu)                   (3-4 minggu)
- Schema wallet tables         - Bootstrap storo-storefront repo
- Topup API + webhooks         - Middleware routing
- Ops fee deduct logic         - T1-classic foundation
- Dashboard wallet UI          - Public read API endpoints
- Reconciliation cron          - Wallet status integration
- Notif system                 - Wildcard domain setup
        │                          │
        └──────────┬───────────────┘
                   ▼
PHASE 4: Client Migration (per-client, ongoing)
  ├─ Convert nutiver clone → templates/custom-nutiver/
  ├─ Convert adewap clone → templates/custom-adewap/
  └─ DNS cutover client-by-client
        ↓
PHASE 5: Storoengine Archive (1 hari)
```

---

## PHASE 1: Schema Foundation

### Pre-conditions
- [ ] Pre-flight P-1 + P-2 selesai
- [ ] Backup Supabase DB (just in case)
- [ ] Coordinate dengan tim: jangan ada deploy lain saat Phase 1 jalan

### Tasks

#### 1.1 Tabel `plans` + seed (1 hari)
- File: `supabase/migrations/20260510000001_plans_table.sql`
- Schema lengkap di PRD Section 4.1
- Seed 2 row: `standard` + `custom`
- Plus seed 5 row legacy (`starter`, `pro`, `advance`, `flexible`, `business`, `enterprise`) dengan `is_active=false` untuk grandfather client lama

#### 1.2 Extend `stores` (1 hari)
- File: `supabase/migrations/20260510000002_stores_billing_template.sql`
- Add columns:
  ```sql
  ALTER TABLE stores
    ADD COLUMN billing_model TEXT NOT NULL DEFAULT 'storo_gateway'
      CHECK (billing_model IN ('storo_gateway', 'own_prepaid')),
    ADD COLUMN template_variant TEXT NOT NULL DEFAULT 'custom-pending',
    ADD COLUMN theme_config JSONB DEFAULT '{}';
  ```
- **Migrate data:** convert existing `stores.settings.payment.use_storo_gateway` → `stores.billing_model`:
  ```sql
  UPDATE stores SET billing_model =
    CASE WHEN settings->'payment'->>'use_storo_gateway' = 'false'
         THEN 'own_prepaid'  -- atau biarkan 'storo_gateway' karena belum ada wallet
         ELSE 'storo_gateway' END;
  ```
  - **DECISION POINT:** untuk client existing yang `use_storo_gateway=false`, mereka belum punya wallet. Saran: tetap set `storo_gateway` dulu, kasih notice ke mereka untuk migrate manual.

#### 1.3 Refactor `lib/plans.ts` (1 hari)
- Convert `PLANS` static array → DB loader function
- Add fallback ke hardcoded jika DB unreachable (dev safety)
- Update semua 9 file yang import — lokasi:
  - `src/app/api/onboarding/checkout/route.ts`
  - `src/app/pricing/page.tsx`
  - `src/components/onboarding/OnboardingWizard.tsx`
  - `src/components/onboarding/Step3Plan.tsx`
  - + 5 lainnya (lihat audit)
- Type compat: keep `PlanId` type union, add `'standard'` & `'custom'`

#### 1.4 Update PaymentSettingsForm (0.5 hari)
- Replace `useStoroGateway: boolean` → `billingModel: 'storo_gateway' | 'own_prepaid'`
- UI: 2 radio buttons (instead of 1 checkbox)
- Disable "own_prepaid" option dengan message "Coming soon" sampai Phase 2 ready
- API endpoint update: `PUT /api/store/[storeId]/settings/payment` accept `billing_model`

#### 1.5 Step3Plan.tsx update (0.5 hari)
- Replace hardcoded `starter/business/enterprise` → load dari DB (cuma `is_active=true`)
- UI: 2 cards (Standard + Custom)
- Custom card → "Hubungi Kami" button (form contact, bukan flow auto)

### Risks

| Risk | Mitigation |
|------|-----------|
| Existing client data corrupted saat migration | Run di staging dulu, backup full DB sebelum run |
| Frontend break karena lib/plans.ts type change | Update semua import sekaligus dalam 1 PR |
| Existing onboarding wizard pakai plan ID lama | Backward compat layer di getPlan() — fallback dari old ID ke new ID |

### Rollback strategy
- Migration di-design idempotent (`IF NOT EXISTS`)
- Jika perlu rollback: revert `ADD COLUMN` dengan `DROP COLUMN` + rollback git
- Plan data: keep legacy rows dengan `is_active=false`, easy un-deprecate

### Done definition
- [ ] Migrations passed di staging
- [ ] All `lib/plans.ts` consumers updated
- [ ] PaymentSettingsForm UI shows 2 billing models
- [ ] Step3Plan shows Standard + Custom only
- [ ] No regression di onboarding flow

---

## PHASE 2: Wallet System (parallel-able dengan Phase 3)

### Pre-conditions
- Phase 1 selesai (`stores.billing_model` column ada)
- Decision: Xendit recurring atau cuma one-time topup di MVP?
  - **Saran:** one-time topup dulu, recurring di Phase 2.5

### Tasks

#### 2.1 Schema (1 hari)
- File: `supabase/migrations/20260520000001_wallet_tables.sql`
- Schema lengkap di PRD Section 4.3:
  - `store_wallets`
  - `wallet_transactions`
- RLS policies:
  - Seller hanya bisa SELECT wallet sendiri
  - Service role untuk semua mutation
- Indexes: `idx_wallet_tx_store_created`, `idx_wallet_tx_ref_external` (unique)

#### 2.2 Topup API (3 hari)
- `POST /api/wallet/topup`
  - Body: `{ amount, payment_method: 'xendit' | 'midtrans' }`
  - Create invoice (`STORO-WALLET-{uuid}`)
  - Return Xendit/Midtrans payment URL
- Webhook handlers:
  - Extend existing `storo-payment-confirm` edge function untuk handle prefix `STORO-WALLET-*`
  - On payment success: `INSERT wallet_transactions (type='topup')` + `UPDATE store_wallets`
  - Idempotency via `ref_external` unique

#### 2.3 Ops Fee Deduction Logic (3 hari)
- New module: `src/lib/wallet/deduct-ops-fee.ts`
- Called dari order webhook (saat order paid via own gateway)
- Atomic transaction: SELECT FOR UPDATE → INSERT → UPDATE balance + status
- Trigger notif kalau status berubah ke `warning` atau `suspended`
- Unit tests: race condition simulation

#### 2.4 Dashboard Wallet UI (3 hari)
- New route: `/dashboard/[storeId]/wallet`
- Cards: balance, status badge, low_balance_threshold
- Topup form (preset amounts + custom)
- Transaction history table (paginated, filter by type)
- Nested di per-store admin sidebar

#### 2.5 Notification System (2 hari)
- Triggered saat status change (warning/suspended)
- Channels: email (existing), in-app banner, WhatsApp (kalau ada integration)
- Template per status: warning vs critical vs suspended
- Reuse `client_notifications` table

#### 2.6 Reconciliation Cron (1 hari)
- Supabase edge function or Vercel cron: nightly run
- Compare `store_wallets.balance` vs `SUM(wallet_transactions.amount × sign)`
- Alert superadmin via email + log ke `wallet_reconciliation_log` table
- Auto-fix: kalau status='suspended' tapi balance > warning_threshold → set 'active'

#### 2.7 Disable Phase 2 Features Saat Belum Ready
- `PaymentSettingsForm`: enable "own_prepaid" radio button
- Onboarding wizard: tambah Step "Pilih Billing Model" (di phase 1 disable, di phase 2 enable)

### Risks

| Risk | Mitigation |
|------|-----------|
| Race condition saat balance tipis | `SELECT FOR UPDATE` + integration test 100 concurrent orders |
| Webhook double-fire menyebabkan double deduct | `ref_external` unique constraint catches it |
| Reconciliation discrepancy | Daily alert + immutable ledger = always recoverable |
| Seller saldo habis pas pertama kali pakai = lost sales | Activation requirement Rp 500rb minimum |

### Done definition
- [ ] Topup flow end-to-end works (Xendit + Midtrans)
- [ ] Ops fee deduction tested under concurrency
- [ ] Auto-suspend storefront tested (manual reduce balance to 0)
- [ ] Reconciliation cron runs nightly + alerts work
- [ ] Dashboard UI shows balance + history

---

## PHASE 3: Storefront Repo + Public API (parallel-able dengan Phase 2)

### Pre-conditions
- Phase 1 selesai (`stores.template_variant` column ada)
- Decision: storo-storefront repo location & access
  - **Saran:** `PTVENTERA-AI/storo-storefront` (private org)

### Tasks

#### 3.1 Public Read API di storo-platform (5 hari)
- New folder: `src/app/api/public/store/[slug]/`
  - `products/route.ts` — list, filter, pagination
  - `products/[id]/route.ts` — single product
  - `banners/route.ts`
  - `promos/route.ts`
  - `categories/route.ts`
  - `blog/route.ts` + `blog/[slug]/route.ts`
- Edge cache headers: `s-maxage=60, stale-while-revalidate=300`
- Rate limit: per IP + per slug
- CORS: allow only `*.storo.id` + custom domains

#### 3.2 Bootstrap storo-storefront Repo (3 hari)
- Init Next.js 16 project
- Copy `.eslintrc`, `tsconfig`, `tailwind.config` dari storoengine
- Setup middleware.ts (domain → slug → store_id resolver)
- Folder structure: `templates/_shared/`, `templates/T1-classic/`, dll

#### 3.3 T1-Classic Foundation (5 hari)
- Port `storoengine/app/(store)/*` jadi `templates/T1-classic/`
- Pisahkan shared logic ke `_shared/` (cart, checkout, search, account)
- Pastikan semua data fetch via Public API (bukan direct Supabase)
- Visual layer (header, hero, product card) custom-able

#### 3.4 Template Variant Selector (2 hari)
- `app/[...slug]/page.tsx` — dynamic import based on `request.headers['x-template-variant']`
- Fallback ke T1-classic kalau variant tidak found
- Type safety: variant registry di `templates/registry.ts`

#### 3.5 Wallet Status Integration (1 hari)
- Middleware fetch wallet status untuk store dengan `billing_model='own_prepaid'`
- Kalau `status='suspended'` → render suspend page
- Cache wallet status 30 detik (stale-while-revalidate)

#### 3.6 Wildcard Domain Setup (2 hari)
- Vercel project `storo-storefront`: domain `*.storo.id`
- DNS: wildcard CNAME ke `cname.vercel-dns.com`
- Custom domain support: client tambah domain via dashboard, Vercel API verify DNS, auto-SSL
- Test: `nutiver.storo.id` resolves correctly

### Risks

| Risk | Mitigation |
|------|-----------|
| Single deploy down = semua client down | Vercel Rolling Releases, canary di 5% traffic dulu |
| Public API kena DDoS karena public + cacheable | Vercel BotID + rate limit + edge cache |
| T1-classic bug propagate ke semua client | Staging env per template variant + visual regression test |

### Done definition
- [ ] Public API tested untuk semua endpoints
- [ ] storo-storefront repo deployable ke Vercel
- [ ] T1-classic dapat render storefront dummy (test dengan dummy store di staging)
- [ ] Wildcard domain resolves
- [ ] Wallet status check integrated

---

## PHASE 4: Client Migration (per-client, ongoing)

### Strategy
**Migrate satu per satu**, bukan big bang. Target: 1-2 client per minggu setelah Phase 3 ready.

### Per-client checklist
1. [ ] Engineer Storo build `templates/custom-{slug}/` (extend T1)
2. [ ] Visual review + client approval
3. [ ] Set `stores.template_variant = 'custom-{slug}'` di staging
4. [ ] Test storefront rendering di staging URL
5. [ ] Schedule cutover dengan client (off-hours)
6. [ ] DNS update: arahkan `namatoko.com` ke storo-storefront Vercel
7. [ ] Monitor 24 jam: error rate, conversion rate, page load time
8. [ ] Old clone Vercel project: pause (don't delete dulu)
9. [ ] Setelah 1 minggu OK: archive old clone

### Rollback
- DNS revert ke old Vercel project (1 menit)
- Old clone tidak di-delete sampai 30 hari post-migrate

---

## PHASE 5: Storoengine Archive

### Pre-conditions
- Semua client sudah migrated (Phase 4 complete)
- 30 hari grace period setelah last migration

### Tasks
1. [ ] Final commit di storoengine: README pointer ke storo-storefront repo + migration changelog
2. [ ] Mark repo sebagai archived di GitHub
3. [ ] Decommission semua per-client Vercel projects
4. [ ] Update DNS: hapus subdomain lama yg tidak terpakai
5. [ ] Update CLAUDE.md di storo-platform: hapus reference ke storoengine sebagai active

---

## Total Effort & Timeline

| Phase | Effort | Calendar (1 dev) | Calendar (2 dev parallel) |
|-------|--------|-----------------|--------------------------|
| Pre-flight | 0.5 hari | 0.5 hari | 0.5 hari |
| Phase 1 | 5 hari | 1 minggu | 1 minggu |
| Phase 2 | 13 hari | 3 minggu | 3 minggu (Track A) |
| Phase 3 | 18 hari | 4 minggu | 4 minggu (Track B, parallel dengan A) |
| Phase 4 | 0.5 hari per client | 50 minggu untuk 50 client (1-2/minggu) | 25 minggu (2 dev migrate parallel) |
| Phase 5 | 1 hari | 1 hari | 1 hari |
| **Total V3 ready** | | **~8 minggu** | **~5 minggu** |

> Phase 4 (client migration) bisa overlap dengan Phase 5 di sisi ops, dev work sebenarnya selesai di Phase 3.

---

## Decision Points yang Saya Butuh dari Owner

Sebelum mulai eksekusi, saya butuh confirm 4 hal:

1. **Existing client data dengan `use_storo_gateway=false`** — mereka mau di-migrate ke `own_prepaid` (perlu setup wallet manual + minimum topup) atau tetap `storo_gateway` (default)?

2. **Storo-storefront repo location** — `PTVENTERA-AI/storo-storefront` (private org) OK?

3. **Phase 2 + Phase 3 parallel atau serial?** Parallel = butuh 2 dev, lebih cepat (5 minggu). Serial = 1 dev, lebih hemat tapi 8 minggu.

4. **Phase 1 timing** — ada deploy schedule conflict yang harus dihindari? Misalnya jangan minggu depan karena ada launch lain?

---

## Quick-win yang Bisa Dimulai Sekarang (parallel ke decision)

Tidak butuh keputusan, langsung action:

- [ ] **P-1 fix**: tulis migration formal untuk `disbursements` table (1 jam)
- [ ] **P-2 audit**: query existing `onboarding_requests.plan` distribution (15 menit)
- [ ] **Cleanup**: hapus folder `storoengine/app/(dashboard)` yang sudah deprecated (0.5 hari, low risk)
