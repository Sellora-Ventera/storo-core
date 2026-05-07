# Storo Architecture V3 — Multi-Tenant Platform

> Status: PROPOSAL (belum dieksekusi)
> Last updated: 2026-05-07
> Replaces: clone-per-client model (storoengine clone per deployment)

---

## 1. Konteks & Masalah

**Model lama:** setiap client dapat clone storoengine, deploy sendiri ke Vercel. Dengan 50 client = 50 repo, satu bug fix = 50 PR. Custom design per client membuat divergence permanen — tidak bisa auto-merge update.

**Model baru:** single-repo multi-tenant storefront + seller center terpusat. Semua client share infra; design custom hidup sebagai folder template di repo yang sama.

**Positioning:** Storo = **agency for established Shopee sellers**. Setiap client dapat custom design (dikerjakan tim Storo). Bukan self-service template builder. Target customer = seller yang sudah jalan di Shopee dengan volume Rp 50jt-500jt+/bulan.

---

## 2. Keputusan yang Sudah Diambil (2026-05-07)

| # | Keputusan | Alasan |
|---|-----------|--------|
| 1 | **Single-repo multi-tenant storefront** | Hilangkan 50-repo problem. Setiap client = template variant folder. |
| 2 | **HTTP API antara storefront ↔ platform** (bukan direct Supabase) | Clean boundary, multi-tenant safer, refactor schema bebas. |
| 3 | **Hanya 2 billing model: Storo Gateway (5%) + Own Prepaid Wallet (1%)** | Postpay/invoice bulanan ditolak — Storo tidak mau ada AR/collection risk. |
| 4 | **Plan structure: 2-tier (Standard + Custom)** | Reduce decision paralysis. Semua plan = custom design oleh tim Storo. |
| 5 | **Plan capability matrix di DB** (tabel `plans`) | Saat ini cuma di `lib/plans.ts` (frontend), mudah di-bypass. |
| 6 | **Custom design di setiap plan**, billing fee setup + monthly + ad-hoc updates | Reflect cost agency model, profit dari recurring + transaction. |
| 7 | **PG: Xendit + Midtrans only** | Untuk buyer payment di kedua model billing, dan untuk topup wallet. |
| 8 | **Ops fee refund no time-limit, proporsional** | Fair untuk seller, audit trail dari ledger pattern. |
| 9 | **Custom variant auto-update** dari `_shared` components | Bug fix di shared logic propagate ke semua client. |
| 10 | **Multi-currency: tunda** | Fokus IDR dulu, tambah kalau ada permintaan riil. |

---

## 3. Arsitektur Target

```
┌──────────────────────────────────────────────────────────────┐
│ storo-platform (storo-id-landingpage)                        │
│ - Landing page                                               │
│ - Seller Center (admin dashboard)                            │
│ - Superadmin                                                 │
│ - Onboarding wizard                                          │
│ - Wallet management (topup, balance, transaction history)    │
│ - Public read API: /api/public/store/[slug]/*                │
│   (storefront fetch products/banners/promos dari sini)       │
└──────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP (read-only, edge-cached)
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ storo-storefront (NEW — single repo, single deploy)          │
│ - middleware.ts → resolve domain → store_id                  │
│ - templates/                                                 │
│   ├─ _shared/         shared components (cart, checkout)     │
│   ├─ T1-classic/      INTERNAL foundation (tim Storo only)   │
│   ├─ T2-minimal/      INTERNAL foundation                    │
│   ├─ T3-bold/         INTERNAL foundation                    │
│   ├─ custom-{slug}/   per-client (extend dari foundation)    │
│   └─ ...                                                     │
│ - app/[...slug]/page.tsx → render via stores.template_variant │
│ - Wildcard: *.storo.id + custom domains                      │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
            namatoko.storo.id, namatoko.com, dll
```

**Important:** T1/T2/T3 **bukan customer-facing tier**. Mereka starter foundation untuk tim Storo design+dev. Setiap client mendapat folder `custom-{slug}/` yang extend dari foundation, customized sesuai brand client.

**Storoengine repo lama:** beku/archive setelah migrasi selesai. Existing clones tetap jalan sampai client di-migrate satu per satu.

