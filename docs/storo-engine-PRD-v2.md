# STORO ENGINE - Product Requirements Document v2
# "Agency-Powered Webstore Builder for Shopee Sellers"
# Version: 2.2 | Date: 2026-04-06
# Changelog:
#   v2.2 - Added: disbursement read-only view (Sprint 7), template versioning system (Sprint 8)
#          Clarified: Shopee import is engineer-only (no client bulk import)
#          Clarified: client product addition handled by storo.id dashboard (simple form, not storoengine)
#          Noted: superadmin dashboard is now in storo.id repo (not storoengine)
#          Updated: storoengine prod repo = PTVENTERA-AI/storoengine (private)
#          Updated: storo.id includes full client portal + superadmin (see storo-platform-PRD.md)
#   v2.1 - Updated to reflect current codebase state; all phases 1-4 implemented;
#          added blog CMS, API keys, Namecheap domain integration reference
#   v2.0 - Revised architecture: agency model, centralized payment/shipping,
#          single DB multi-tenant, Biteship integration

---

## 1. EXECUTIVE SUMMARY

Storo Engine adalah **webstore engine** yang dioperasikan oleh VenteraAI sebagai agency.
VenteraAI men-setup webstore profesional untuk Shopee seller Indonesia -- dari import produk,
konfigurasi payment & shipping, hingga deployment & domain -- tanpa client perlu sentuh code.

**Tagline:** "Dari Shopee ke Webstore Sendiri, Tanpa Ribet."

**Business Model:** Agency / Website Builder Service
- Client TIDAK bisa self-service build website sendiri
- Semua setup dilakukan oleh engineer VenteraAI
- Revenue: Setup fee + Operational fee (1%) + Payment gateway fee pass-through (4%)

**Target Market:** Shopee seller Indonesia yang ingin punya webstore sendiri tapi tidak mau ribet
development, setup payment, dan konfigurasi shipping.

---

## 2. PROBLEM STATEMENT

### Pain Points Shopee Seller:
- Fee marketplace Shopee terus naik (commission + admin + service fee = 10%+ per transaksi)
- Tidak punya kontrol atas customer data (no CRM, no retargeting)
- Ketergantungan 100% pada satu platform
- Tidak bisa custom branding / domain sendiri

### Pain Points Bikin Webstore Sendiri:
- Mahal (Rp 5-50 juta untuk development)
- Ribet setup payment gateway, ongkir, dll
- Harus input produk ulang satu-satu (ratusan/ribuan SKU)
- Maintenance berkelanjutan butuh developer

### Storo Engine Solution:
- Agency model: VenteraAI handle semuanya, seller tinggal jualan
- Import produk langsung dari Shopee via 6 file Excel (ribuan SKU sekaligus)
- Payment gateway & shipping sudah di-setup oleh VenteraAI
- Biaya lebih murah dari marketplace: 1% ops + 4% PG = 5% total (vs 10%+ di Shopee)
- Custom domain: namatoko.storo.id atau beli domain via Namecheap API

---

## 3. SYSTEM ARCHITECTURE

### 3.1 High-Level Architecture

```
+------------------------------------------------------------------+
|                        storo.id                                    |
|                   (Marketing Website)                              |
|                    Repo terpisah                                   |
|              Landing page, pricing, CTA                           |
|              Client portal, onboarding, domain purchase           |
|              Superadmin dashboard (/superadmin/*)                  |
|              Referral system (via sharelink.id)                    |
|              See: storo-platform-PRD.md                           |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|                    SUPABASE (SHARED DB)                            |
|                                                                    |
|  +----------+  +----------+  +----------+  +----------+          |
|  | Store A   |  | Store B   |  | Store C   |  | Store D   |       |
|  | store_id  |  | store_id  |  | store_id  |  | store_id  |       |
|  +----------+  +----------+  +----------+  +----------+          |
|                                                                    |
|  RLS enforces isolation by store_id                               |
|  All tables: products, orders, customers, blog_posts, etc.       |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|                  PER-CLIENT VERCEL DEPLOYMENTS                     |
|                                                                    |
|  +----------------+  +----------------+  +----------------+      |
|  | tokoa.storo.id  |  | tokob.storo.id  |  | tokoc.storo.id |     |
|  | Clone repo A    |  | Clone repo B    |  | Clone repo A   |     |
|  | Template: Modern|  | Template: Clean |  | Template: Modern|    |
|  | STORE_ID=xxx    |  | STORE_ID=yyy    |  | STORE_ID=zzz   |     |
|  +----------------+  +----------------+  +----------------+      |
|                                                                    |
|  Setiap client = 1 repo clone (bisa beda template)                |
|  ENV: Same SUPABASE_URL, unique STORE_ID per deployment           |
|  Domain: namatoko.storo.id or custom domain (via Namecheap)      |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|                  CENTRALIZED SERVICES (VenteraAI)                  |
|                                                                    |
|  +---------------------------------------------+                 |
|  |  PAYMENT GATEWAY (Implemented)               |                 |
|  |                                               |                 |
|  |  Providers: Xendit (primary) + Midtrans       |                 |
|  |  Webhooks: /api/webhooks/xendit & /midtrans   |                 |
|  |  Default: Akun Xendit/Midtrans VenteraAI      |                 |
|  |  Optional: Client bisa switch ke akun sendiri  |                |
|  |                                               |                 |
|  |  Fee: 1% operational (VenteraAI)              |                 |
|  |       + 4% PG fee (pass-through)              |                 |
|  |  = 5% total per transaksi                     |                 |
|  |                                               |                 |
|  |  Disbursement: Manual dari VenteraAI ke client |                |
|  +---------------------------------------------+                 |
|                                                                    |
|  +---------------------------------------------+                 |
|  |  SHIPPING - BITESHIP (Implemented)            |                 |
|  |                                               |                 |
|  |  1 API key milik VenteraAI                    |                 |
|  |  Origin address per-store (dari store settings)|                |
|  |  Real-time ongkir calculation                  |                |
|  |  Support: JNE, SiCepat, AnterAja, J&T, dll    |                |
|  |  Tracking: by waybill number                   |                |
|  +---------------------------------------------+                 |
|                                                                    |
|  +---------------------------------------------+                 |
|  |  DOMAIN - NAMECHEAP API (Planned)             |                 |
|  |                                               |                 |
|  |  Domain search & availability check            |                |
|  |  Purchase on behalf of client                  |                |
|  |  Auto DNS config -> Vercel                     |                |
|  |  See: PRD/storo-platform-PRD.md Section 6     |                |
|  +---------------------------------------------+                 |
+------------------------------------------------------------------+
```

