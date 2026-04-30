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
│   ├── auth/             # Wrapper tipis di atas Supabase Auth
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

- Auth: Supabase Auth — single source of truth, RLS bekerja native. Dipakai di kedua repo (storo.id + storoengine admin).
- Namecheap: Mock API dulu, key asli diberikan owner nanti
- Notifikasi client: Hanya SATU trigger — saat `onboarding_requests.status = 'live'`
- Source of truth storoengine: `PTVENTERA-AI/storoengine` (private org)
- Update template: Versioning git tag (v1.0.0+), file `.storo-version` per client
- **Webhook Biteship pusat:** `src/app/api/webhooks/biteship/route.ts` menerima semua event tracking shipment (order.status, order.price, order.waybill_id) dari akun Biteship VenteraAI. Env: `BITESHIP_WEBHOOK_SECRET`. URL di dashboard Biteship: `https://www.storo.id/api/webhooks/biteship`.
  - **CRITICAL: Biteship TIDAK mengirim `order_id` di webhook body production.** Meskipun payload test/dokumentasi di dashboard Biteship mengandung field `order_id`, payload production yang dikirim ke endpoint kita TIDAK punya field tersebut. **JANGAN PERNAH** melakukan lookup via `body.order_id` atau `metadata->biteship->>order_id`. Jika engineer masa depan mau "fix" dengan revert ke order_id, jangan — itu akan break.
  - **Lookup 2-tier (cross-store, multi-tenant):**
    1. **Primary**: `.eq('shipping_tracking_number', body.courier_waybill_id)` — match untuk event status/price normal di mana waybill di payload sama dengan yang di DB. Index: `idx_orders_shipping_tracking_number` (migration `009_index_shipping_tracking.sql` di storoengine).
    2. **Fallback**: `.eq('metadata->biteship->>tracking_id', body.courier_tracking_id)` — match untuk event `order.waybill_id` di mana Biteship re-allocate kurir dan kirim waybill BARU yang tidak match dengan waybill lama di DB. `tracking_id` adalah identifier stabil Biteship yang **tidak berubah** saat waybill di-reassign, sudah disimpan di `metadata.biteship.tracking_id` oleh `storoengine/app/api/shipping/orders/route.ts` saat create shipping order.
  - **Status mapping (semua 13 status Biteship):** Biteship kirim status dalam **snake_case** di webhook body (dashboard menampilkan camelCase: `pickingUp`, `droppingOff`, `returnInTransit`, `onHold`, `courierNotFound`).
    - `confirmed`/`allocated`/`picking_up`/`on_hold` → `processing`
    - `picked`/`dropping_off` → `shipped` (set `shipped_at`)
    - `delivered` → `delivered` (set `delivered_at`)
    - `return_in_transit`/`rejected`/`courier_not_found`/`returned`/`cancelled`/`disposed` → `cancelled` (terminal, **bypass monotonic progression** — bisa di-apply dari state apapun karena Biteship adalah source of truth untuk cancellation)
  - **Field name inconsistency Biteship**: handler `handlePriceEvent` accept dua varian — `body.order_price` ATAU `body.price` untuk total, dan `body.order_shipment_fee` ATAU `body.shippment_fee` (note: typo "shippment" adalah typo Biteship) untuk biaya kurir.
  - **Kontrak dengan storoengine:** webhook bergantung pada storoengine menyimpan `shipping_tracking_number` (waybill) DAN `metadata.biteship.tracking_id` saat create shipping order. Tracking_id wajib untuk fallback lookup. Lihat `storoengine/CLAUDE.md` "Masalah yang Diketahui" untuk edge case waybill safety.
