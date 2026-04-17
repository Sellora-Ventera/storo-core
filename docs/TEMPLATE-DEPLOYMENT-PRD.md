# PRD — Template Live Preview Deployment

**Repo:** `storo-id-landingpage`
**Panel:** Superadmin → Templates
**Status:** Draft v1
**Tanggal:** 2026-04-15

---

## 1. Ringkasan

Saat ini superadmin menambah template via form manual di [src/app/(superadmin)/superadmin/templates/page.tsx](../src/app/(superadmin)/superadmin/templates/page.tsx) dengan mengisi `preview_url` dan `demo_url` yang di-host entah di mana. PRD ini mengotomatiskan proses tersebut: superadmin cukup memilih source (repo/branch/tag storoengine), sistem men-deploy ke Vercel dan set DNS di Cloudflare, dan menghasilkan `demo_url` live tanpa intervensi manual.

**Tujuan utama:** setiap template yang tersedia di galeri punya **live demo** yang bisa dijelajahi calon pembeli sebelum memutuskan untuk beli.

## 2. Tujuan & Non-tujuan

### Tujuan
- Superadmin bisa menambah template baru dengan 1x klik "Deploy Preview".
- Setiap template punya subdomain unik `{slug}.preview.storo.id` yang otomatis aktif.
- Demo diisi data dummy (produk contoh, banner contoh) supaya customer dapat gambaran utuh.
- Bisa redeploy kalau source code di repo storoengine berubah (tag baru).
- Bisa takedown preview (destroy Vercel project + hapus DNS record) saat template dinonaktifkan permanen.

### Non-tujuan
- **Bukan** untuk deploy toko client asli. Deployment client tetap manual/flow terpisah.
- **Bukan** sistem theming/variant — 1 template = 1 repo/branch storoengine, bukan konfigurasi runtime.
- Tidak handle custom domain pembeli (`.com`, `.id` pakai Namecheap terpisah).
- Tidak auto-sync data dummy dari sumber eksternal.

## 3. Persona & User Flow

**Aktor:** Superadmin VenteraAI (role `superadmin` di tabel `users`).

### Flow: Tambah Template Baru
```
1. Superadmin buka /superadmin/templates
2. Klik "Tambah Template"
3. Isi form:
   - Nama (cth: "Minimalist Fashion")
   - Slug (auto: "minimalist-fashion", editable)
   - Deskripsi
   - Kategori (fashion, F&B, elektronik, dll)
   - Repo source: default `PTVENTERA-AI/storoengine`
   - Branch/Tag: default `main` (atau pilih tag versi)
   - Harga setup & bulanan (optional, override plan default)
   - Upload thumbnail preview (gambar statis)
4. Klik "Deploy Preview"
5. Sistem jalankan background job:
   a. Insert row ke `templates` dengan status = 'deploying'
   b. Create Vercel project via Vercel API
   c. Set env vars (STORE_ID=preview-{slug}, SUPABASE_*, dll)
   d. Trigger deployment
   e. Create DNS record di Cloudflare (CNAME → cname.vercel-dns.com)
   f. Add domain ke Vercel project
   g. Seed data dummy ke Supabase (store_id=preview-{slug})
   h. Polling status deployment Vercel
   i. Saat READY: update row ke status='live', demo_url='https://{slug}.preview.storo.id'
6. UI tampilkan progress real-time (SSE/polling)
7. Saat selesai: template tampil aktif di galeri
```

### Flow: Redeploy (update template version)
```
1. Superadmin klik "Redeploy" di row template
2. Pilih branch/tag baru
3. Sistem trigger Vercel deployment baru di project existing
4. DNS tidak berubah, hanya build ulang
```

### Flow: Takedown
```
1. Superadmin klik "Hapus" di row template
2. Konfirmasi (template akan hilang dari galeri permanen)
3. Sistem:
   a. Delete Vercel project
   b. Delete DNS record di Cloudflare
   c. Hapus row `templates` (atau soft delete)
   d. Hapus data dummy Supabase dengan store_id=preview-{slug}
```

### Flow Customer (public side)
- [/templates](../src/app/templates/page.tsx) — grid template aktif dengan thumbnail + tombol "Live Demo" (buka `demo_url` di tab baru)
- Step 2 onboarding (`OnboardingWizard.tsx`) — pilih template, tombol preview membuka demo_url

