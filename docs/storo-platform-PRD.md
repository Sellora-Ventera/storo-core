# STORO.ID PLATFORM - Product Requirements Document
# Client Portal & Landing Page
# Version: 2.1 | Date: 2026-04-06
# Changelog:
#   v2.1 - Auth changed from Clerk to Supabase Auth (AUTH_PROVIDER abstraction layer)
#          Step 6 onboarding changed from file upload to info screen (engineer handles import)
#          Added: client product management, referral system, superadmin dashboard
#          clients table: clerk_user_id -> user_id, added KYC & disbursement & referral fields
#          Notifications simplified to 1 trigger: status='live' only
#          Added superadmin_users table

---

## 1. OVERVIEW

storo.id adalah **website utama platform Storo** yang berfungsi sebagai:
1. **Marketing landing page** -- menjelaskan layanan, pricing, testimonial
2. **Client portal** -- login, pilih tema, pilih domain, upload file, kelola toko
3. **Onboarding flow** -- guided process dari daftar sampai toko live

Ini adalah **repo terpisah** dari storoengine (webstore template).

**URL:** https://storo.id

### 1.1 Relasi dengan storoengine

**storoengine** (repo ini) adalah template webstore multi-tenant yang sudah memiliki:
- Full storefront (products, categories, cart, checkout)
- Admin dashboard (products CRUD, orders, customers, import)
- Payment gateway (Xendit & Midtrans) dengan webhook
- Shipping integration (Biteship - 11+ kurir Indonesia)
- Shopee Excel import (6-file parser + image downloader)
- Blog CMS + API automation (external posting via API keys)
- Promo codes, banners, dan store settings

**storo.id** adalah layer di atas storoengine yang menangani:
- Marketing & client acquisition
- Onboarding & provisioning
- Client dashboard (multi-store management)
- Billing & disbursement
- Domain management (termasuk pembelian via Namecheap)

---

## 2. USER JOURNEY

```
Calon Client
  |
  +-- 1. Visit storo.id -> lihat landing page
  +-- 2. Klik "Mulai Sekarang" -> Sign Up / Login
  +-- 3. Onboarding wizard:
  |     +-- a. Isi profil (nama, email, WA, data diri)
  |     +-- b. Upload KTP + info rekening bank
  |     +-- c. Pilih plan (Starter/Business/Enterprise)
  |     +-- d. Pilih template tema
  |     +-- e. Pilih domain (namatoko.storo.id GRATIS, atau beli custom domain)
  |     +-- f. Upload 6 file Excel Shopee (atau kirim via WA)
  |
  +-- 4. Status: "Menunggu Setup" -> engineer VenteraAI proses
  +-- 5. Engineer selesai -> status "Live"
  +-- 6. Client buka dashboard -> lihat link toko, analytics ringkas
```

---

## 3. SYSTEM ARCHITECTURE

```
+------------------------------------------------------+
|                    storo.id                            |
|              (Next.js, repo terpisah)                  |
|                                                        |
|  +----------+  +------------------+  +---------------+   |
|  | Landing   |  | Auth (Supabase)  |  | Client Portal |   |
|  | Page      |  | Login/Signup     |  | Dashboard     |   |
|  +----------+  +--------------+  +---------------+   |
|                                                        |
|  +-------------------------------------------------+  |
|  | Domain Service (Namecheap API)                   |  |
|  | - Search available domains                       |  |
|  | - Purchase domains on behalf of client           |  |
|  | - Configure DNS to point to Vercel               |  |
|  +-------------------------------------------------+  |
|                                                        |
|  Database: Supabase (SAME DB as storoengine)           |
|  Tables: clients, client_stores, onboarding_requests  |
+------------------------------------------------------+
         |
         |  Engineer picks up onboarding request
         v
+------------------------------------------------------+
|  storoengine (per-client Vercel deployment)            |
|  tokoa.storo.id / tokob.storo.id / ...                |
|  tokoa.com (custom domain via Namecheap)              |
|                                                        |
|  Already implemented:                                  |
|  - Storefront (products, cart, checkout)              |
|  - Dashboard (products, orders, customers, import)    |
|  - Payments (Xendit/Midtrans + webhooks)              |
|  - Shipping (Biteship 11+ courir)                     |
|  - Blog CMS + API automation                          |
|  - Promo codes, banners, store settings               |
+------------------------------------------------------+
```

---

## 4. PAGES & FEATURES

### 4.1 Landing Page (Public)

```
storo.id/
+-- Hero Section
|   "Dari Shopee ke Website Sendiri, Tanpa Ribet"
|   CTA: "Mulai Sekarang" -> /sign-up
|
+-- Problem Section
|   Pain points Shopee seller (fee naik, no control, dll)
|
+-- How It Works (3 steps)
|   1. Upload file Shopee -> 2. Pilih tema & domain -> 3. Toko online live!
|
+-- Features Section
|   - Import ribuan produk otomatis dari Shopee
|   - Payment gateway siap pakai (Xendit/Midtrans)
|   - Ongkir otomatis (11+ kurir via Biteship)
|   - Custom domain (beli langsung dari platform)
|   - Dashboard kelola toko + blog
|   - Promo codes & banner management
|
+-- Template Gallery
|   Preview tema yang tersedia (screenshot + live demo link)
|
+-- Pricing Section
|   Starter / Business / Enterprise
|   Tabel perbandingan fitur
|
+-- Testimonials
|   Client success stories (setelah ada client)
|
+-- FAQ Section
|   Pertanyaan umum
|
+-- CTA Section
|   "Siap Buka Toko Online?" -> /sign-up
|
+-- Footer
    About, Contact, Terms, Privacy, Social links
```

### 4.2 Auth Pages

```
/sign-up    -> Supabase Auth signup (email + password)
              - Captures referral code from sessionStorage if coming from /r/[code]
              - After signup: POST /events { type: 'signup', referralCode } if applicable
/sign-in    -> Supabase Auth login
/sign-out   -> Logout (Supabase signOut)

Auth abstraction layer: src/lib/auth/index.ts
  - Default: Supabase Auth
  - Optional swap: AUTH_PROVIDER=clerk in .env
  - Exports: getUser, requireAuth, signOut (same interface)
```