### 3.2 Data Flow

```
Client (Shopee Seller)
  |
  |  Kirim 6 file Excel dari Shopee Seller Center
  |
  v
Engineer VenteraAI
  |
  +-- 1. Clone template repo yang sesuai
  +-- 2. Set ENV: STORE_ID, SUPABASE_URL, domain config
  +-- 3. Upload 6 file Excel via /dashboard/import
  |     +-- mass_update_basic_info.xlsx    -> nama, deskripsi, SKU
  |     +-- mass_update_sales_info.xlsx    -> harga, stok, varian
  |     +-- mass_update_shipping_info.xlsx -> berat, dimensi, kurir
  |     +-- mass_update_media_info.xlsx    -> foto produk & varian
  |     +-- mass_update_dts_info.xlsx      -> kategori, estimasi kirim
  |     +-- mass_republish_items.xlsx      -> status publish/delist
  |
  +-- 4. Konfigurasi store settings:
  |     +-- Nama toko, logo, branding
  |     +-- Banner & promo
  |     +-- Alamat asal toko (untuk ongkir Biteship)
  |     +-- Payment gateway (default VenteraAI / custom client)
  |     +-- Blog posts (manual or via API automation)
  |     +-- Domain: namatoko.storo.id or custom domain
  |
  +-- 5. Deploy ke Vercel
  +-- 6. Set domain di Vercel: namatoko.storo.id
  +-- 7. Handover ke client
        |
        v
Website Client LIVE
  |
  +-- Storefront: Customer bisa browse, order, bayar
  +-- Dashboard: Client bisa lihat orders, update stok, edit produk
  +-- Blog: Client/engineer bisa post content (manual or API)
  +-- Import ulang: Client/engineer bisa re-upload Excel (upsert)
```

---

## 4. TECH STACK

| Component | Technology | Status | Notes |
|-----------|-----------|--------|-------|
| **Framework** | Next.js 16.0.10 (App Router) | Implemented | RSC + Server Actions |
| **UI** | shadcn/ui + Radix UI | Implemented | 82+ components |
| **Styling** | Tailwind CSS 4.1.9 + Framer Motion 12 | Implemented | + PostCSS 8.5 |
| **State** | Zustand 5.0.12 | Implemented | Cart persisted to localStorage |
| **Database** | Supabase (PostgreSQL) | Implemented | 5 migrations applied |
| **Auth** | Clerk | Implemented | Dev bypass active, needs prod enable |
| **Payment** | Xendit (primary) + Midtrans | Implemented | Webhooks functional |
| **Shipping** | Biteship API | Implemented | 11+ couriers, real-time rates |
| **Image Storage** | Supabase Storage | Implemented | Product images bucket |
| **Deployment** | Vercel | Implemented | 1 project per client |
| **Excel Parsing** | xlsx 0.18.5 | Implemented | 6-file Shopee import |
| **Forms** | React Hook Form 7.60 + Zod 3.25 | Implemented | Validation |
| **Charts** | Recharts 2.15.4 | Implemented | Dashboard analytics |
| **Analytics** | Vercel Analytics 1.3.1 | Implemented | Page views tracking |
| **Blog** | Custom CMS + API keys | Implemented | External automation support |
| **Carousel** | Embla Carousel 8.6 | Implemented | Banner slider |
| **Notifications** | Sonner 1.7.4 | Implemented | Toast notifications |

### Changes from v1:
- **RajaOngkir -> Biteship**: Biteship lebih lengkap (multi-courier, tracking, waybill). RajaOngkir kept as legacy fallback (`lib/shipping/rajaongkir.ts`)
- **Self-service -> Agency only**: Tidak ada user registration/build sendiri
- **Per-client DB -> Shared DB**: Satu Supabase untuk semua client, isolasi by store_id
- **Payment centralized**: Default pakai akun VenteraAI, disbursement manual
- **Blog CMS added**: Manual posts + external API automation via API keys (v2.1)
- **Namecheap domain**: Custom domain purchase/management planned (v2.1, see storo-platform-PRD.md)

---

## 5. DATABASE SCHEMA

### 5.1 Multi-Tenant Design

Semua tabel utama punya kolom `store_id` sebagai foreign key ke tabel `stores`.
RLS (Row Level Security) enforce isolasi data per store.

Setiap Vercel deployment punya ENV `STORE_ID` yang menentukan data mana yang diakses.

### 5.2 Migrations Applied

| Migration | Description | Status |
|-----------|-------------|--------|
| `001_initial_schema.sql` | Base tables, enums, RLS policies | Applied |
| `002_shopee_import_and_schema_fixes.sql` | Shopee fields, product_images, product_shipping | Applied |
| `003_dev_permissive_rls.sql` | Permissive RLS for development | Applied (needs prod lockdown) |
| `004_prd_v2_schema_updates.sql` | Banners, promos, disbursements, shipping_origin, payment_config | Applied |
| `005_blog_and_api_keys.sql` | Blog posts, API key management | Applied |

### 5.3 Core Tables