## 4. Arsitektur Integrasi

```
┌──────────────────────────┐
│  /superadmin/templates   │
│  (UI React)              │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ POST /api/superadmin/    │
│      templates/deploy    │
└────────────┬─────────────┘
             │
     ┌───────┼──────────┬───────────────┐
     ▼       ▼          ▼               ▼
┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Vercel  │ │Cloudflare│ │ GitHub   │ │ Supabase │
│ API     │ │ API      │ │ (source) │ │ (dummy)  │
└─────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Vercel
- **Scope:** create project, set env vars, trigger deploy, add domain, get deployment status, delete project.
- **Auth:** Personal/Team access token → env `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID`.
- **Endpoint utama:**
  - `POST /v10/projects` — create project linked to storoengine repo
  - `POST /v10/projects/{id}/env` — bulk set env vars
  - `POST /v13/deployments` — trigger deploy
  - `POST /v10/projects/{id}/domains` — add `{slug}.preview.storo.id`
  - `GET /v13/deployments/{id}` — poll status
  - `DELETE /v9/projects/{id}` — takedown
- **Framework preset:** Next.js (auto-detect).
- **Root directory:** `/` (storoengine adalah root repo).

### Cloudflare
- **Scope:** Zone `storo.id` → create/delete DNS record.
- **Auth:** API Token dengan scope `Zone.DNS:Edit` → env `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`.
- **Endpoint utama:**
  - `POST /zones/{zone_id}/dns_records` — create CNAME `{slug}.preview` → `cname.vercel-dns.com`, proxied=false (supaya Vercel handle SSL sendiri)
  - `DELETE /zones/{zone_id}/dns_records/{id}` — takedown
- **Catatan:** gunakan `proxied=false` supaya Vercel bisa issue SSL cert via Let's Encrypt. Kalau perlu CF proxy (CDN + DDoS), butuh flow SSL "Full Strict" + cert Vercel yang lebih rumit — skip di v1.

### GitHub (Source)
- Vercel sudah punya integrasi native ke GitHub repo (install Vercel GitHub App ke org `PTVENTERA-AI`).
- API `POST /v10/projects` bisa langsung tunjuk `gitRepository.repo` + `gitRepository.type='github'`.
- Tidak perlu kita panggil GitHub API sendiri di v1.

### Supabase (Data Dummy)
- Seeding lewat SQL migration atau REST insert pakai `SUPABASE_SERVICE_ROLE_KEY`.
- Template dummy punya `store_id = 'preview-{slug}'` dengan ~10 produk contoh, 3 kategori, banner, 1 promo.
- Script seeder: `scripts/seed-template-preview.ts` (bisa dipanggil API route).

## 5. Skema Database

### Tabel `templates` — perubahan

Tabel existing (lihat [templates page](../src/app/(superadmin)/superadmin/templates/page.tsx)):
```sql
-- kolom existing:
id uuid
name text
description text
preview_url text       -- thumbnail statis
demo_url text          -- live URL
is_active boolean
created_at timestamptz

-- kolom BARU yang ditambahkan:
slug text unique NOT NULL,           -- dipakai untuk subdomain
category text,                        -- fashion, f&b, elektronik, dll
thumbnail_url text,                   -- gambar thumbnail (Supabase Storage)
source_repo text NOT NULL DEFAULT 'PTVENTERA-AI/storoengine',
source_branch text NOT NULL DEFAULT 'main',
source_commit_sha text,               -- sha terakhir yang ter-deploy

-- Vercel state:
vercel_project_id text,
vercel_deployment_id text,

-- Cloudflare state:
cloudflare_dns_record_id text,

-- Deployment lifecycle:
deploy_status text NOT NULL DEFAULT 'draft',
  -- enum: 'draft' | 'deploying' | 'live' | 'failed' | 'taking_down'
deploy_error text,
deployed_at timestamptz,

-- Pricing override (optional):
price_setup_override numeric,
price_monthly_override numeric,