---

## 4. Schema Changes (DB)

### 4.1 Tabel baru: `plans`

Replace `lib/plans.ts` sebagai single source of truth.

```sql
CREATE TABLE plans (
  id TEXT PRIMARY KEY,                    -- 'standard', 'custom'
  name TEXT NOT NULL,
  setup_fee DECIMAL(12,2),                -- nullable for 'custom'
  monthly_fee DECIMAL(12,2),              -- nullable for 'custom'
  ops_fee_pct DECIMAL(5,3) NOT NULL DEFAULT 1.000,    -- 1% default ops fee (own prepaid)
  pg_fee_pct DECIMAL(5,3) NOT NULL DEFAULT 4.000,     -- 4% PG when using Storo gateway

  -- Billing model capability (ONLY 2 models — no postpay)
  allow_billing_storo_gateway BOOLEAN DEFAULT true,
  allow_billing_own_prepaid BOOLEAN DEFAULT false,

  -- Feature flags (enforced by API + RLS)
  allow_custom_domain BOOLEAN DEFAULT true,
  allow_multi_admin BOOLEAN DEFAULT false,
  allow_api_integration BOOLEAN DEFAULT false,
  allow_blog_seo BOOLEAN DEFAULT true,
  allow_promos BOOLEAN DEFAULT true,
  allow_analytics BOOLEAN DEFAULT true,
  allow_animations BOOLEAN DEFAULT false,         -- bespoke animations only on Custom

  -- Soft limits
  max_products INT,                       -- NULL = unlimited
  max_admins INT DEFAULT 1,
  max_orders_per_month INT,               -- NULL = unlimited

  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  features JSONB DEFAULT '[]',            -- display-only feature list for landing page
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Plan capability matrix (seed data):**

| Plan | Setup | Monthly | storo_gateway | own_prepaid | custom_design | api | multi_admin | animations |
|------|-------|---------|---------------|-------------|---------------|-----|-------------|------------|
| **standard** | Rp 5jt | Rp 750rb | ✅ default | ✅ optional (+Rp 500rb activation) | ✅ (template-inspired) | ❌ | ❌ | ❌ |
| **custom** | Quote | Quote | ✅ | ✅ | ✅ (bespoke) | ✅ | ✅ | ✅ |

> **Logika pricing:** Standard di Rp 5jt setup reflect honest cost (~30 jam design+dev @ Rp 100rb/jam = 3jt cost, margin 2jt). Recurring revenue dari 5% (Storo gateway default) atau 1% (own prepaid). Custom = quoted per kontrak, scale dengan effort.

### 4.2 Extend tabel `stores`

```sql
ALTER TABLE stores
  ADD COLUMN billing_model TEXT NOT NULL DEFAULT 'storo_gateway'
    CHECK (billing_model IN ('storo_gateway', 'own_prepaid')),
  ADD COLUMN template_variant TEXT NOT NULL DEFAULT 'custom-pending',
  ADD COLUMN theme_config JSONB DEFAULT '{}';