### 4.3 Onboarding Wizard (Post-Signup)

Guided multi-step form, progress bar di atas.

```
/onboarding
+-- Step 1: Profil Bisnis
|   +-- Nama lengkap
|   +-- Nomor WhatsApp (primary contact)
|   +-- Nama toko di Shopee
|   +-- Link toko Shopee (optional, untuk referensi)
|   +-- Alamat lengkap toko / gudang
|
+-- Step 2: Data Diri & Rekening
|   +-- Upload KTP (foto/scan)
|   +-- Nama pemilik rekening
|   +-- Nama bank
|   +-- Nomor rekening
|   +-- Catatan: "Data ini untuk proses disbursement hasil penjualan"
|
+-- Step 3: Pilih Plan
|   +-- Starter  -- Rp 1.5jt setup + Rp 250rb/bulan
|   +-- Business -- Rp 3.5jt setup + Rp 500rb/bulan
|   +-- Enterprise -- Rp 7.5jt setup + Rp 1jt/bulan
|   (highlight recommended plan)
|
+-- Step 4: Pilih Template
|   +-- Grid preview template yang tersedia
|   +-- Klik untuk preview full / live demo
|   +-- Select template -> highlight border
|   +-- Note: "Template bisa diganti nanti"
|
+-- Step 5: Pilih Domain
|   +-- Option A: Subdomain GRATIS
|   |   +-- Input: [namatoko].storo.id
|   |   +-- Real-time check availability (cek slug di DB)
|   |   +-- Suggestions jika sudah dipakai
|   |
|   +-- Option B: Custom Domain (Beli via Storo)
|   |   +-- Search domain via Namecheap API
|   |   +-- Tampilkan hasil: domain, harga, status (available/taken)
|   |   +-- Suggest alternatif TLD (.com, .co.id, .id, .store, .shop)
|   |   +-- Pilih domain -> tambah ke keranjang onboarding
|   |   +-- Harga domain ditambahkan ke invoice setup
|   |   +-- DNS auto-configured setelah purchase
|   |
|   +-- Option C: Sudah Punya Domain
|       +-- Input custom domain -> instruksi manual DNS setup
|
+-- Step 6: Status Info (BUKAN upload file)
|   +-- Informasi screen: "Tim kami akan setup toko Anda"
|   +-- Penjelasan proses (timeline estimate):
|   |   1. Review data & verifikasi (1-2 hari kerja)
|   |   2. Setup toko & import produk (2-3 hari kerja)
|   |   3. Test & deploy (1 hari kerja)
|   |   4. Toko live!
|   +-- Catatan: "Anda akan dihubungi via WhatsApp oleh tim kami"
|   +-- Note: Import produk dari Shopee HANYA dilakukan oleh engineer VenteraAI
|   +-- "Sudah punya file Excel Shopee? Kirim via WhatsApp ke: [nomor WA]"
|
+-- Step 7: Review & Submit
    +-- Ringkasan semua data
    +-- Ringkasan biaya:
    |   - Setup fee (sesuai plan)
    |   - Domain purchase (jika beli custom domain)
    |   - Total
    +-- Terms & conditions checkbox
    +-- Klik "Kirim Permintaan"
    +-- Status: "Menunggu Setup" + estimasi waktu
```

### 4.4 Client Dashboard

```
/dashboard
+-- Overview
|   +-- Status onboarding: "Menunggu Setup" / "Dalam Proses" / "Live"
|   +-- Notifikasi / updates dari engineer
|   +-- Quick stats (jika toko sudah live):
|       - Total produk
|       - Total orders bulan ini
|       - Revenue bulan ini
|
+-- Toko Saya (/dashboard/stores)
|   +-- List semua toko (card layout)
|   |   +-------------------------------------+
|   |   | Sepatu Buddy                        |
|   |   | sepatubuddy.storo.id                |
|   |   | + sepatubuddy.com (custom domain)   |
|   |   | Status: * Live                      |
|   |   | Template: Modern                    |
|   |   | Produk: 342 | Orders: 28            |
|   |   |                                     |
|   |   | [Buka Toko]  [Dashboard Toko]       |
|   |   +-------------------------------------+
|   |   +-------------------------------------+
|   |   | Tas Buddy                           |
|   |   | tasbuddy.storo.id                   |
|   |   | Status: Menunggu Setup              |
|   |   | Template: Clean                     |
|   |   |                                     |
|   |   | [Lihat Progress]                    |
|   |   +-------------------------------------+
|   |
|   +-- [+ Tambah Toko Baru] -> onboarding wizard lagi
|
+-- Domain Saya (/dashboard/domains)
|   +-- List semua domain yang dimiliki
|   |   +-------------------------------------+
|   |   | sepatubuddy.com                     |
|   |   | Status: * Active                    |
|   |   | Expires: 2027-04-06                 |
|   |   | Auto-renew: ON                      |
|   |   | Linked to: Sepatu Buddy store       |
|   |   |                                     |
|   |   | [Manage DNS]  [Renew]               |
|   |   +-------------------------------------+
|   |
|   +-- [+ Beli Domain Baru] -> domain search
|   +-- Domain renewal reminders
|   +-- DNS status indicator (propagated / pending)
|
+-- Profil & Rekening (/dashboard/profile)
|   +-- Edit profil bisnis
|   +-- Update data rekening bank
|   +-- Upload ulang KTP
|   +-- Ganti password / email
|
+-- Tagihan (/dashboard/billing)
|   +-- Status plan aktif per toko
|   +-- Riwayat pembayaran (setup fee, monthly, domain purchase)
|   +-- Invoice download (PDF)
|   +-- Informasi disbursement:
|       +---------------------------------------------+
|       | Periode: 1-15 Maret 2026                    |
|       | Gross Sales: Rp 12.500.000                  |
|       | PG Fee (4%): -Rp 500.000                    |
|       | Ops Fee (1%): -Rp 125.000                   |
|       | Net: Rp 11.875.000                          |
|       | Status: Ditransfer 18 Mar 2026              |
|       +---------------------------------------------+
|
+-- Produk Saya (/dashboard/products)
|   +-- List produk client (read dari shared Supabase by store_id)
|   +-- [+ Tambah Produk] -> form sederhana:
|   |   - Nama produk
|   |   - Harga
|   |   - Upload gambar (Supabase Storage)
|   |   - Stok
|   |   - Deskripsi
|   +-- Edit produk individual (/dashboard/products/[id])
|   +-- Catatan: Bulk import dari Shopee hanya dilakukan engineer via /dashboard/import di storoengine
|
+-- Referral (/dashboard referral tab)
|   +-- Kode referral saya: [STORO-XXXXXX] [Copy]
|   +-- Link referral: storo.id/r/XXXXXX [Copy] [Share WA]
|   +-- Stats: X klik | Y daftar | Z konversi
|   +-- Reward pending: Rp 200.000 (status: menunggu approval)
|   +-- Riwayat reward
|
+-- Bantuan (/dashboard/help)
|   +-- Cara export file dari Shopee Seller Center
|   +-- FAQ
|   +-- Hubungi support (WA link)
|   +-- Video tutorial (optional, future)
|
+-- Notifikasi
    +-- "Toko Anda sudah live!"
    +-- "Disbursement Rp X telah ditransfer"
    +-- "File Shopee berhasil diproses, 342 produk diimport"
    +-- "Domain sepatubuddy.com berhasil didaftarkan"
    +-- "Domain sepatubuddy.com akan expire dalam 30 hari"
    +-- "Ada update produk yang gagal, silakan cek"
```