- **Order-first registration flow:** User memesan toko TANPA akun dulu. Akun Supabase Auth dibuat di akhir wizard (step 4), sebelum redirect ke Xendit. Ini menggantikan flow lama (sign-up dulu → onboarding). Sign-up page lama (`/sign-up`) tetap ada tapi bukan flow utama.
- **Plan data terpusat:** `src/lib/plans.ts` adalah single source of truth untuk 5 plan (Starter, Pro, Advance, Flexible, Custom). Diimpor oleh: OnboardingWizard, pricing page, checkout API route.
- **Checkout API route:** `POST /api/onboarding/checkout` memanggil Xendit API langsung (bukan via edge function `xendit-create-invoice` yang butuh auth token). Env: `XENDIT_SECRET_KEY`.
- **Webhook konfirmasi seller (invoice) dipusatkan ke edge function `storo-payment-confirm` di repo storoengine.** Satu edge function handle dua prefix external_id: `STORO-ORD-*` (order buyer) + `STORO-INV-*` (invoice seller). Cross-concern by design — DB bersama, service role key.
- **Edge function pembuat Xendit invoice seller:** `supabase/functions/storo-billing-invoice`. Dipanggil oleh `/api/onboarding/checkout` (step checkout wizard) dan `/api/billing/[id]/pay` (retry bayar dari dashboard billing). Generate external_id `STORO-INV-{invoice_uuid}`.
- **Landing page CTA:** Semua CTA utama (Hero, Header, Pricing, Solution, Problem, ClosingCTA) mengarah ke `/onboarding`, bukan `/sign-up` atau WhatsApp.
- **Halaman superadmin pakai service client untuk query data.** RLS di `onboarding_requests`, `clients`, `invoices`, `client_notifications`, dll. membatasi `SELECT` ke baris yang `client_id`-nya milik `auth.uid()` (lihat `supabase/migrations/20260401000001_use_supabase_auth.sql`). Layout `(superadmin)/layout.tsx` sudah menggating akses panel via `superadmin_users` (service role), jadi semua page anak (`/superadmin/*/page.tsx`) WAJIB pakai `createSupabaseServiceClient()` untuk query data — kalau pakai `createSupabaseServerClient()` (session user), superadmin cuma akan lihat toko/invoice/klien miliknya sendiri. Pola standar: `authClient` (server) untuk `auth.getUser()` redirect-check, `supabase` (service) untuk `.from(...)` queries. Jangan tambah RLS policy khusus superadmin — gating di layout sudah cukup dan lebih simpel.
- **Template Live Preview Deployment:** Panel `/superadmin/templates` mengizinkan tim VenteraAI menambah template storoengine yang otomatis di-deploy ke Vercel + DNS Cloudflare, menghasilkan live demo `{slug}.preview.storo.id`. Customer-facing `/templates` hanya menampilkan template `is_active=true AND deploy_status='live'`. Komponen: `src/lib/integrations/{vercel,cloudflare}.ts` (wrapper REST), `src/lib/template-deployer.ts` (orchestrator), `src/lib/template-seeder.ts` (dummy data ke schema storoengine via `stores.slug='preview-{slug}'`), `src/components/superadmin/{TemplateCard,TemplateDeployModal}.tsx`, API routes `src/app/api/superadmin/templates/*`. Auth check via helper `src/lib/auth/superadmin.ts` (`requireSuperadmin()`). Status lifecycle: `draft → deploying → live | failed | taking_down`. Async pattern: polling UI tiap 3-4 detik ke `GET /api/superadmin/templates/[id]/status` (yang internal panggil `pollDeploymentStatus()` ke Vercel API). Migrasi: `supabase/migrations/20260415000000_template_deployment.sql` (extend tabel `templates` + tabel baru `template_deployment_logs` + bucket `template-thumbnails`). Env: `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, `PREVIEW_DOMAIN_SUFFIX`, `STOROENGINE_REPO`. **Kolom kritis:** `templates.preview_image_url` = thumbnail statis di Supabase Storage `template-thumbnails`, BUKAN `preview_url` (UI lama bug — sudah di-fix). `templates.demo_url` = URL live hasil deploy. Cloudflare DNS `proxied=false` (grey cloud) supaya Vercel issue SSL Let's Encrypt sendiri. Spesifikasi lengkap: `docs/TEMPLATE-DEPLOYMENT-PRD.md`.

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