```

**`theme_config` example** (untuk small variations dalam custom variant):
```json
{
  "primary_color": "#4169df",
  "accent_color": "#f3973b",
  "font_heading": "Inter",
  "font_body": "Inter",
  "border_radius": "lg",
  "logo_url": "https://...",
  "favicon_url": "https://..."
}
```

`template_variant` value examples: `custom-nutiver`, `custom-adewap`, `custom-acme-corp`. Folder yg sesuai harus exist di `storo-storefront/templates/`.

### 4.3 Wallet system (untuk billing_model = 'own_prepaid')

**Design principle:** ledger-based (immutable journal + cached balance), strict prepaid (no negative balance, no credit), auto-suspend storefront when depleted.

```sql
-- One row per store with prepaid wallet
CREATE TABLE store_wallets (
  store_id UUID PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  low_balance_threshold DECIMAL(12,2) NOT NULL DEFAULT 100000,  -- Rp 100rb default = hard suspend trigger
  warning_threshold DECIMAL(12,2) NOT NULL DEFAULT 500000,      -- Rp 500rb = warning notif trigger
  auto_topup_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_topup_amount DECIMAL(12,2),
  auto_topup_method TEXT,                                       -- 'xendit_recurring', 'midtrans_recurring'
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'warning', 'suspended', 'closed')),
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Append-only ledger (immutable audit trail)
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  type TEXT NOT NULL CHECK (type IN (
    'topup',                -- seller adds funds (+)
    'ops_fee',              -- ops fee per order (-)
    'refund',               -- order refunded → return ops fee (+)
    'adjustment_credit',    -- admin manual credit (+)
    'adjustment_debit',     -- admin manual debit (-)
    'dispute_hold',         -- temporary hold during dispute (-)
    'dispute_release'       -- release after dispute (+)
  )),
  amount DECIMAL(12,2) NOT NULL,         -- always positive; sign by type
  balance_before DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  ref_order_id UUID,                     -- for ops_fee, refund
  ref_invoice_id UUID,                   -- for topup
  ref_external TEXT,                     -- Xendit/Midtrans payment ID
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID,                       -- user_id (NULL = system)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallet_tx_store_created ON wallet_transactions(store_id, created_at DESC);
CREATE INDEX idx_wallet_tx_ref_order ON wallet_transactions(ref_order_id) WHERE ref_order_id IS NOT NULL;
CREATE UNIQUE INDEX idx_wallet_tx_ref_external ON wallet_transactions(ref_external) WHERE ref_external IS NOT NULL;
```

**No `pending_settlements` table.** Karena nggak ada postpay, fee yang nggak bisa di-deduct = nggak ada (storefront sudah disuspend sebelum saldo benar-benar habis).

---

## 5. Billing Models — Detail Flow

### 5.1 Model A: Storo Gateway (5%)

**Default untuk semua plan baru.** Existing implementation tinggal disesuaikan dengan plan capability matrix.

```
Buyer beli → bayar via Xendit/Midtrans AKUN STORO (VenteraAI)
                          ↓
                Uang masuk ke saldo Xendit/Midtrans Storo
                          ↓
              Storo potong 5% (1% ops + 4% PG)
                          ↓
            Storo transfer NET amount ke rekening seller
                          (manual, weekly/monthly)
```

**Implementation status:** ✅ sudah ada di codebase
- `disbursements` table dengan `gross_amount`, `pg_fee`, `ops_fee`, `net_amount`
- Superadmin disbursement flow

**Yang perlu update:** plan capability check di onboarding — kalau plan tidak `allow_billing_storo_gateway`, hide opsi ini.

### 5.2 Model C: Own Gateway Prepaid (1%) — NEW

```
Buyer beli → bayar via Xendit/Midtrans AKUN SELLER SENDIRI
                          ↓
                Uang langsung masuk REKENING SELLER
                (Storo nggak pegang sepeser pun)
                          ↓
        Storo deduct 1% dari WALLET SALDO seller (atomic, real-time)
                          ↓
        Saat saldo kritis → notif → suspend kalau habis
                          ↓
       Seller topup wallet via Xendit/Midtrans transfer ke Storo
```

#### 5.2.1 Activation Requirement

- Seller wajib pilih billing model di onboarding
- Jika pilih `own_prepaid`:
  - Bayar setup fee (Rp 5jt untuk Standard)
  - Bayar **minimum topup Rp 500rb** untuk activate wallet
  - Storefront live setelah saldo wallet >= Rp 500rb

#### 5.2.2 Wallet Lifecycle

```
[balance > warning_threshold (default Rp 500rb)]
    → STATUS: active
    → Storefront normal

[low_balance_threshold (Rp 100rb) <= balance <= warning_threshold]
    → STATUS: warning
    → Banner kuning di seller dashboard
    → Email notif "Saldo Rp X, segera top up"
    → Storefront tetap normal

[balance < low_balance_threshold (Rp 100rb)]
    → STATUS: suspended
    → Storefront return banner "Toko sedang pemeliharaan"
    → Tombol checkout disabled (return 503 dari API)
    → Email + WhatsApp + push notif darurat ke seller
    → Tombol topup dashboard tetap active

[seller topup → balance > warning_threshold]
    → STATUS: active (auto-resume)
    → Storefront kembali normal