---

## 5. DATABASE TABLES (Tambahan di Shared Supabase)

Tabel ini ditambahkan ke Supabase DB yang sama dengan storoengine.

### 5.1 Existing storoengine Tables (Already Implemented)

Tabel berikut sudah ada di storoengine dan TIDAK perlu dibuat ulang:

```
stores              -- Top-level store entity (id, name, slug, settings, shipping_origin, payment_config)
products            -- Product inventory (with shopee_item_id for dedup)
product_variants    -- Size/color variations
product_images      -- Product image management
product_shipping    -- Courier config per product
categories          -- Nestable product categories
customers           -- Store customers
orders              -- Customer orders with payment/shipping status
order_items         -- Line items in orders
import_jobs         -- Shopee Excel import tracking (6-file support)
blog_posts          -- Blog CMS (draft/published, external API posting)
store_api_keys      -- API key management for blog automation
store_banners       -- Homepage banner carousel
store_promos        -- Promo codes/vouchers
disbursements       -- Payment disbursement tracking
```

### 5.2 New Tables for storo.id Client Portal

```sql
-- Client profiles (linked to Supabase Auth user)
clients (
  id UUID PK DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,         -- Supabase Auth user_id
  full_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  shopee_store_name TEXT,
  shopee_store_url TEXT,
  address TEXT,
  -- Data diri
  ktp_url TEXT,                         -- upload ke Supabase Storage
  ktp_verified BOOLEAN DEFAULT false,
  -- Rekening bank
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  -- Disbursement preference
  disbursement_cycle TEXT DEFAULT 'manual',  -- 'weekly' | 'monthly' | 'manual'
  -- KYC (required for auto-disbursement)
  kyc_status TEXT DEFAULT 'pending',    -- 'pending' | 'submitted' | 'approved' | 'rejected'
  kyc_submitted_at TIMESTAMPTZ,
  kyc_approved_at TIMESTAMPTZ,
  -- Referral (from sharelink.id)
  referral_code TEXT,                   -- kode yang mereferensikan client ini
  referral_ref_id TEXT,                 -- sharelink referral ID
  -- Meta
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Onboarding requests (1 per toko yang diminta)
onboarding_requests (
  id UUID PK DEFAULT gen_random_uuid(),
  client_id UUID FK -> clients NOT NULL,
  -- Pilihan client
  plan TEXT NOT NULL,                 -- 'starter', 'business', 'enterprise'
  template_name TEXT NOT NULL,        -- 'modern', 'clean', 'fashion', dll
  requested_slug TEXT NOT NULL,       -- subdomain yang diminta: "namatoko"
  custom_domain TEXT,                 -- optional: "www.tokoabc.com"
  domain_order_id UUID FK -> domain_orders, -- jika beli domain via Storo
  -- File uploads
  files_uploaded JSONB DEFAULT '[]',  -- [{ name, type, storage_path, uploaded_at }]
  upload_method TEXT DEFAULT 'platform', -- 'platform' atau 'whatsapp'
  -- Status tracking
  status TEXT DEFAULT 'pending',      -- pending -> reviewing -> in_progress -> live -> rejected
  status_note TEXT,                   -- catatan dari engineer
  assigned_engineer TEXT,             -- engineer yang handle
  -- Hasil
  store_id UUID FK -> stores,          -- link ke store setelah live
  store_url TEXT,                     -- "namatoko.storo.id"
  live_at TIMESTAMPTZ,
  -- Meta
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Notifications
client_notifications (
  id UUID PK DEFAULT gen_random_uuid(),
  client_id UUID FK -> clients NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',           -- 'info', 'success', 'warning', 'billing', 'domain'
  link TEXT,                          -- deep link ke halaman terkait
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Billing / Invoices
invoices (
  id UUID PK DEFAULT gen_random_uuid(),
  client_id UUID FK -> clients NOT NULL,
  store_id UUID FK -> stores,          -- null jika invoice setup sebelum store exist
  type TEXT NOT NULL,                 -- 'setup', 'monthly', 'domain_purchase', 'domain_renewal', 'disbursement'
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'unpaid',       -- 'unpaid', 'paid', 'overdue', 'cancelled'
  due_date DATE,
  paid_at TIMESTAMPTZ,
  invoice_url TEXT,                   -- generated PDF
  -- Domain-related (jika type = domain_*)
  domain_order_id UUID FK -> domain_orders,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Available templates (engineer-managed)
templates (
  id UUID PK DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,          -- 'modern', 'clean', 'fashion'
  display_name TEXT NOT NULL,         -- 'Modern Minimalist'
  description TEXT,
  preview_image_url TEXT,
  demo_url TEXT,                      -- live demo link
  repo_url TEXT,                      -- git repo untuk clone
  features JSONB,                     -- ["dark mode", "mega menu", "product zoom"]
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Domain availability check cache
reserved_slugs (
  slug TEXT PK,                       -- "namatoko"
  store_id UUID FK -> stores,
  client_id UUID FK -> clients,
  reserved_at TIMESTAMPTZ DEFAULT now()
)

-- Domain orders (purchased via Namecheap API)
domain_orders (
  id UUID PK DEFAULT gen_random_uuid(),
  client_id UUID FK -> clients NOT NULL,
  store_id UUID FK -> stores,          -- linked after store is live
  -- Domain info
  domain_name TEXT NOT NULL,          -- "sepatubuddy.com"
  tld TEXT NOT NULL,                  -- "com", "co.id", "id", "store", "shop"
  -- Namecheap data
  namecheap_order_id TEXT,            -- Namecheap order reference
  namecheap_domain_id TEXT,           -- Namecheap domain ID for management
  -- Pricing
  purchase_price DECIMAL(12,2) NOT NULL,  -- price in IDR
  renewal_price DECIMAL(12,2),        -- yearly renewal price in IDR
  currency TEXT DEFAULT 'IDR',
  -- Registration
  registration_date DATE,
  expiry_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  -- DNS
  dns_configured BOOLEAN DEFAULT false,
  dns_records JSONB DEFAULT '[]',     -- [{ type, host, value, ttl }]
  vercel_domain_added BOOLEAN DEFAULT false,
  -- Status
  status TEXT DEFAULT 'pending',      -- pending -> registered -> active -> expired -> cancelled
  status_note TEXT,
  -- Meta
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Domain search cache (avoid repeated API calls)
domain_search_cache (
  id UUID PK DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,                -- search term e.g. "sepatubuddy"
  results JSONB NOT NULL,             -- cached API response
  cached_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL     -- cache TTL (e.g. 15 minutes)
)

-- Superadmin team members (VenteraAI internal)
superadmin_users (
  id UUID PK DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,       -- Supabase Auth user_id
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'engineer',       -- 'engineer' | 'admin' | 'superadmin'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

---

## 6. DOMAIN MANAGEMENT (Namecheap API Integration)

### 6.1 Overview

Storo menawarkan 3 opsi domain kepada client:

| Option | Description | Cost |
|--------|-------------|------|
| **Subdomain (Free)** | namatoko.storo.id | Gratis, included di semua plan |
| **Beli Custom Domain** | namatoko.com via Namecheap | Harga domain + markup (auto-configured) |
| **Pakai Domain Sendiri** | Client sudah punya domain | Gratis, manual DNS setup |

### 6.2 Namecheap API Integration

**API Documentation:** https://www.namecheap.com/support/api/intro/

**Authentication:**
- API User & Key dari akun Namecheap VenteraAI (reseller/API access)
- Whitelisted IP addresses (server-side only)
- Sandbox mode untuk development

**Environment Variables:**
```
NAMECHEAP_API_USER=venteraai
NAMECHEAP_API_KEY=<api-key>
NAMECHEAP_USERNAME=venteraai
NAMECHEAP_CLIENT_IP=<server-ip>
NAMECHEAP_USE_SANDBOX=true          -- false untuk production
```

### 6.3 API Endpoints (storo.id)

#### Domain Search
```
POST /api/domains/search
Body: { query: "sepatubuddy" }