```sql
-- Stores (1 row per client)
stores (
  id UUID PK,
  user_id TEXT NOT NULL,          -- Clerk user ID (engineer atau client)
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,       -- untuk URL: slug.storo.id
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  settings JSONB DEFAULT '{}',    -- branding, theme config
  shipping_origin JSONB,          -- { address, city, postal_code, lat, lng }
  payment_config JSONB,           -- { provider, api_keys, use_platform_default }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Products
products (
  id UUID PK,
  store_id UUID FK -> stores,
  category_id UUID FK -> categories,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  images TEXT[],                    -- array of image URLs
  price DECIMAL(12,2),
  compare_at_price DECIMAL(12,2), -- harga coret
  cost_price DECIMAL(12,2),
  stock INTEGER DEFAULT 0,
  sku TEXT,
  barcode TEXT,
  weight INTEGER,                  -- grams
  dimensions JSONB,               -- { length, width, height } cm
  shopee_item_id TEXT,            -- untuk upsert saat re-import
  import_job_id UUID FK -> import_jobs,
  status product_status DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_digital BOOLEAN DEFAULT false,
  days_to_ship INTEGER,
  is_pre_order BOOLEAN DEFAULT false,
  condition TEXT,                   -- 'new', 'used'
  metadata JSONB,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(store_id, shopee_item_id)
)

-- Product Images (separate table for ordered image management)
product_images (
  id UUID PK,
  product_id UUID FK -> products,
  url TEXT NOT NULL,
  alt TEXT,
  position INTEGER DEFAULT 0,
  is_variant_image BOOLEAN DEFAULT false,
  variant_name TEXT,
  created_at TIMESTAMPTZ
)

-- Product Variants (size, color, dll)
product_variants (
  id UUID PK,
  product_id UUID FK -> products,
  name TEXT NOT NULL,              -- "Merah - XL"
  sku TEXT,
  price DECIMAL(12,2),
  compare_at_price DECIMAL(12,2),
  cost_price DECIMAL(12,2),
  stock INTEGER DEFAULT 0,
  weight INTEGER,
  options JSONB,                   -- { "Warna": "Merah", "Ukuran": "XL" }
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Product Shipping (kurir yang tersedia per produk)
product_shipping (
  id UUID PK,
  product_id UUID FK -> products,
  courier_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  cover_fee BOOLEAN DEFAULT false,
  fee DECIMAL(10,2),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Categories (hierarchical)
categories (
  id UUID PK,
  store_id UUID FK -> stores,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID FK -> categories, -- self-referencing
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Customers
customers (
  id UUID PK,
  store_id UUID FK -> stores,
  clerk_user_id TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  address JSONB,
  metadata JSONB,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Orders
orders (
  id UUID PK,
  store_id UUID FK -> stores,
  customer_id UUID FK -> customers,
  user_id TEXT,                    -- Clerk user ID
  order_number TEXT UNIQUE NOT NULL,
  status order_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'unpaid',
  payment_method TEXT,
  payment_provider TEXT,          -- 'xendit', 'midtrans'
  payment_reference TEXT,         -- ID dari payment gateway
  subtotal DECIMAL(12,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2),
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(12,2),
  currency TEXT DEFAULT 'IDR',
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address JSONB,
  billing_address JSONB,
  shipping_method TEXT,
  shipping_tracking_number TEXT,  -- nomor resi
  notes TEXT,
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Order Items
order_items (
  id UUID PK,
  order_id UUID FK -> orders,
  product_id UUID FK -> products,
  variant_id UUID FK -> product_variants,
  name TEXT NOT NULL,
  variant_name TEXT,
  sku TEXT,
  price DECIMAL(12,2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  image_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)

-- Import Jobs (tracking Shopee import history)
import_jobs (
  id UUID PK,
  store_id UUID FK -> stores,
  type import_job_type DEFAULT 'products',
  status import_job_status DEFAULT 'pending',
  file_url TEXT,
  file_name TEXT,
  files_uploaded JSONB,            -- [{ name, type, storage_path }]
  total_rows INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  imported INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Blog Posts (CMS + external API automation)
blog_posts (
  id UUID PK,
  store_id UUID FK -> stores,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_image_url TEXT,
  author_name TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'draft',     -- 'draft', 'published', 'archived'
  is_featured BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'manual',    -- 'manual', 'api', 'webhook'
  external_id TEXT,                -- for upsert from external sources
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Store API Keys (for blog/content automation)
store_api_keys (
  id UUID PK,
  store_id UUID FK -> stores,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,        -- first 8 chars for display
  permissions TEXT[],              -- ['blog:write', 'blog:read']
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)

-- Store Banners (promo & marketing)
store_banners (
  id UUID PK,
  store_id UUID FK -> stores,
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,                   -- link ke produk/kategori/external
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,         -- scheduled banner
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)

-- Store Promos (diskon & voucher)
store_promos (
  id UUID PK,
  store_id UUID FK -> stores,
  name TEXT NOT NULL,
  code TEXT,                       -- voucher code (optional)
  type TEXT NOT NULL,              -- 'percentage', 'fixed', 'free_shipping'
  value DECIMAL(10,2) NOT NULL,   -- percentage or fixed amount
  min_purchase DECIMAL(12,2),
  max_discount DECIMAL(12,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)

-- Disbursements (tracking pembayaran ke client)
disbursements (
  id UUID PK,
  store_id UUID FK -> stores,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_amount DECIMAL(12,2),     -- total transaksi
  pg_fee DECIMAL(10,2),           -- 4% payment gateway fee
  ops_fee DECIMAL(10,2),          -- 1% operational fee
  net_amount DECIMAL(12,2),       -- yang ditransfer ke client
  status TEXT DEFAULT 'pending',  -- pending, processed, paid
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ
)
```

### 5.4 Enums

