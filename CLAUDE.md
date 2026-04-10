# CLAUDE.md — storo-id-landingpage

## Gambaran Proyek

**storo.id** adalah website utama platform Storo — layanan webstore terkelola (model agensi) oleh VenteraAI. Repo ini (`storo-id-landingpage`) menangani:

- Landing page marketing (storo.id)
- Portal & dashboard client (`/dashboard`)
- Order-first onboarding wizard 5 langkah (`/(onboarding)`) — guest-accessible, tanpa auth
- Dashboard superadmin (`/(superadmin)`)
- Sistem referral via sharelink.id (`/r/[code]`)
- Manajemen domain (Namecheap API)
- Billing & disbursement
- Checkout & payment (Xendit direct API call dari server route)

**Terpisah dari storoengine** (template engine webstore) — storoengine menangani storefront, admin, payment, shipping, import Shopee. Keduanya berbagi database Supabase yang sama (multi-tenant via `store_id`).

## Tech Stack

- **Framework:** Next.js (App Router)
- **Bahasa:** TypeScript
- **Styling:** Tailwind CSS + Radix UI primitives (shadcn/ui)
- **Auth:** Supabase Auth (abstraction layer di `src/lib/auth/`, bisa ditukar via env var `AUTH_PROVIDER`)
- **Database:** Supabase (instance bersama, multi-tenant dengan RLS)
- **Ikon:** Lucide React saja (tidak boleh emoji di UI)
- **Payment:** Xendit (utama) + Midtrans
- **Shipping:** Biteship (11+ kurir)
- **Referral:** sharelink.id API (`api.reflink.id/v1`)
- **Domain:** Namecheap XML API (strategi mock-first)
- **Leads:** Supabase Edge Function (`leads-collector`)

## Struktur Proyek

```
src/
├── app/
│   ├── (auth)/           # Halaman sign-in, sign-up (tetap ada, bukan flow utama)
│   ├── (dashboard)/      # Dashboard client (toko, billing, referral)
│   ├── (onboarding)/     # Order-first wizard 5 langkah (guest-accessible)
│   ├── (superadmin)/     # Dashboard admin VenteraAI
│   ├── api/
│   │   ├── onboarding/
│   │   │   ├── submit/   # Lead capture lama (backward compat)
│   │   │   └── checkout/ # Order-first: create user + client + invoice + Xendit
│   │   ├── domains/      # Domain availability check (Namecheap/mock)
│   │   └── webhooks/     # Biteship webhook
│   ├── blog/             # Halaman blog
│   ├── payment/          # Success & failed pages (redirect dari Xendit)
│   ├── pricing/          # Halaman pricing (import dari lib/plans.ts)
│   ├── r/                # Redirect referral (/r/[code])
│   ├── templates/        # Galeri template
│   └── page.tsx          # Landing page
├── components/
│   └── onboarding/       # OnboardingWizard.tsx (5-step wizard utama)
├── lib/
│   ├── auth/             # Abstraction layer auth (swap supabase/clerk)
│   ├── supabase/         # Setup Supabase client (server + browser)
│   ├── plans.ts          # Single source of truth: plan data & pricing
│   ├── dal.ts            # Data access layer
│   └── utils.ts          # Utilitas
```

## Model Bisnis

- **Model agensi:** VenteraAI melakukan SEMUA setup. Client tidak bisa self-build.
- **Revenue:** Biaya setup + biaya bulanan + 5% per transaksi (1% ops + 4% PG)
- **Disbursement:** Manual sampai KYC Xendit disetujui, lalu otomatis mingguan/bulanan.

## Keputusan Utama