Response: {
  query: "sepatubuddy",
  results: [
    { domain: "sepatubuddy.com",    available: true,  price: 185000, currency: "IDR" },
    { domain: "sepatubuddy.co.id",  available: true,  price: 250000, currency: "IDR" },
    { domain: "sepatubuddy.id",     available: false, price: null,   currency: "IDR" },
    { domain: "sepatubuddy.store",  available: true,  price: 95000,  currency: "IDR" },
    { domain: "sepatubuddy.shop",   available: true,  price: 55000,  currency: "IDR" },
    { domain: "sepatubuddy.online", available: true,  price: 25000,  currency: "IDR" }
  ],
  cached: false,
  expires_in: 900
}
```

**Namecheap API used:** `namecheap.domains.check`
- Check multiple TLDs in one call
- Cache results for 15 minutes (domain_search_cache table)
- Convert USD prices to IDR with markup

#### Domain Purchase
```
POST /api/domains/purchase
Body: {
  domain: "sepatubuddy.com",
  client_id: "uuid",
  onboarding_request_id: "uuid",     -- optional, link to onboarding
  years: 1,
  auto_renew: true
}

Response: {
  success: true,
  order_id: "uuid",
  domain: "sepatubuddy.com",
  namecheap_order_id: "NC-12345",
  expiry_date: "2027-04-06",
  total_price: 185000,
  dns_status: "configuring"
}
```

**Namecheap APIs used:**
1. `namecheap.domains.create` -- Register domain
2. `namecheap.domains.dns.setHosts` -- Configure DNS records

**Registrant info:** Uses VenteraAI company data as registrant (domain is purchased under VenteraAI account on behalf of client). Ownership can be transferred to client upon request.

#### DNS Configuration (Auto)
```
POST /api/domains/configure-dns
Body: {
  domain_order_id: "uuid",
  vercel_project_id: "prj_xxx"        -- target Vercel deployment
}
```

**Auto-configured DNS records:**
```
A     @     76.76.21.21          -- Vercel
CNAME www   cname.vercel-dns.com -- Vercel
```

**Namecheap API used:** `namecheap.domains.dns.setHosts`

After DNS config, also calls Vercel API to add custom domain to project.

#### Domain Status Check
```
GET /api/domains/status?domain_order_id=uuid

Response: {
  domain: "sepatubuddy.com",
  status: "active",
  dns_configured: true,
  dns_propagated: true,
  ssl_active: true,               -- Vercel auto-SSL
  expiry_date: "2027-04-06",
  auto_renew: true
}
```

#### Domain Renewal
```
POST /api/domains/renew
Body: {
  domain_order_id: "uuid",
  years: 1
}
```

**Namecheap API used:** `namecheap.domains.renew`

#### List Client Domains
```
GET /api/domains?client_id=uuid