```sql
CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived', 'delisted');
CREATE TYPE order_status AS ENUM ('pending', 'awaiting_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'partial', 'refunded');
CREATE TYPE import_job_type AS ENUM ('products', 'categories', 'customers', 'orders');
CREATE TYPE import_job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
```

---

## 6. REVENUE MODEL

### 6.1 Fee Structure

| Fee Type | Amount | Deskripsi |
|----------|--------|-----------|
| **Setup Fee** | Varies by plan | One-time, dibayar di awal |
| **Operational Fee** | 1% per transaksi | Revenue VenteraAI dari setiap order |
| **PG Fee** | ~4% per transaksi | Pass-through ke Xendit/Midtrans |
| **Total Client Fee** | ~5% per transaksi | Jauh lebih murah dari Shopee (10%+) |
| **Domain Purchase** | Varies by TLD | Optional, markup 25-50% dari cost |

Jika client pakai payment gateway sendiri:
- Hanya 1% operational fee ke VenteraAI
- PG fee langsung ke provider client

### 6.2 Pricing Plans

| Plan | Setup Fee | Monthly | Fitur |
|------|-----------|---------|-------|
| **Starter** | Rp 1.500.000 | Rp 250.000 | 1 store, basic template, 500 produk |
| **Business** | Rp 3.500.000 | Rp 500.000 | 1 store, premium template, unlimited produk, promo tools, blog |
| **Enterprise** | Rp 7.500.000 | Rp 1.000.000 | Multi-store, custom template, priority support, API access |

### 6.3 Disbursement Flow

```
Customer bayar order Rp 1.000.000
  |
  +-- Masuk ke akun Xendit VenteraAI
  |
  +-- Xendit fee: ~Rp 40.000 (4%)
  +-- VenteraAI ops fee: Rp 10.000 (1%)
  +-- Net ke client: Rp 950.000
  |
  +-- Disbursement manual (mingguan/bulanan)
     VenteraAI transfer Rp 950.000 ke rekening client
```

Tracking disbursement via tabel `disbursements` di database.

---

## 7. FEATURE REQUIREMENTS

### 7.1 Storefront (Customer-Facing)

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| Homepage dengan banner carousel | P0 | ✅ | Embla Carousel + store_banners |
| Product listing + filter/sort | P0 | ✅ | By category, price, search |
| Product detail + image gallery | P0 | ✅ | Variant selector, zoom, stock indicator |
| Shopping cart | P0 | ✅ | Zustand store, persisted to localStorage |
| Checkout flow (3-step) | P0 | ✅ | Address -> shipping -> payment |
| Shipping cost calculator | P0 | ✅ | Biteship API real-time (11+ couriers) |
| Payment (Xendit/Midtrans) | P0 | ✅ | Redirect flow + webhook callbacks |
| Order confirmation page | P0 | ✅ | Success + pending pages |
| Search produk | P1 | ✅ | /store/search route |
| Promo/voucher code | P1 | ✅ | Apply di checkout, validated server-side |
| Blog (public) | P1 | ✅ | /store/blog listing + detail |
| Category pages | P1 | ✅ | /store/category/[slug] |
| Order tracking | P1 | ⏳ | Public tracking page (API exists) |
| Customer registration | P2 | ⏳ | Clerk-based customer accounts |
| Wishlist | P2 | ⏳ | Saved products |
| Product reviews | P3 | ⏳ | Rating + text |

### 7.2 Admin Dashboard (Client/Engineer)

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| Dashboard overview + stats | P0 | ✅ | Revenue, orders, products, customers |
| Product management CRUD | P0 | ✅ | List, create, edit, delete + variants |
| Shopee Excel import (6 files) | P0 | ✅ | Auto-detect, parse, merge, upsert, image download |
| Order management | P0 | ✅ | List, detail, update status |
| Category management | P0 | ✅ | Hierarchical, sortable |
| Customer list | P1 | ✅ | List with order history + metrics |
| Store settings | P0 | ✅ | Branding, logo |
| Banner management | P1 | ✅ | CRUD banners, scheduling, sortable |
| Promo management | P1 | ✅ | Voucher codes, discounts, date ranges |
| Blog CMS | P1 | ✅ | CRUD posts, draft/published, featured, tags |
| Blog API keys | P1 | ✅ | Generate/revoke keys with permissions |
| Payment config UI | P0 | ✅ | Provider selection + API key input |
| Shipping origin config UI | P0 | ✅ | City, postal code, courier selection |
| Re-import Excel (update) | P1 | ✅ | Upsert by shopee_item_id |
| Payment config backend | P0 | ⏳ | Wire UI to store.payment_config |
| Shipping config backend | P0 | ⏳ | Wire UI to store.shipping_origin |
| Sales reports | P2 | ⏳ | Revenue, top products |
| Disbursement read-only view | P2 | ⏳ | `dashboard/disbursements/page.tsx` — view disbursement history (read-only, admin creates in storo.id superadmin) |

### 7.3 VenteraAI Internal (Superadmin)

**MOVED to storo.id repo** — see `storo-platform-PRD.md §16`.

Superadmin dashboard lives at `/superadmin/*` in the storo.id repo, NOT in storoengine.
storoengine only needs disbursement read-only view (Sprint 7).

| Feature | Lives in | Notes |
|---------|----------|-------|
| Client/store management | storo.id `/superadmin/stores` | All stores, status, engine version |
| Disbursement creation | storo.id `/superadmin/disbursements` | Create, auto-calc, mark paid |
| Disbursement read-only | storoengine `/dashboard/disbursements` | Client/engineer can view their disbursement history |
| Revenue dashboard | storo.id `/superadmin` | Platform KPI overview |
| Client onboarding queue | storo.id `/superadmin/onboarding` | Assign engineer, update status |

---

## 8. API ROUTES

### 8.1 Product Management