```

#### 5.2.3 Topup Flow

```
Seller di dashboard → klik "Top Up Saldo"
  ↓
Pilih amount (preset: 500rb, 1jt, 2.5jt, 5jt, 10jt, custom)
Pilih PG (Xendit / Midtrans)
  ↓
POST /api/wallet/topup
  → buat invoice (Xendit external_id: STORO-WALLET-{uuid}, atau Midtrans equivalent)
  → redirect ke payment page
  ↓
Seller bayar
  ↓
PG webhook → wallet topup handler
  → BEGIN TRANSACTION:
    SELECT FOR UPDATE store_wallets WHERE store_id = ?
    INSERT wallet_transactions (type='topup', amount, balance_before, balance_after, ref_external)
    UPDATE store_wallets SET balance = balance + amount,
                             status = (CASE WHEN balance + amount > warning_threshold
                                            THEN 'active' ELSE status END)
  → COMMIT
  ↓
Notif ke seller: "Saldo bertambah Rp X. Saldo sekarang: Rp Y"
```

#### 5.2.4 Ops Fee Deduction Flow

**Trigger:** order paid via seller's own gateway (webhook dari seller's Xendit/Midtrans).

```
Order paid webhook received
  ↓
Calculate ops_fee = order.total × plans.ops_fee_pct (default 1%)
  ↓
BEGIN TRANSACTION:
  SELECT FOR UPDATE store_wallets WHERE store_id = ?
  INSERT wallet_transactions (type='ops_fee', amount, ref_order_id, ref_external=webhook_id)
  UPDATE store_wallets SET balance = balance - ops_fee,
                           status = (CASE
                             WHEN balance - ops_fee < low_balance_threshold THEN 'suspended'
                             WHEN balance - ops_fee < warning_threshold THEN 'warning'
                             ELSE 'active' END)
COMMIT
  ↓
IF status changed to 'warning' or 'suspended' → trigger notif
```

**Concurrency safety:** `SELECT FOR UPDATE` di row `store_wallets` mencegah race condition. Postgres serializes simultaneous transactions per store.

**Idempotency:** `ref_external` punya unique index, double webhook = silent skip.

#### 5.2.5 Refund Flow (No Time Limit, Proportional)

```
Order partial/full refund triggered (admin atau buyer return)
  ↓
SELECT original ops_fee FROM wallet_transactions
  WHERE ref_order_id = order_id AND type = 'ops_fee'
  ↓
Calculate refund_amount = original_ops_fee × (refunded_total / order_original_total)
  ↓
BEGIN TRANSACTION:
  SELECT FOR UPDATE store_wallets ...
  INSERT wallet_transactions (type='refund', amount=refund_amount, ref_order_id)
  UPDATE store_wallets SET balance = balance + refund_amount, status = (recompute)
COMMIT
```

**No time limit:** ops fee = bayar untuk service "process order". Service di-reverse → fee di-reverse, kapanpun. Ledger pattern menjamin auditability.

#### 5.2.6 Edge Cases

| Skenario | Handling |
|----------|----------|
| Webhook double-fire | `ref_external` unique constraint → INSERT fails silently |
| Order partial refund | Proportional refund: `original_fee × (refunded / total)` |
| Order cancelled SEBELUM paid | No-op (ops fee belum dideduct) |
| Topup payment failed/expired | No wallet transaction created |
| Race condition (2 orders paralel saat saldo tipis) | `SELECT FOR UPDATE` serializes; satu order bisa drop saldo ke negative dalam buffer 100rb (acceptable loss) |
| Seller upgrade Standard → Custom | Wallet preserved, plan_id updated |
| Seller change billing_model active → own_prepaid | Setup wallet baru, minimum topup required sebelum aktif |
| Seller change billing_model own_prepaid → storo_gateway | Refund saldo wallet manual via admin (insert `adjustment_debit` + bank transfer) |
| Dispute order (chargeback) | Insert `dispute_hold` saat dispute opened, `dispute_release` atau `refund` saat resolved |
| Admin manual koreksi | `adjustment_credit`/`adjustment_debit` dengan `created_by` = admin user_id, deskripsi WAJIB |

#### 5.2.7 Invariants (untuk testing)

- ∀ store: `cached_balance == SUM(wallet_transactions.amount × sign_by_type)` — ledger reconciliation
- ∀ tx: `balance_after - balance_before == amount × sign_by_type`
- `balance >= 0` selalu (no negative balance allowed; suspend triggers before depletion)
- Setiap `ops_fee` tx HARUS punya `ref_order_id`
- Setiap `topup` tx HARUS punya `ref_invoice_id` DAN `ref_external`

#### 5.2.8 Nightly Reconciliation Job

```
For each store_wallet:
  computed_balance = SUM(wallet_transactions WHERE store_id = ?, signed by type)
  IF computed_balance != store_wallets.balance:
    ALERT to superadmin (email + Slack/dashboard alert)
    LOG discrepancy untuk audit
  IF status = 'suspended' BUT balance > warning_threshold:
    AUTO-FIX: status = 'active'
