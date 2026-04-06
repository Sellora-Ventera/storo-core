# 📄 Marketing Materials Generator

Panduan lengkap untuk generate PDF dan banner marketing untuk Storo.id

## 📦 File yang Tersedia

### 1. **Comprehensive Pricing PDF** (8 halaman)
- **File**: `src/components/ComprehensiveCatalogPDF.tsx`
- **Konten**:
  - Cover page dengan branding
  - Tentang Storo.id & value proposition
  - Detail semua 5 paket (Starter, Pro, Advance, Flexible, Custom)
  - Tabel perbandingan paket
  - Layanan tambahan & proses pemesanan
  - FAQ lengkap
  - Back cover dengan CTA

### 2. **Marketing Banners HTML** (5 banner designs)
- **File**: `scripts/generate-banners.html`
- **Banner 1**: Paket Pro Highlight (1080x1080px) - Instagram/WhatsApp Post
- **Banner 2**: Perbandingan Paket (1200x1600px) - Detail comparison
- **Banner 3**: WhatsApp Story Ready (1080x1920px) - Full info banner
- **Banner 4**: FAQ Quick Reference (1080x1920px) - Customer FAQ
- **Banner 5**: Promo/CTA Banner (1080x1080px) - Special promotion

## 🚀 Cara Generate PDF

### Opsi 1: Menggunakan Website (Recommended)

1. Buka file `src/components/DownloadCatalog.tsx` untuk melihat implementasi
2. PDF akan ter-generate otomatis saat user klik tombol "Download Katalog" di website
3. File akan didownload sebagai `Storo-Pricing-Catalog.pdf`

### Opsi 2: Generate Manual via Script

```bash
# Install dependencies jika belum
npm install

# Run script generator (coming soon - butuh setup Node.js script)
node scripts/generate-marketing-materials.js
```

**Note**: Script `generate-marketing-materials.js` butuh sedikit modifikasi untuk bisa run standalone. Untuk saat ini, lebih mudah generate via website.

### Opsi 3: Generate via Browser Console

1. Buka website development: `npm run dev`
2. Navigate ke halaman pricing
3. Klik tombol "Download Katalog"
4. PDF akan ter-download otomatis

## 🎨 Cara Generate Banners (JPG)

### Metode 1: Screenshot Manual (Paling Mudah)

1. Buka file `scripts/generate-banners.html` di browser (Chrome/Firefox)
2. Scroll ke banner yang ingin di-screenshot
3. Gunakan Windows Snipping Tool:
   - Tekan `Windows + Shift + S`
   - Select area banner
   - Paste ke Paint/Photoshop
   - Save as JPG

4. Atau gunakan browser DevTools:
   - Klik kanan pada banner → "Inspect Element"
   - Klik kanan pada element `<div class="banner">` → "Capture node screenshot"
   - Browser akan download PNG, convert ke JPG jika perlu

### Metode 2: Browser Extension (Otomatis)

1. Install extension "GoFullPage" atau "Full Page Screen Capture"
2. Buka `scripts/generate-banners.html`
3. Klik extension icon
4. Screenshot akan ter-download otomatis

### Metode 3: Puppeteer Script (Advanced)

Jika ingin fully automated, bisa gunakan Puppeteer:

```bash
npm install puppeteer

# Create script to screenshot HTML elements
# Convert to JPG using sharp or jimp
```

## 📱 Banner Specifications

| Banner | Size | Format | Use Case |
|--------|------|--------|----------|
| Paket Pro Highlight | 1080x1080px | JPG | Instagram Post, WhatsApp Blast |
| Perbandingan Paket | 1200x1600px | JPG | WhatsApp Detail Info |
| WhatsApp Story | 1080x1920px | JPG | Instagram/WhatsApp Story |
| FAQ Reference | 1080x1920px | JPG | Customer Information |
| Promo CTA | 1080x1080px | JPG | Marketing Campaign |

## 💡 Tips Penggunaan untuk Marketing

### WhatsApp Marketing

1. **Banner 1 (Paket Pro)**: Kirim sebagai pembuka conversation
   - "Halo! Ini paket paling populer kami 👇"
   - Attach banner 1

2. **Banner 2 (Comparison)**: Kirim saat customer minta detail
   - "Ini perbandingan lengkap semua paket kami:"
   - Attach banner 2

3. **Banner 3 (Full Info)**: Kirim sebagai company profile
   - "Tentang Storo.id dan layanan kami:"
   - Attach banner 3

4. **Banner 4 (FAQ)**: Kirim saat customer punya banyak pertanyaan
   - "Berikut jawaban pertanyaan yang sering ditanya:"
   - Attach banner 4

5. **Banner 5 (Promo)**: Kirim saat ada campaign khusus
   - "Promo spesial bulan ini! 🎉"
   - Attach banner 5

6. **PDF Catalog**: Kirim untuk customer yang serius
   - "Ini katalog lengkap kami dalam bentuk PDF:"
   - Attach PDF (8 halaman)

### Instagram Marketing

- **Feed Post**: Banner 1 & 5 (square format 1:1)
- **Story**: Banner 3 & 4 (vertical format 9:16)
- **Carousel**: Bisa breakdown banner 2 jadi multiple slides

### Email Marketing

- Attach PDF sebagai lead magnet
- Use banner images dalam email body
- CTA button ke WhatsApp

## 🎯 Conversion Flow Recommendation

```
Customer Journey:
1. See Banner 5 (Promo) → Interested
2. Receive Banner 1 (Pro Package) → Understand value
3. Ask questions → Send Banner 4 (FAQ)
4. Want more details → Send PDF Catalog
5. Compare packages → Send Banner 2 (Comparison)
6. Ready to order → Direct WhatsApp chat

Alternative:
1. See Banner 3 (Full Info) → Company awareness
2. Want to know pricing → Send Banner 2 (Comparison)
3. Interested in specific package → Send PDF page screenshot
4. Questions → Send Banner 4 (FAQ)
5. Convert → WhatsApp order
```

## 📝 Customization

### Untuk Update Pricing:

1. Edit `src/components/Pricing.tsx` (website component)
2. Edit `src/components/ComprehensiveCatalogPDF.tsx` (PDF component)
3. Edit `scripts/generate-banners.html` (banner templates)
4. Re-generate semua materials

### Untuk Update Branding:

1. Replace colors di styles (primary: #6366f1, secondary: #10b981)
2. Update contact info (WhatsApp, email, website)
3. Add/update logo images

## 🔧 Troubleshooting

### PDF tidak ter-generate?
- Check browser console untuk error
- Pastikan `@react-pdf/renderer` sudah installed
- Try refresh page dan click download lagi

### Banner tidak screenshot dengan benar?
- Zoom browser ke 100%
- Use Incognito mode untuk hasil bersih
- Export dari DevTools untuk pixel-perfect result

### Kualitas JPG rendah?
- Screenshot di resolusi tinggi (200% zoom)
- Use PNG dulu, lalu convert ke JPG dengan quality 90%
- Edit di Photoshop/Figma untuk hasil optimal

## 📞 Support

Jika ada pertanyaan tentang marketing materials:
- WhatsApp: +62 856-4748-6700
- Email: info@storo.id

---

**Created by**: Claude Code
**Last Updated**: 2025-11-12
**Version**: 1.0