| Route | Method | Status | Purpose |
|-------|--------|--------|---------|
| `/api/products` | GET | ✅ | List products (with filters) |
| `/api/products` | POST | ✅ | Create product |
| `/api/products/[id]` | PATCH | ✅ | Update product |
| `/api/products/[id]` | DELETE | ✅ | Delete product |

### 8.2 Categories

| Route | Method | Status | Purpose |
|-------|--------|--------|---------|
| `/api/categories` | GET | ✅ | List categories |
| `/api/categories` | POST | ✅ | Create category |
| `/api/categories/[id]` | PATCH | ✅ | Update category |
| `/api/categories/[id]` | DELETE | ✅ | Delete category |

### 8.3 Orders & Checkout

| Route | Method | Status | Purpose |
|-------|--------|--------|---------|
| `/api/orders` | GET | ✅ | List orders |
| `/api/orders` | POST | ✅ | Create order (admin) |
| `/api/orders/[id]` | PATCH | ✅ | Update order status |
| `/api/checkout` | POST | ✅ | Initiate checkout -> payment URL |
| `/api/webhooks/xendit` | POST | ✅ | Xendit payment callback |
| `/api/webhooks/midtrans` | POST | ✅ | Midtrans payment callback |

### 8.4 Shipping

| Route | Method | Status | Purpose |
|-------|--------|--------|---------|
| `/api/shipping/rates` | POST | ✅ | Biteship rate calculation |
| `/api/shipping/provinces` | GET | ✅ | Indonesia provinces (RajaOngkir legacy) |
| `/api/shipping/cities` | GET | ✅ | Cities by province |
| `/api/shipping/cost` | GET | ✅ | Legacy cost calculation |
| `/api/shipping/tracking` | GET | ✅ | Track shipment by waybill |

### 8.5 Blog & Content

| Route | Method | Status | Purpose |
|-------|--------|--------|---------|
| `/api/blog` | GET | ✅ | List blog posts |
| `/api/blog` | POST | ✅ | Create/update blog post (auth or API key) |
| `/api/blog/[id]` | PATCH | ✅ | Update blog post |
| `/api/blog/[id]` | DELETE | ✅ | Delete blog post |
| `/api/blog/keys` | GET | ✅ | List API keys (store owner) |
| `/api/blog/keys` | POST | ✅ | Generate new API key |
| `/api/blog/keys/[id]` | PATCH | ✅ | Revoke/update API key |

### 8.6 Banners & Promos

| Route | Method | Status | Purpose |
|-------|--------|--------|---------|
| `/api/banners` | GET | ✅ | List active banners |
| `/api/banners` | POST | ✅ | Create banner |
| `/api/banners/[id]` | PATCH | ✅ | Update banner |
| `/api/banners/[id]` | DELETE | ✅ | Delete banner |
| `/api/promos` | GET | ✅ | List promos |
| `/api/promos` | POST | ✅ | Create promo |
| `/api/promos/validate` | POST | ✅ | Validate promo code at checkout |

### 8.7 Store & Dashboard

| Route | Method | Status | Purpose |
|-------|--------|--------|---------|
| `/api/stores` | GET | ✅ | Get current store info |
| `/api/stores` | PATCH | ✅ | Update store info |
| `/api/customers` | GET | ✅ | List customers |
| `/api/dashboard/stats` | GET | ✅ | Dashboard KPI metrics |

### 8.8 Data Import

| Route | Method | Status | Purpose |
|-------|--------|--------|---------|
| `/api/import/shopee` | POST | ✅ | Parse 6 Shopee Excel files -> upsert products |

---

## 9. SHOPEE EXCEL IMPORT

> **CONFIRMED:** Shopee 6-file bulk import is **engineer-only**. Clients do NOT have access to `/dashboard/import`.
> 
> Clients CAN add individual products via a simple form in the **storo.id client dashboard** (`/dashboard/products/new`).
> That form writes directly to shared Supabase with their `store_id`. No import/export needed.

### 9.1 The 6 Files

| File | Parser | Data |
|------|--------|------|
| mass_update_basic_info | `lib/shopee/parsers/basic-info.ts` | Nama, deskripsi, kategori, SKU, status |
| mass_update_sales_info | `lib/shopee/parsers/sales-info.ts` | Harga, stok, varian (per-variant price/stock) |
| mass_update_shipping_info | `lib/shopee/parsers/shipping-info.ts` | Berat, dimensi, kurir, ongkir config |
| mass_update_media_info | `lib/shopee/parsers/media-info.ts` | Cover image, product images (1-8), variant images |
| mass_update_dts_info | `lib/shopee/parsers/dts-info.ts` | Kategori, estimasi kirim, pre-order, kondisi |
| mass_republish_items | `lib/shopee/parsers/republish.ts` | Status publish/delist/delete |

### 9.2 Import Pipeline

```
lib/shopee/parser.ts        -- Main orchestrator
lib/shopee/merger.ts         -- Merge 6 files into unified product objects
lib/shopee/utils.ts          -- Helper functions
lib/shopee/image-downloader.ts -- Download images from Shopee CDN to Supabase Storage
```

### 9.3 Import Flow

1. Engineer buka `/dashboard/import`
2. Drag & drop 6 file Excel
3. System auto-detect tipe file by filename pattern
4. Klik "Mulai Import"
5. Backend parse semua file -> merge by `product_id` (Kode Produk)
6. Upsert products by `shopee_item_id` (prevents duplicates on re-import)
7. Insert images, variants, shipping config
8. Download product images from Shopee CDN
9. Track progress via `import_jobs` table
10. Return summary + errors

### 9.4 Re-Import (Update)

Client bisa export ulang dari Shopee dan re-upload. System akan:
- Update existing products (upsert by shopee_item_id)
- Add new products yang belum ada
- Mark delisted products dari republish file

---

## 10. PAYMENT INTEGRATION

### 10.1 Implementation Status

Both payment providers are fully implemented with webhook handling:

```
lib/payment/index.ts    -- Payment gateway abstraction layer
lib/payment/xendit.ts   -- Xendit API client (invoice creation, webhook verification)
lib/payment/midtrans.ts -- Midtrans Snap client
```

### 10.2 Default Flow (Akun VenteraAI)

```
Customer checkout
  -> Frontend call POST /api/checkout
     Input: store_id, items, customer info, shipping, promo_code
  -> Backend create payment request ke Xendit (akun VenteraAI)
     Output: order_id, payment_url, order_number
  -> Customer redirect ke payment page
  -> Customer bayar
  -> Xendit webhook -> POST /api/webhooks/xendit
  -> Update order status: paid
  -> Redirect to /store/checkout/success
```

### 10.3 Custom PG Flow (Akun Client Sendiri)

```
Store settings: payment_config.use_platform_default = false
Store settings: payment_config.xendit_secret_key = "xnd_..."

Customer checkout
  -> Backend create payment request ke Xendit (akun CLIENT)
  -> Uang masuk langsung ke rekening client
  -> VenteraAI hanya charge 1% ops fee (via invoice bulanan)
```

### 10.4 Payment Config per Store

```jsonc
// stores.payment_config
{
  "use_platform_default": true,     // true = pakai akun VenteraAI
  "provider": "xendit",             // "xendit" atau "midtrans"
  // Hanya diisi jika use_platform_default = false:
  "xendit_secret_key": null,
  "xendit_callback_token": null,
  "midtrans_server_key": null,
  "midtrans_client_key": null
}
```

**Note:** Payment settings UI exists at `/dashboard/settings/payment` but backend wiring to `store.payment_config` is not yet connected. Currently uses ENV variables as fallback.

---

## 11. SHIPPING INTEGRATION (BITESHIP)

### 11.1 Implementation Status

Fully implemented with real-time rate calculation and tracking:

```
lib/shipping/biteship.ts    -- Biteship API client (rates + tracking)
lib/shipping/rajaongkir.ts  -- Legacy RajaOngkir (provinces/cities data)
lib/shipping/couriers.ts    -- Supported couriers list
```

### 11.2 Rate Calculation

```
POST /api/shipping/rates

Request:
{
  "destination_postal_code": "80115",
  "items": [
    { "weight": 500, "length": 20, "width": 15, "height": 10, "quantity": 2 }
  ]
}

Backend:
  -> Read store.shipping_origin -> get origin postal code
  -> Call Biteship API: POST /v1/rates/couriers
  -> Return available couriers + rates

Response:
{
  "couriers": [
    { "name": "JNE REG", "rate": 18000, "etd": "2-3 hari" },
    { "name": "SiCepat REG", "rate": 15000, "etd": "1-2 hari" },
    { "name": "AnterAja", "rate": 14000, "etd": "2-3 hari" }
  ]
}
```

### 11.3 Shipping Origin per Store

```jsonc
// stores.shipping_origin
{
  "address": "Jl. Sudirman No. 123",
  "city": "Jakarta Selatan",
  "province": "DKI Jakarta",
  "postal_code": "12930",
  "contact_name": "Toko ABC",
  "contact_phone": "08123456789"
}
```

**Note:** Shipping settings UI exists at `/dashboard/settings/shipping` but backend wiring to `store.shipping_origin` is not yet connected.

### 11.4 Supported Couriers

Biteship supports 30+ Indonesian couriers including:
JNE, SiCepat, AnterAja, J&T, Ninja Express, Pos Indonesia, TIKI, Wahana,
Lion Parcel, ID Express, SAP Express, GoSend, GrabExpress, dll.

### 11.5 Shipping Calculator Component

`components/store/shipping-calculator.tsx` -- Real-time shipping rate calculator
embedded in product detail page. Customer inputs postal code, sees courier
options with prices & ETAs.

---

## 12. BLOG & CONTENT MANAGEMENT

### 12.1 Overview

Blog CMS built into storoengine for SEO content and store announcements.

### 12.2 Features

| Feature | Status | Notes |
|---------|--------|-------|
| Blog post CRUD | ✅ | Title, slug, excerpt, content, cover image, tags |
| Draft/Published/Archived | ✅ | Status management |
| Featured posts | ✅ | Pin to top of listing |
| Public blog pages | ✅ | /store/blog + /store/blog/[slug] |
| Blog card component | ✅ | For listing page |
| API key management | ✅ | Generate/revoke keys with permissions |
| External API posting | ✅ | POST /api/blog with API key auth |
| Rich text editor | ⏳ | Currently textarea, needs upgrade |
| Image upload for content | ⏳ | Currently URL input only |

### 12.3 API Automation

External tools (e.g. VenteraAI content pipeline) can post blog content via API:

```
POST /api/blog
Headers: { "x-api-key": "storo_..." }
Body: {
  "store_id": "uuid",
  "title": "Tips Memilih Sepatu",
  "slug": "tips-memilih-sepatu",
  "content": "...",
  "status": "published",
  "external_id": "content-pipeline-123"  // for upsert
}
```

API key permissions: `blog:write`, `blog:read`

---

## 13. STORE FEATURES

### 13.1 Banner Management (Implemented)

- Carousel di homepage (Embla Carousel)
- Configurable: image, title, subtitle, link
- Scheduling: start_date & end_date
- Sortable by position
- Dashboard CRUD at `/dashboard/banners`

### 13.2 Promo & Voucher (Implemented)

- Tipe: percentage discount, fixed discount, free shipping
- Voucher code (optional - bisa juga auto-apply)
- Min purchase requirement
- Max discount cap
- Usage limit + tracking
- Active period (start/end date)
- Validation endpoint: `POST /api/promos/validate`
- Dashboard CRUD at `/dashboard/promos`

### 13.3 Standard E-Commerce Features (All Implemented)