```

---

## 6. Storefront Template Variant System

### 6.1 Routing

```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const host = req.headers.get('host')
  const slug = extractSlug(host) // namatoko.storo.id → 'namatoko'

  const store = await fetchStoreBySlug(slug)  // via internal API
  if (!store) return NextResponse.redirect('/not-found')

  // Wallet check for own_prepaid stores
  if (store.billing_model === 'own_prepaid' && store.wallet_status === 'suspended') {
    return renderSuspendedPage(store)  // 503 dengan banner "Toko dalam pemeliharaan"
  }

  req.headers.set('x-store-id', store.id)
  req.headers.set('x-template-variant', store.template_variant)
  return NextResponse.next()
}
```

### 6.2 Template Folder Structure

```
storo-storefront/
├── middleware.ts
├── templates/
│   ├── _shared/             # shared components (cart, checkout, search) — auto-update
│   ├── T1-classic/          # INTERNAL foundation (tim Storo only)
│   ├── T2-minimal/          # INTERNAL foundation
│   ├── T3-bold/             # INTERNAL foundation
│   ├── custom-nutiver/      # extends T1, customized
│   ├── custom-adewap/       # extends T2, customized
│   └── custom-{slug}/       # one folder per client
└── app/
    ├── page.tsx             # dynamic import based on template_variant
    ├── products/
    └── ...