Response: {
  domains: [
    {
      id: "uuid",
      domain_name: "sepatubuddy.com",
      status: "active",
      store_name: "Sepatu Buddy",
      expiry_date: "2027-04-06",
      auto_renew: true,
      dns_configured: true
    }
  ]
}
```

### 6.4 Namecheap API Client Library

```
lib/domains/namecheap.ts
  - searchDomains(query: string, tlds?: string[]): Promise<DomainSearchResult[]>
  - registerDomain(domain: string, years: number, registrant: RegistrantInfo): Promise<RegisterResult>
  - setDnsRecords(domain: string, records: DnsRecord[]): Promise<void>
  - getDomainInfo(domain: string): Promise<DomainInfo>
  - renewDomain(domain: string, years: number): Promise<RenewResult>
  - checkDomainStatus(domain: string): Promise<DomainStatus>

lib/domains/pricing.ts
  - convertUsdToIdr(usdAmount: number): number       -- real-time or cached rate
  - applyMarkup(basePrice: number): number            -- VenteraAI margin
  - getDomainPricing(results: DomainSearchResult[]): DomainPricing[]

lib/domains/dns.ts
  - configureForVercel(domain: string, vercelProjectId: string): Promise<void>
  - verifyDnsPropagation(domain: string): Promise<boolean>
  - getRequiredRecords(domain: string): DnsRecord[]
```

### 6.5 Domain Purchase Flow

```
Client di onboarding Step 5 atau /dashboard/domains:

1. Client ketik nama domain yang diinginkan
     |
     v
2. POST /api/domains/search -> Namecheap API domains.check
   - Check multiple TLDs (.com, .co.id, .id, .store, .shop, .online)
   - Cache results 15 menit
   - Convert USD -> IDR + markup
     |
     v
3. Client pilih domain yang available
   - Lihat harga per TLD
   - Pilih durasi (1/2/3 tahun)
     |
     v
4. Domain dipilih -> ditambahkan ke onboarding summary
   - Harga domain masuk ke total invoice
     |
     v
5. Client submit onboarding -> domain_orders record created
   - Status: pending (belum dibeli)
   - Invoice generated (setup fee + domain fee)
     |
     v
6. Setelah pembayaran confirmed:
   - POST /api/domains/purchase -> Namecheap API domains.create
   - Status: registered
     |
     v
7. Engineer setup toko -> deploy ke Vercel
     |
     v
8. POST /api/domains/configure-dns
   - Namecheap API: set DNS records (A + CNAME)
   - Vercel API: add custom domain to project
   - Status: active
     |
     v
9. DNS propagation (biasanya 5-30 menit)
   - Background job check propagation
   - Notifikasi ke client: "Domain sepatubuddy.com sudah aktif!"
```

### 6.6 Domain Renewal Automation

```
Daily CRON job (atau Supabase Edge Function scheduled):

1. Query domain_orders WHERE expiry_date <= NOW() + INTERVAL '30 days'
2. Jika auto_renew = true:
   - Generate renewal invoice
   - Kirim notifikasi ke client
   - Setelah payment confirmed -> Namecheap API domains.renew
3. Jika auto_renew = false:
   - Kirim reminder notification (30 days, 14 days, 7 days, 1 day before expiry)
   - Client bisa manual renew dari /dashboard/domains
```

### 6.7 Pricing Strategy

| TLD | Est. Cost (USD) | Markup | Client Price (IDR) |
|-----|----------------|--------|-------------------|
| .com | $8-12 | 30% | ~Rp 185.000 |
| .co.id | $15-20 | 25% | ~Rp 250.000 |
| .id | $20-30 | 25% | ~Rp 350.000 |
| .store | $3-5 | 40% | ~Rp 95.000 |
| .shop | $2-4 | 40% | ~Rp 55.000 |
| .online | $1-3 | 50% | ~Rp 25.000 |

Harga di-convert realtime dari USD menggunakan exchange rate API atau fixed rate yang di-update mingguan.

---

## 7. UPLOAD FILE SHOPEE

### 7.1 Supported Files (Already Implemented in storoengine)

storoengine sudah memiliki parser lengkap untuk 6 file Shopee:

| File | Parser | Data Extracted |
|------|--------|---------------|
| Mass Update Basic Info | `lib/shopee/parsers/basic-info.ts` | Product name, description, category, condition |
| Mass Update Sales Info | `lib/shopee/parsers/sales-info.ts` | Price, stock, variants (size/color), SKU |
| Mass Update Shipping Info | `lib/shopee/parsers/shipping-info.ts` | Weight, dimensions, courier config |
| Mass Update Media Info | `lib/shopee/parsers/media-info.ts` | Product images (auto-downloaded from Shopee CDN) |
| Mass Update DTS Info | `lib/shopee/parsers/dts-info.ts` | Days to ship, pre-order settings |
| Mass Republish Items | `lib/shopee/parsers/republish.ts` | Publish status |

**Import endpoint:** `POST /api/import/shopee`
- Merges data from all 6 files via `lib/shopee/merger.ts`
- Deduplicates by `shopee_item_id`
- Downloads images via `lib/shopee/image-downloader.ts`
- Tracks progress via `import_jobs` table

### 7.2 Via Platform (Preferred)

- Client upload langsung di `/onboarding` step 6 atau `/dashboard/upload`
- File disimpan ke **Supabase Storage** bucket `shopee-uploads/{client_id}/{timestamp}/`
- Engineer download dari storage saat setup
- Auto-detect file type, validasi format

### 7.3 Via WhatsApp (Alternative)

Untuk client yang kurang tech-savvy:

```
Client kirim 6 file via WA ke nomor VenteraAI
  -> Admin terima, upload manual ke Supabase Storage
  -> Link ke onboarding_request.files_uploaded
  -> Update upload_method = 'whatsapp'
```

### 7.4 Tutorial Export dari Shopee

```
Cara Export File dari Shopee Seller Center:

1. Login ke Shopee Seller Center (seller.shopee.co.id)
2. Buka menu "Produk Saya"
3. Klik "Mass Update" / "Update Massal"
4. Download 6 file berikut:
   V Mass Update Basic Info
   V Mass Update Sales Info
   V Mass Update Shipping Info
   V Mass Update Media Info
   V Mass Update DTS Info
   V Mass Republish Items
5. Upload semua file ke Storo

Tips: Pastikan semua produk yang ingin dipindahkan
   statusnya "Active" di Shopee sebelum export.