- Auth: Supabase Auth (bukan Clerk) — single source of truth, RLS bekerja native
- Namecheap: Mock API dulu, key asli diberikan owner nanti
- Notifikasi client: Hanya SATU trigger — saat `onboarding_requests.status = 'live'`
- Source of truth storoengine: `PTVENTERA-AI/storoengine` (private org)
- Update template: Versioning git tag (v1.0.0+), file `.storo-version` per client
- **Webhook Biteship pusat:** `src/app/api/webhooks/biteship/route.ts` menerima semua event tracking shipment (order.status, order.price, order.waybill_id) dari akun Biteship VenteraAI. Multi-tenant via lookup `orders.metadata->biteship->>order_id` (cross-store). Env: `BITESHIP_WEBHOOK_SECRET`. URL di dashboard Biteship: `https://storo.id/api/webhooks/biteship`.
- **Order-first registration flow:** User memesan toko TANPA akun dulu. Akun Supabase Auth dibuat di akhir wizard (step 4), sebelum redirect ke Xendit. Ini menggantikan flow lama (sign-up dulu → onboarding). Sign-up page lama (`/sign-up`) tetap ada tapi bukan flow utama.
- **Plan data terpusat:** `src/lib/plans.ts` adalah single source of truth untuk 5 plan (Starter, Pro, Advance, Flexible, Custom). Diimpor oleh: OnboardingWizard, pricing page, checkout API route.
- **Checkout API route:** `POST /api/onboarding/checkout` memanggil Xendit API langsung (bukan via edge function `xendit-create-invoice` yang butuh auth token). Env: `XENDIT_SECRET_KEY`.
- **Landing page CTA:** Semua CTA utama (Hero, Header, Pricing, Solution, Problem, ClosingCTA) mengarah ke `/onboarding`, bukan `/sign-up` atau WhatsApp.

## Flow Registrasi (Order-First)

```
Landing page CTA "Pesan Toko"
          │
          ▼
   /onboarding (guest, tanpa auth)
   OnboardingWizard.tsx — 5 step:
   ┌─────────────────────────────────────────┐
   │ Step 1: Profil (nama, WA, nama toko)    │
   │ Step 2: Pilih Paket (dari lib/plans.ts) │
   │ Step 3: Domain (opsional, Namecheap)    │
   │ Step 4: Buat Akun (email + password)    │
   │ Step 5: Ringkasan → Bayar               │
   │   POST /api/onboarding/checkout         │
   │   → create auth user (auto-confirm)     │
   │   → create client + onboarding_request  │
   │   → create invoice + call Xendit API    │
   │   → redirect ke Xendit payment page     │
   └─────────────────────────────────────────┘
          │
   ┌──────┴──────┐
   ▼             ▼
 /payment/    /payment/
 success      failed
   │
   ▼
 Login → /dashboard
```

**Tabel DB terlibat:**
- `onboarding_leads` — tracking lead + status (pending → account_created → paid → converted)
- `clients` — profil user
- `onboarding_requests` — request setup toko (plan, slug, domain)
- `invoices` — setup fee (Xendit provider)

**Env vars yang dibutuhkan untuk checkout:**
- `SUPABASE_SERVICE_ROLE_KEY` — admin operations (create user, insert rows)
- `XENDIT_SECRET_KEY` — Xendit invoice creation (opsional, fallback ke manual payment)
- `NEXT_PUBLIC_SITE_URL` — base URL untuk redirect success/failed (default: `https://storo.id`)

## Sistem Desain

| Area | Primary | Accent | Font |
|------|---------|--------|------|
| Landing page | #4169df | #f3973b | Inter |
| Dashboard client | #4169df | #f3973b | Inter |
| Superadmin | slate-900 | #4169df | Inter |

- Ikon: Lucide React saja. Tidak boleh emoji.
- Semua elemen yang bisa diklik: `cursor-pointer`
- Transisi: 150-300ms ease-out
- Kontras teks: minimal 4.5:1 (WCAG AA)
- Responsif: 375 / 768 / 1024 / 1440

## Leads Collector

URL edge function: `https://wfthvovlhphnrodrqxqt.supabase.co/functions/v1/leads-collector`

Field wajib: `email`, `domain`, `project`, `source`. Opsional: `whatsapp`.
Nama project untuk repo ini: `storo-id`.

## Perintah

```bash
npm run dev      # Server development
npm run build    # Build production
npm run lint     # Jalankan linter
```

## Referensi PRD

Spesifikasi detail ada di `docs/`:
- `docs/PLATFORM-BUILD-PLAN.md` — Master build plan, urutan sprint, semua keputusan
- `docs/storo-platform-PRD.md` — Spesifikasi portal client, onboarding, dashboard
- `docs/storo-engine-PRD-v2.md` — Arsitektur storoengine, skema DB, payment/shipping
- `docs/LEADS_COLLECTOR_REUSE_GUIDE.md` — Panduan integrasi edge function leads