-- Audit:
created_by uuid references auth.users(id),
updated_at timestamptz
```

Migrasi: `docs/migrations/011_templates_deployment.sql` (storo-id-landingpage, karena tabel `templates` dipakai di repo ini).

### Tabel baru `template_deployment_logs`
Untuk audit & debugging:
```sql
create table template_deployment_logs (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references templates(id) on delete cascade,
  action text,               -- 'create' | 'redeploy' | 'takedown'
  status text,               -- 'started' | 'success' | 'failed'
  vercel_response jsonb,
  cloudflare_response jsonb,
  error_message text,
  created_at timestamptz default now()
);
```

## 6. API Endpoints Baru

Semua di bawah `/api/superadmin/templates/*`, protected via middleware yang cek role superadmin.

| Method | Path | Fungsi |
|---|---|---|
| `POST` | `/api/superadmin/templates/deploy` | Create template + trigger deployment. Body: `{ name, slug, description, category, source_branch, thumbnail, ... }`. Async response dengan `template_id`. |
| `GET` | `/api/superadmin/templates/:id/status` | Poll status deployment (dipakai UI progress). |
| `POST` | `/api/superadmin/templates/:id/redeploy` | Trigger build ulang dengan branch/tag baru. |
| `POST` | `/api/superadmin/templates/:id/takedown` | Destroy Vercel project + delete DNS. |
| `POST` | `/api/superadmin/templates/:id/seed` | Re-seed data dummy (kalau corrupt). |

### Internal helper libs
- `src/lib/integrations/vercel.ts` — wrapper Vercel API (createProject, addDomain, deploy, getStatus, deleteProject)
- `src/lib/integrations/cloudflare.ts` — wrapper CF API (createDnsRecord, deleteDnsRecord)
- `src/lib/template-deployer.ts` — orkestrasi end-to-end (compose kedua wrapper + update DB + handle error)

## 7. UI Superadmin

### Halaman `/superadmin/templates`
Upgrade dari tabel simple saat ini ke:
- **Header:** tombol "Tambah Template" (buka modal/sheet, bukan inline form seperti sekarang)
- **Grid/list view:** thumbnail + nama + kategori + status badge (draft / deploying / live / failed) + harga
- **Actions per template:**
  - Buka demo (external link)
  - Edit detail (nama, deskripsi, kategori, harga)
  - Redeploy (pilih branch/tag baru)
  - Toggle aktif (is_active) — mengontrol apakah tampil di galeri customer
  - Takedown (destroy) — konfirmasi 2x

### Modal "Tambah Template"
Form dengan field yang dijelaskan di Flow §3. Saat submit:
- UI masuk mode "deploying" dengan progress steps:
  ```
  ✓ Validasi input
  ⏳ Membuat Vercel project
  ⏳ Set environment variables
  ⏳ Set DNS record Cloudflare
  ⏳ Trigger deployment
  ⏳ Menunggu build selesai
  ⏳ Seeding data dummy
  ```
- Update via polling `GET /api/superadmin/templates/:id/status` setiap 3 detik.
- Kalau gagal di tengah: tampilkan error detail + tombol "Coba lagi" (resume dari step yang gagal) atau "Batalkan" (rollback semua).

### Sistem desain
- Ikuti sistem desain superadmin: primary `slate-900`, accent `#4169df`, font Inter.
- Ikon: Lucide React (Plus, Rocket, RefreshCw, Trash2, ExternalLink, CheckCircle, AlertCircle, Loader2).
- Semua tombol `cursor-pointer`. Transisi 150-300ms.

## 8. Environment Variables Baru

Tambahkan ke `.env.local` dan Vercel project storo-id-landingpage:

```bash
# Vercel API
VERCEL_API_TOKEN=xxx
VERCEL_TEAM_ID=team_xxx          # optional, untuk personal account kosongi

# Cloudflare API
CLOUDFLARE_API_TOKEN=xxx
CLOUDFLARE_ZONE_ID=xxx           # zone id untuk storo.id

# Preview domain config
PREVIEW_DOMAIN_SUFFIX=preview.storo.id
PREVIEW_STORE_ID_PREFIX=preview-

# Source repo default
STOROENGINE_REPO=PTVENTERA-AI/storoengine
```

## 9. Error Handling & Edge Cases

| Skenario | Behavior |
|---|---|
| Vercel create project berhasil, DNS gagal | Simpan `vercel_project_id` ke DB, status `failed` dengan error jelas, sediakan tombol "Lanjutkan DNS". |
| Deployment Vercel gagal build (misal TS error di storoengine tag tertentu) | Status `failed`, tampilkan link ke log Vercel. Tombol rollback. |
| Slug duplikat | Validasi sebelum submit, error 400 inline. |
| DNS record sudah ada (manual) | Detect saat create, kalau record existing point ke Vercel yang sama → treat as success. Kalau beda → error. |
| Takedown tapi Vercel project sudah dihapus manual | Treat 404 dari Vercel sebagai success, lanjut hapus DNS + DB. |
| SSL belum ready saat DNS sudah set (Vercel butuh ~1 menit provisioning cert) | UI tampilkan "Live, SSL provisioning" selama 2 menit pertama. |
| Rate limit Vercel/Cloudflare | Retry dengan exponential backoff, max 3x. |
| Superadmin tutup browser saat deployment | Proses lanjut di background (API route bukan client-driven). UI next kali buka sudah bisa lihat statusnya. |

## 10. Security & Permissions

- Semua endpoint `/api/superadmin/templates/*` wajib cek role `superadmin` (pakai middleware existing atau DAL helper).
- API tokens Vercel/Cloudflare **tidak pernah** dikirim ke client. Semua panggilan via server route.
- RLS `templates`: SELECT untuk semua user (supaya galeri publik bisa baca `is_active=true`), INSERT/UPDATE/DELETE hanya superadmin.
- Log deployment disimpan lengkap (termasuk response JSON) untuk audit.

## 11. Rollout & Testing

### Fase 1 — MVP (v1.0)
- UI tambah + deploy + redeploy + takedown
- Vercel + Cloudflare integrasi
- Polling status (tanpa realtime/SSE dulu)
- Satu template seed untuk testing

### Fase 2 — Polish (v1.1)
- Realtime status via Supabase Realtime channel
- Resume failed deployment per step
- Auto-seed data dummy via seeder script
- Thumbnail upload ke Supabase Storage

### Fase 3 — Future
- A/B variant per template (misal: palette berbeda)
- Analytics preview (berapa kali demo dibuka, CTR ke pricing)
- Auto-expire preview yang tidak pernah dibeli setelah N hari (hemat Vercel project)

### Testing checklist
- [ ] Create template baru → DNS aktif → SSL valid → demo bisa dibuka
- [ ] Redeploy dengan tag baru → build baru → DNS tidak berubah
- [ ] Takedown → project Vercel hilang, DNS hilang, row DB hilang
- [ ] Rollback saat gagal di step tengah
- [ ] Cek galeri customer `/templates` hanya tampilkan template `is_active=true` dan `deploy_status='live'`
- [ ] Cek onboarding step 2 — tombol preview buka demo_url yang benar

## 12. Open Questions

1. **Storage thumbnail:** Supabase Storage atau upload langsung ke Vercel Blob? (rekomendasi: Supabase Storage, sudah dipakai di repo).
2. **Batas jumlah preview aktif:** perlu hard limit (misal max 20) supaya tidak membengkak di Vercel hobby plan? Vercel Pro allow ~100 projects per team.
3. **Shared Supabase vs Supabase terpisah untuk preview:** tetap pakai Supabase produksi dengan `store_id='preview-*'` atau instance Supabase khusus preview? (rekomendasi: shared, lebih simple; RLS sudah memisahkan).
4. **Cloudflare proxy (orange cloud):** di v1 pakai DNS-only (grey cloud). Upgrade ke proxied butuh SSL mode "Full Strict" + cert custom. Prioritaskan nanti kalau DDoS jadi masalah.
5. **Preview expiry:** otomatis takedown preview template yang `is_active=false` selama N hari, atau manual saja?

---

## Catatan untuk Implementasi

Urutan kerja yang disarankan:
1. Migrasi DB (tabel `templates` + `template_deployment_logs`)
2. Wrapper `lib/integrations/vercel.ts` dan `cloudflare.ts` + unit test dengan mock
3. Orkestrator `lib/template-deployer.ts`
4. API routes
5. UI superadmin upgrade
6. Seeder data dummy
7. Customer-facing: update galeri `/templates` dan onboarding step 2 supaya pakai data dari DB dengan filter `is_active=true AND deploy_status='live'`