```

---

## 8. ONBOARDING STATUS FLOW

```
pending        Client sudah submit, belum di-review
    |
    v
reviewing      Engineer sedang review data & file
    |
    +-->  rejected    Data tidak lengkap / file salah
    |       |         (client diminta perbaiki, bisa re-submit)
    |       +--> pending (re-submit)
    v
in_progress    Engineer sedang setup (clone, import, config)
    |
    v
live           Toko sudah online! Link tersedia di dashboard
```

Setiap perubahan status -> trigger `client_notifications`.

---

## 9. ENGINEER WORKFLOW (Internal)

Engineer VenteraAI melihat onboarding requests via internal dashboard atau langsung query DB.

```
1.  Lihat request baru (status: pending)
2.  Review: data client lengkap? file valid?
    - Jika tidak -> status: rejected + note alasan
    - Jika ya -> status: reviewing -> in_progress
3.  Clone storoengine repo template
4.  Create store di DB (INSERT INTO stores), set STORE_ID
5.  Download file Excel dari Supabase Storage
6.  Import via POST /api/import/shopee di storoengine
    - Parser auto-merges 6 files
    - Images auto-downloaded from Shopee CDN
7.  Configure store settings:
    - Branding (logo, banner, colors)
    - Payment (Xendit/Midtrans API keys via /dashboard/settings/payment)
    - Shipping origin (city, postal code via /dashboard/settings/shipping)
    - Couriers (enable/disable per courier)
8.  Deploy ke Vercel
9.  Set subdomain: namatoko.storo.id
10. If custom domain purchased:
    - POST /api/domains/configure-dns -> auto DNS setup
    - Add domain to Vercel project
    - Wait for DNS propagation + SSL
11. Test checkout flow (payment + shipping calculation)
12. Update onboarding_request:
    - status: 'live'
    - store_id: linked
    - store_url: 'namatoko.storo.id'
13. Trigger notifikasi: "Toko Anda sudah live!"
```

---

## 10. TECH STACK

### storo.id (Client Portal - To Be Built)

| Component | Technology |
|-----------|-----------|
| **Framework** | Next.js (App Router) |
| **UI** | shadcn/ui + Tailwind CSS |
| **Auth** | Supabase Auth (default) with Clerk as optional swap via `AUTH_PROVIDER` env var |
| **Auth Layer** | `src/lib/auth/index.ts` — exports getUser, requireAuth, signOut |
| **Database** | Supabase (SAME instance as storoengine) |
| **Storage** | Supabase Storage (KTP uploads, product images) |
| **Animations** | Framer Motion |
| **Forms** | React Hook Form + Zod |
| **Domain API** | Namecheap API (mock first, real keys later) |
| **Referral** | sharelink.id API (`api.reflink.id/v1`) |
| **Deployment** | Vercel (storo.id domain) |

### storoengine (Webstore Template - Already Built)

| Component | Technology | Status |
|-----------|-----------|--------|
| **Framework** | Next.js 16 (App Router) | Implemented |
| **UI** | shadcn/ui + Tailwind CSS 4 | Implemented |
| **Auth** | Clerk | Implemented (dev bypass active) |
| **Database** | Supabase PostgreSQL | Implemented (5 migrations) |
| **State** | Zustand (cart persistence) | Implemented |
| **Payment** | Xendit & Midtrans (webhooks) | Implemented |
| **Shipping** | Biteship (11+ courir) | Implemented |
| **Import** | XLSX parser (6 Shopee files) | Implemented |
| **Blog** | CMS + API automation | Implemented |
| **Charts** | Recharts | Implemented |
| **Analytics** | Vercel Analytics | Implemented |

---

## 11. PAGES SUMMARY

### storo.id Routes (Client Portal)

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page (marketing) |
| `/pricing` | Public | Detail pricing + comparison |
| `/templates` | Public | Gallery template preview |
| `/sign-up` | Public | Clerk registration |
| `/sign-in` | Public | Clerk login |
| `/onboarding` | Auth | 7-step onboarding wizard |
| `/r/[code]` | Public | Referral landing redirect |
| `/dashboard` | Auth | Client overview + referral tab |
| `/dashboard/stores` | Auth | List toko + link |
| `/dashboard/stores/[id]` | Auth | Detail toko + progress |
| `/dashboard/domains` | Auth | Domain management |
| `/dashboard/domains/search` | Auth | Search & buy domains |
| `/dashboard/products` | Auth | Product list (by store_id) |
| `/dashboard/products/new` | Auth | Tambah produk (simple form) |
| `/dashboard/products/[id]` | Auth | Edit produk individual |
| `/dashboard/profile` | Auth | Profil + data rekening |
| `/dashboard/billing` | Auth | Tagihan + disbursement (read-only) |
| `/dashboard/help` | Auth | FAQ + panduan Shopee + WA support |
| `/superadmin` | Superadmin | KPI: revenue, active stores, pending |
| `/superadmin/onboarding` | Superadmin | Request queue, assign engineer, update status |
| `/superadmin/stores` | Superadmin | All stores: client, plan, status, engine version |
| `/superadmin/stores/[id]` | Superadmin | Store detail + edit status + notes |
| `/superadmin/users` | Superadmin | All clients: name, email, WA, plan, store count |
| `/superadmin/users/[id]` | Superadmin | Client detail + history |
| `/superadmin/billing` | Superadmin | All invoices, overdue flag |
| `/superadmin/disbursements` | Superadmin | Create + manage disbursements |
| `/superadmin/disbursements/new` | Superadmin | Select store + period + auto-calc |
| `/superadmin/disbursements/[id]` | Superadmin | Detail: payment ref, receipt, client bank |
| `/superadmin/kyc` | Superadmin | KYC status per client |
| `/superadmin/pricing` | Superadmin | Edit plan prices (stored in DB) |
| `/superadmin/templates` | Superadmin | Manage template gallery |
| `/superadmin/referrals` | Superadmin | Approve/distribute referral rewards |
| `/superadmin/settings` | Superadmin | Platform settings (fees, WA number, etc.) |

### storoengine Routes (Already Implemented)

| Route | Access | Description |
|-------|--------|-------------|
| `/store` | Public | Store homepage (featured products, banners) |
| `/store/products` | Public | Product listing + filters |
| `/store/products/[slug]` | Public | Product detail (variants, shipping calc) |
| `/store/category/[slug]` | Public | Category filtered products |
| `/store/cart` | Public | Shopping cart |
| `/store/checkout` | Public | 3-step checkout form |
| `/store/checkout/pending` | Public | Payment processing |
| `/store/checkout/success` | Public | Order confirmation |
| `/store/blog` | Public | Blog listing |
| `/store/blog/[slug]` | Public | Blog post detail |
| `/store/search` | Public | Product search |
| `/dashboard` | Auth | Admin dashboard overview |
| `/dashboard/products` | Auth | Product CRUD |
| `/dashboard/products/new` | Auth | Create product |
| `/dashboard/products/[id]` | Auth | Edit product |
| `/dashboard/categories` | Auth | Category management |
| `/dashboard/orders` | Auth | Order management |
| `/dashboard/orders/[id]` | Auth | Order detail |
| `/dashboard/customers` | Auth | Customer list |
| `/dashboard/import` | Auth | Shopee Excel import |
| `/dashboard/banners` | Auth | Banner management |
| `/dashboard/promos` | Auth | Promo code management |
| `/dashboard/blog` | Auth | Blog CMS |
| `/dashboard/blog/keys` | Auth | API key management |
| `/dashboard/settings` | Auth | Store settings |
| `/dashboard/settings/payment` | Auth | Payment gateway config |
| `/dashboard/settings/shipping` | Auth | Shipping config |

### storoengine API Routes (Already Implemented)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/products` | GET, POST | List/create products |
| `/api/products/[id]` | PATCH, DELETE | Update/delete product |
| `/api/categories` | GET, POST | List/create categories |
| `/api/categories/[id]` | PATCH, DELETE | Update/delete category |
| `/api/orders` | GET, POST | List/create orders |
| `/api/orders/[id]` | PATCH | Update order status |
| `/api/checkout` | POST | Initiate checkout -> payment URL |
| `/api/webhooks/xendit` | POST | Xendit payment callback |
| `/api/webhooks/midtrans` | POST | Midtrans payment callback |
| `/api/shipping/rates` | POST | Biteship rate calculation |
| `/api/shipping/provinces` | GET | Indonesia provinces |
| `/api/shipping/cities` | GET | Cities by province |
| `/api/shipping/tracking` | GET | Shipment tracking |
| `/api/blog` | GET, POST | List/create blog posts |
| `/api/blog/[id]` | PATCH, DELETE | Update/delete blog post |
| `/api/blog/keys` | GET, POST | List/create API keys |
| `/api/blog/keys/[id]` | PATCH | Revoke API key |
| `/api/banners` | GET, POST | List/create banners |
| `/api/banners/[id]` | PATCH, DELETE | Update/delete banner |
| `/api/promos` | GET, POST | List/create promos |
| `/api/promos/validate` | POST | Validate promo code |
| `/api/stores` | GET, PATCH | Get/update store info |
| `/api/customers` | GET | List customers |
| `/api/dashboard/stats` | GET | Dashboard metrics |
| `/api/import/shopee` | POST | Shopee 6-file Excel import |