- Product categories (hierarchical)
- Product variants (size, color, dll)
- Stock management
- Featured products
- Product tags
- Compare at price (harga coret)
- Order status tracking
- Product image gallery with zoom
- Shopping cart (persisted)
- 3-step checkout flow

---

## 14. CLIENT ONBOARDING CHECKLIST

Engineer workflow saat setup client baru:

```
[ ] 1.  Clone template repo yang sesuai
[ ] 2.  Create store record di Supabase (get STORE_ID)
[ ] 3.  Set ENV variables:
        - STORE_ID & NEXT_PUBLIC_STORE_ID
        - NEXT_PUBLIC_SUPABASE_URL
        - NEXT_PUBLIC_SUPABASE_ANON_KEY
        - SUPABASE_SERVICE_ROLE_KEY
        - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  (storoengine admin auth = Clerk)
        - CLERK_SECRET_KEY
        - BITESHIP_API_KEY (shared VenteraAI key)
        - PAYMENT_PROVIDER + keys (Xendit/Midtrans)
        - NEXT_PUBLIC_APP_URL
        - NEXT_PUBLIC_STORE_NAME
        Note: storo.id client portal uses Supabase Auth (separate). storoengine admin = Clerk.
[ ] 4.  Upload 6 file Excel dari client -> /dashboard/import
[ ] 5.  Verify produk imported correctly (check import_jobs)
[ ] 6.  Configure store settings:
        - Nama toko, logo, banner
        - Alamat asal (shipping origin)
        - Homepage banners
        - Kategori mapping
        - Initial blog posts (optional)
[ ] 7.  Deploy ke Vercel
[ ] 8.  Set domain: namatoko.storo.id
        - If custom domain: configure via Namecheap API
          (see storo-platform-PRD.md Section 6)
[ ] 9.  Test checkout flow:
        - Add to cart -> checkout
        - Shipping rate calculation
        - Payment redirect + webhook
        - Order status update
[ ] 10. Handover ke client (akses dashboard)
```

---

## 15. KEY FILE PATHS

### Application Structure

```
app/
  (store)/                          -- Public storefront
    store/                          -- Homepage
    store/products/                  -- Product listing
    store/products/[slug]/          -- Product detail
    store/category/[slug]/          -- Category page
    store/cart/                     -- Shopping cart
    store/checkout/                 -- Checkout flow
    store/checkout/pending/        -- Payment processing
    store/checkout/success/        -- Order confirmation
    store/blog/                    -- Blog listing
    store/blog/[slug]/             -- Blog post detail
    store/search/                  -- Search results
  (auth)/
    sign-in/[[...sign-in]]/        -- Clerk sign-in
    sign-up/[[...sign-up]]/        -- Clerk sign-up
  (dashboard)/
    dashboard/                     -- Admin overview
    dashboard/products/            -- Product CRUD
    dashboard/products/new/        -- Create product
    dashboard/products/[id]/       -- Edit product
    dashboard/categories/          -- Category management
    dashboard/orders/              -- Order list
    dashboard/orders/[id]/         -- Order detail
    dashboard/customers/           -- Customer list
    dashboard/import/              -- Shopee import
    dashboard/banners/             -- Banner CRUD
    dashboard/promos/              -- Promo CRUD
    dashboard/blog/                -- Blog CMS
    dashboard/blog/keys/           -- API key management
    dashboard/settings/            -- Store settings
    dashboard/settings/payment/    -- Payment config
    dashboard/settings/shipping/   -- Shipping config
  api/                             -- All API routes (see Section 8)

components/
  dashboard/                       -- Dashboard components (sidebar, header, stats, etc.)
  store/                           -- Storefront components (header, footer, product card, etc.)
  ui/                              -- 82+ shadcn/ui components

lib/
  payment/
    index.ts                       -- Payment abstraction layer
    xendit.ts                      -- Xendit client
    midtrans.ts                    -- Midtrans client
  shipping/
    biteship.ts                    -- Biteship client
    rajaongkir.ts                  -- Legacy RajaOngkir
    couriers.ts                    -- Courier list
  shopee/
    parser.ts                      -- Main parser orchestrator
    merger.ts                      -- 6-file data merger
    parsers/                       -- Individual file parsers (6 files)
    image-downloader.ts            -- Shopee CDN image download
    utils.ts                       -- Helpers
  supabase/
    client.ts                      -- Client-side Supabase
    server.ts                      -- Server-side Supabase
    admin.ts                       -- Admin client (service role)
  store/
    config.ts                      -- getStoreId()
    queries.ts                     -- Scoped queries
  auth/
    dev-auth.ts                    -- Dev-only auth bypass (REMOVE for prod)
  format.ts                        -- formatRupiah(), slugify()
  utils.ts                         -- General utilities

stores/
  cart-store.ts                    -- Zustand cart (persisted)

hooks/
  use-store.ts                     -- Store data fetching
  use-toast.ts                     -- Sonner notifications
  use-mobile.ts                    -- Mobile breakpoint

supabase/
  migrations/                      -- 5 migration files
```

---

## 16. MULTI-STORE PER USER

Satu user (Clerk account) bisa punya lebih dari satu toko.

```
User: Pak Budi (clerk_user_id: "user_abc")
  +-- Store 1: sepatubuddy.storo.id (store_id: xxx)
  |    +-- Vercel deployment A (template: modern)
  +-- Store 2: tasbuddy.storo.id (store_id: yyy)
  |    +-- Vercel deployment B (template: clean)
  +-- Store 3: aksesorisbuddy.storo.id (store_id: zzz)
       +-- Vercel deployment C (template: fashion)
```

- Dashboard per-store (switch via store selector atau separate login per deployment)
- Data completely isolated by store_id
- Billing/disbursement per store

---

## 17. DEVELOPMENT PHASES