```

### 6.3 Custom Variant Rules

- T1/T2/T3 = **INTERNAL** foundation, never exposed sebagai customer-facing tier
- Setiap client (Standard or Custom plan) mendapat folder `custom-{slug}/`
- Custom variant WAJIB extend `_shared/` components — bug fix shared logic auto-update ke semua variant
- Visual layer (CSS, layout JSX) custom per client
- Setiap variant punya `version` field di `templates` table, bisa rollback

### 6.4 Custom Design Lifecycle

**Initial build:**
1. Tim Storo design pakai T1/T2/T3 sebagai foundation
2. Customize per brand client (colors, layout, sections)
3. Buat `templates/custom-{slug}/` di repo
4. Set `stores.template_variant = 'custom-{slug}'`
5. Deploy

**Update lifecycle:**
- Bug fix di `_shared/` → auto-propagate ke semua client (deploy single)
- Visual update specific client → manual edit `custom-{slug}/` → bayar ad-hoc design fee

**Pricing untuk update design (ad-hoc):**
- Minor tweak (warna, copy): Rp 250rb-500rb
- Section addition / layout change: Rp 1jt-3jt
- Major redesign: re-quote sebagai "Custom" plan

---

## 7. Migration Path (Phased)

### Phase 1 (1-2 minggu) — Schema foundation
- [ ] Migration: tabel `plans` + seed (standard, custom)
- [ ] Migration: extend `stores` (billing_model, template_variant, theme_config)
- [ ] Migration: tabel `store_wallets` + `wallet_transactions`
- [ ] Refactor `lib/plans.ts` → loader dari DB
- [ ] Update `PaymentSettingsForm`: 2 opsi billing_model (storo_gateway / own_prepaid)
- [ ] Hide existing 'starter', 'pro', 'advance', 'flexible' plans dari UI baru (grandfathered untuk client lama)

### Phase 2 (2-3 minggu) — Wallet system
- [ ] API endpoint `POST /api/wallet/topup` (Xendit + Midtrans support)
- [ ] Webhook handler integration: topup → wallet credit
- [ ] Webhook handler: order paid → ops fee deduct + auto-suspend logic
- [ ] Dashboard UI: wallet balance card + topup button + transaction history
- [ ] Notification system: warning + suspend triggers (email + WhatsApp + in-app banner)
- [ ] Nightly reconciliation cron

### Phase 3 (2-3 minggu) — Storefront repo baru
- [ ] Bootstrap `storo-storefront` repo
- [ ] Implement middleware routing + template variant selector
- [ ] Build T1-classic/T2-minimal/T3-bold internal foundations
- [ ] Build `_shared/` components (cart, checkout, search, account)
- [ ] Public read API di storo-platform: `/api/public/store/[slug]/{products,banners,promos,categories,blog}`
- [ ] Wildcard domain `*.storo.id` + custom domain handling
- [ ] Wallet status check di middleware (suspend page)

### Phase 4 (ongoing) — Migrasi client existing
- [ ] Convert nutiver clone → `templates/custom-nutiver/` (extend T1)
- [ ] Convert adewap clone → `templates/custom-adewap/`
- [ ] DNS update untuk arahkan ke storo-storefront deployment
- [ ] Freeze old clones (read-only)

### Phase 5 — Storoengine archive
- Setelah semua client di-migrate, archive storoengine repo
- Final commit: pointer ke storo-storefront repo + migration changelog

---

## 8. Risk & Mitigation

| Risk | Mitigation |
|------|-----------|
| Single storefront down = semua client down | Vercel Rolling Releases + canary deploy + per-template feature flags |
| Wallet balance discrepancy (bug logic) | Nightly reconciliation + invariant tests + immutable ledger |
| Race condition deduct fee | `SELECT FOR UPDATE` + idempotency via `ref_external` unique |
| Custom variant explosion (50 client = 50 folder) | Setiap variant >6 bulan tidak update → review apakah masih perlu; konsolidasi ke base foundation jika client tidak object |
| Migration risk (client live tiba-tiba broken) | Phased per-client migration, feature flag `use_new_storefront` per store, rollback-able via DNS |
| Seller saldo wallet tiba-tiba habis di tengah hari = lost sales | Multi-tier warning (warning_threshold + low_balance_threshold) + email + WhatsApp jauh sebelum suspend; auto-topup option |
| Storo float (uang nginap di Storo Xendit / wallet) | Disclosure transparan ke seller; legal review untuk tax/regulatory compliance |

---

## 9. Profitability Lens

Setelah V3 selesai, asumsi GMV Rp 100jt/bulan per client:

| Plan | Billing | Storo revenue | Storo float (cashflow) |
|------|---------|---------------|------------------------|
| Standard (default Storo Gateway) | 5% + Rp 750rb | Rp 5.75jt | Uang transit nginap di Storo Xendit |
| Standard (Own Prepaid) | 1% + Rp 750rb | Rp 1.75jt | Saldo wallet seller nginap di Storo |
| Custom | Quote | Negotiable | Negotiable |

**Strategi pricing:**
- **Default ke Storo Gateway** di onboarding wizard — margin 5x lebih besar dari own_prepaid
- Own Prepaid sebagai escape hatch untuk seller dengan trust issue (mereka pasti seller besar yang sudah punya akun PG sendiri)
- Custom plan = upsell untuk seller volume tinggi atau yang butuh integrasi spesial

**Trust mitigation untuk seller pilih Storo Gateway:**
- Real-time dashboard transparency (semua transaksi visible)
- Disbursement schedule jelas (mis. setiap Senin)
- Transparent fee breakdown di setiap order
- Same-day disbursement option untuk Custom plan

---

## 10. Open Items (non-blocking)

1. **Auto-topup** (saat balance < threshold, charge saved card via Xendit recurring): Phase 2.5, optional
2. **Wallet bonus / promo credit** (mis. topup Rp 1jt dapat Rp 100rb bonus): future feature
3. **Storefront kompetitif feature**: PWA, offline cart, saved wishlist — case-by-case via custom variant
4. **Multi-region deployment** (kalau buka pasar luar Indonesia): tunda