---

## 12. NOTIFICATIONS

### Trigger Events

**CONFIRMED: Only ONE notification trigger is implemented.**

| Event | Notification | Type |
|-------|-------------|------|
| `onboarding_requests.status = 'live'` | "Toko Anda sudah live! Kunjungi: namatoko.storo.id" | success |

All other status changes (pending, reviewing, in_progress, rejected) do NOT send automated notifications.
Client can see current status in their dashboard at any time.

> **Decision rationale:** Avoid notification spam. The one moment that matters is when the store goes live. Engineers communicate other updates directly via WhatsApp.

### Delivery Channels

- **In-app**: Notification bell di dashboard (real-time via Supabase Realtime)
- **WhatsApp** (future): Kirim notifikasi penting via WA API
- **Email** (future): Invoice, disbursement confirmation, domain renewal reminders

---

## 13. SECURITY & PRIVACY

### Data Sensitif

| Data | Storage | Access |
|------|---------|--------|
| KTP foto | Supabase Storage (private bucket) | Client + engineer only |
| Rekening bank | Encrypted column di `clients` | Client + admin only |
| Shopee files | Supabase Storage (private bucket) | Client + engineer only |
| Namecheap API keys | Server env vars only | Backend API only |
| Domain registrant data | Namecheap (VenteraAI account) | VenteraAI admin only |

### RLS Policies

```sql
-- Clients hanya bisa lihat data sendiri
CREATE POLICY "clients_own_data" ON clients
  FOR ALL USING (user_id = auth.uid());

-- Onboarding requests hanya pemilik
CREATE POLICY "own_requests" ON onboarding_requests
  FOR ALL USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

-- Invoices hanya pemilik
CREATE POLICY "own_invoices" ON invoices
  FOR ALL USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

-- Domain orders hanya pemilik
CREATE POLICY "own_domains" ON domain_orders
  FOR ALL USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

-- Templates public read
CREATE POLICY "templates_public_read" ON templates
  FOR SELECT USING (is_active = true);

-- Domain search cache - server only (no direct client access)
-- Accessed via API routes, not direct Supabase queries
```

### Namecheap API Security

- API calls are **server-side only** (never expose API key to client)
- IP whitelisting required by Namecheap
- All domain purchases logged in `domain_orders` table
- Rate limiting on `/api/domains/search` (max 10 searches per minute per client)

---

## 14. DEVELOPMENT PHASES (Sprint Plan)

See `PLATFORM-BUILD-PLAN.md` for complete sprint plan. Summary:

### Sprint 1 — Foundation
- [ ] Auth abstraction layer (`src/lib/auth/index.ts`, `supabase.ts`, `clerk.ts`)
- [ ] Supabase server client (`src/lib/supabase/server.ts`)
- [ ] Middleware (protect routes)
- [ ] Sign-in page, sign-up page (with referral code capture)
- [ ] Referral landing redirect (`src/app/r/[code]/page.tsx`)
- [ ] Footer component
- [ ] DB tables: clients, onboarding_requests, templates, superadmin_users