### Phase 1: Foundation ✅ (Completed)
- [x] Next.js 16 + Tailwind 4 + shadcn/ui setup
- [x] Clerk auth integration
- [x] Supabase schema + migrations (5 applied)
- [x] Dashboard layout + sidebar
- [x] Store layout + header/footer

### Phase 2: Admin Dashboard ✅ (Completed)
- [x] Dashboard overview + stats (Recharts)
- [x] Product CRUD (with variants, images, shipping)
- [x] Order management (list, detail, status update)
- [x] Category management (hierarchical)
- [x] Customer list (with metrics)
- [x] Store settings
- [x] Shopee Excel import (6 files, merge, upsert, image download)

### Phase 3: Storefront ✅ (Completed)
- [x] Homepage + banner carousel (Embla)
- [x] Product listing + filter/sort
- [x] Product detail page + variant selector + image gallery
- [x] Shopping cart (Zustand, persisted)
- [x] Checkout flow (3-step: address -> shipping -> payment)
- [x] Order confirmation + pending pages
- [x] Product search
- [x] Category pages
- [x] Blog listing + detail pages

### Phase 4: Integrations ✅ (Completed)
- [x] Biteship shipping API (rate calculation + tracking)
- [x] Xendit payment (checkout + webhook)
- [x] Midtrans payment (checkout + webhook)
- [x] Banner CRUD di dashboard
- [x] Promo/voucher system (CRUD + validation)
- [x] Blog CMS + API key automation

### Sprint 7: Complete Wiring (storo.id integration)
- [ ] Wire payment config UI → `stores.payment_config` (backend was not connected)
- [ ] Wire shipping origin UI → `stores.shipping_origin` (backend was not connected)
- [ ] Connect store homepage to real Supabase data (`(store)/store/page.tsx`)
- [ ] Connect stats cards to real data (`components/dashboard/stats-cards.tsx`)
- [ ] Connect recent orders to real data (`components/dashboard/recent-orders.tsx`)
- [ ] Disbursement read-only view (`dashboard/disbursements/page.tsx`)

### Sprint 8: Template Versioning
- [ ] Tag v1.0.0 (`git tag v1.0.0`)
- [ ] Version file: `.storo-version` (add to .gitignore of per-client repos)
- [ ] Update check script: `scripts/check-version.sh`
- [ ] Update apply script: `scripts/apply-update.sh`
- [ ] Exclude from updates: `.env.local`, `public/logo*`, `public/favicon*`
- [ ] Superadmin in storo.id shows which stores are behind + one-click update

### Phase X: Production Readiness
- [ ] Enable Clerk middleware in `middleware.ts`
- [ ] Remove dev auth bypass (`lib/auth/dev-auth.ts`)
- [ ] Lock down RLS policies (replace `003_dev_permissive_rls.sql`)
- [ ] Rich text editor for blog content
- [ ] Direct image upload to Supabase Storage
- [ ] SEO optimization (meta, sitemap, structured data)
- [ ] Fix 3 existing TypeScript errors
- [ ] Performance optimization
- [ ] First client deployment

### Future
- [ ] Customer account login & order history
- [ ] Public order tracking page
- [ ] More templates
- [ ] AI features (description enhancement, SEO generation)
- [ ] Customer notifications (email/WhatsApp)
- [ ] Multi-store switcher in dashboard

---

## 18. ENV VARIABLES

### Per-Client Deployment (.env.local)

```env
# Store Identity (unique per client)
STORE_ID=                              # UUID dari tabel stores
NEXT_PUBLIC_STORE_ID=                  # Same as STORE_ID (client-side access)

# Supabase (shared across all clients)
NEXT_PUBLIC_SUPABASE_URL=https://tjcbymvlykvjfvwevang.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Shipping - Biteship (shared VenteraAI key)
BITESHIP_API_KEY=

# Legacy Shipping (optional)
RAJAONGKIR_API_KEY=
RAJAONGKIR_ACCOUNT_TYPE=starter
SHIPPING_ORIGIN_CITY_ID=

# Payment Gateway
PAYMENT_PROVIDER=xendit               # 'xendit' atau 'midtrans'

# Default VenteraAI payment keys
XENDIT_SECRET_KEY=
XENDIT_CALLBACK_TOKEN=
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false

# App
NEXT_PUBLIC_APP_URL=https://namatoko.storo.id
NEXT_PUBLIC_STORE_NAME="Store Name"
```

---

## 19. PRE-PRODUCTION CHECKLIST

Critical items before deploying first client store:

| Item | Priority | Description |
|------|----------|-------------|
| Enable Clerk auth | P0 | Uncomment middleware.ts Clerk protection |
| Remove dev bypass | P0 | Delete `lib/auth/dev-auth.ts` and all references |
| Production RLS | P0 | Replace permissive dev policies with strict store_id isolation |
| Payment backend wiring | P0 | Connect `/dashboard/settings/payment` UI to `store.payment_config` |
| Shipping backend wiring | P0 | Connect `/dashboard/settings/shipping` UI to `store.shipping_origin` |
| Fix TS errors | P1 | 3 known errors in categories, settings, admin client |
| Test full checkout | P0 | End-to-end: cart -> checkout -> payment -> webhook -> order |
| Verify RLS isolation | P0 | Ensure store A cannot see store B data |
| SSL + domain setup | P0 | Vercel domain configuration |
| Webhook URLs | P0 | Configure Xendit/Midtrans webhook URLs per deployment |

---

*Document version: 2.2*
*Last updated: 2026-04-06*
*Author: VenteraAI Engineering*
*Repo (production): PTVENTERA-AI/storoengine (private org)*
*Repo (public mirror): adewap23/storoengine*
*Cross-reference: storo-platform-PRD.md (client portal + superadmin), PLATFORM-BUILD-PLAN.md (master build plan)*
*Related: PRD/storo-platform-PRD.md (client portal & domain management)*
*Next action: Complete Phase 5 (production readiness) -> first client deployment*