### Sprint 2 — Onboarding Wizard
- [ ] OnboardingWizard container (progress bar, step routing)
- [ ] Step 1: Profile (nama, WA, Shopee store name, alamat)
- [ ] Step 2: Identity (KTP upload, bank details)
- [ ] Step 3: Plan selection (Starter/Pro/Advance/Flexible/Custom)
- [ ] Step 4: Template picker (from templates table)
- [ ] Step 5: Domain (subdomain / Namecheap search / own domain)
- [ ] Step 6: Status info screen ("Tim kami akan setup toko Anda")
- [ ] Step 7: Review + total cost + T&C + submit
- [ ] API: `GET /api/slugs/check`, `POST /api/domains/search`, `POST /api/onboarding/submit`

### Sprint 3 — Client Dashboard
- [ ] Dashboard overview (onboarding status, notifications, quick stats)
- [ ] Stores list + store detail (timeline, engineer notes, live link)
- [ ] Domain management
- [ ] Products: list, add, edit (simple form, no bulk import)
- [ ] Billing (read-only disbursements)
- [ ] Profile, help pages
- [ ] Referral tab (ReferralCard component)

### Sprint 4 — Superadmin Dashboard
- [ ] Route group `/superadmin/*` with role check
- [ ] Onboarding queue (assign engineer, update status)
- [ ] Store management (all stores, detail, edit)
- [ ] User management
- [ ] Billing & disbursements (create, mark paid)
- [ ] KYC management
- [ ] Referral rewards (approve/distribute)
- [ ] Platform settings

### Sprint 5 — Public Pages & API Routes
- [ ] `/pricing` — full comparison table
- [ ] `/templates` — gallery from DB
- [ ] All storo.id API routes (see §11)
- [ ] Namecheap API client (mock first, real keys later)
- [ ] sharelink.id referral API proxy

### Namecheap Mock Strategy
- `src/lib/domains/namecheap.ts` — adapter (real or mock based on env)
- `src/lib/domains/mock.ts` — hardcoded available/unavailable + prices
- Toggle: `NAMECHEAP_USE_SANDBOX=mock` → mock, `false` → real API

---

## 15. storoengine PRE-PRODUCTION CHECKLIST

Items yang perlu diselesaikan di storoengine sebelum client deployment:

- [ ] Enable Clerk middleware in `middleware.ts` (currently disabled for dev)
- [ ] Remove dev auth bypass in `lib/auth/dev-auth.ts`
- [ ] Lock down RLS policies (replace `003_dev_permissive_rls.sql` with production policies)
- [ ] Connect payment settings UI to backend (currently UI-only)
- [ ] Connect shipping settings UI to backend (currently UI-only)
- [ ] Implement customer account login & order history
- [ ] Add rich text editor for blog content
- [ ] Implement direct image upload to Supabase Storage
- [ ] SEO: sitemap.xml, robots.txt generation
- [ ] Fix 3 existing TypeScript errors (categories, settings, admin client)

---

---

## 16. SUPERADMIN DASHBOARD

**Route group:** `/superadmin/*` — requires `superadmin_users` entry with active role.

### 16.1 Access Control

```
Role check middleware -> superadmin_users.is_active = true
Roles: 'engineer' | 'admin' | 'superadmin'
```

### 16.2 Routes & Features

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

### 16.3 Design

Design system: slate-900 bg, #4169df accent, Inter font, data-dense operational layout.
Icons: Lucide React only. No emojis in UI.

---

## 17. REFERRAL SYSTEM (via sharelink.id)

### 17.1 Overview

Setiap client terdaftar mendapat referral code unik.
Ketika referee sign up & complete onboarding → referrer mendapat reward.

**Reward:** Rp 200.000 diskon monthly fee (atau store credit). *(Tipe reward: pending konfirmasi)*

### 17.2 Mechanics

```
Client mendaftar -> POST /referrals -> dapat kode unik STORO-XXXXXX
Client share link: storo.id/r/STORO-XXXXXX

Referee kunjungi /r/[code]
  -> validate code via GET /referrals/validate/{code}
  -> simpan di sessionStorage: { referralCode: "STORO-XXXXXX" }
  -> tampilkan landing dengan nama referrer + penawaran reward

Referee daftar di /sign-up
  -> POST /events { type: 'signup', referralCode, referredUserId }
  -> clients.referral_code = "STORO-XXXXXX"

Referee selesai onboarding (Step 7 submit)
  -> POST /events { type: 'purchase', referralCode, metadata: { plan, setupFee } }
  -> Reward created (status: pending review)

Superadmin approve & distribute reward
  -> PATCH /rewards/{id}/approve -> /distribute
  -> Referrer mendapat Rp 200.000 credit di invoice berikutnya
```

### 17.3 API Integration Points

**Base URL:** `https://api.reflink.id/v1`  
**Server-side proxy:** `POST /api/referral/event` (never expose secret key to client)

| When | API Call | Purpose |
|------|----------|---------|
| Client signs up | `POST /referrals` | Generate referral link |
| Referee lands on `/r/[code]` | `GET /referrals/validate/{code}` | Check validity, show reward |
| Referee completes sign-up | `POST /events { type: 'signup' }` | Trigger signup event |
| Referee completes onboarding | `POST /events { type: 'purchase' }` | Trigger conversion event |
| Client views dashboard | `GET /referrals?referrerId={userId}` | Show referral stats |
| Superadmin approves reward | `PATCH /rewards/{id}/approve` + `/distribute` | Process reward |

### 17.4 Campaign Config (One-time setup in sharelink.id dashboard)

```
Campaign ID: camp_storo_2026
Trigger event: 'purchase' (after onboarding complete)
Reward referrer: Rp 200.000 credit
Reward referred: 10% discount on setup fee
Auto-approve: false (manual review by superadmin)
```

### 17.5 Env Vars

```env
SHARELINK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_SHARELINK_PUBLISHABLE_KEY=pk_live_...
SHARELINK_CAMPAIGN_ID=camp_storo_2026
```

---

*Document version: 2.1*
*Last updated: 2026-04-06*
*Author: VenteraAI Engineering*
*storo.id repo: Terpisah dari storoengine (to be created)*
*storoengine repo: PTVENTERA-AI/storoengine (private, production), adewap23/storoengine (public mirror)*
*Database: Shared Supabase instance*
