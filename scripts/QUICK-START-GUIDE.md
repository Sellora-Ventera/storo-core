# 🚀 Quick Start Guide - Generate Marketing Materials

Panduan singkat untuk langsung generate PDF dan banner marketing Storo.id

## ⚡ Generate PDF Catalog (1 menit)

### Cara Tercepat:

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Buka browser**: http://localhost:5173

3. **Scroll ke section Pricing**

4. **Klik tombol "Download Katalog"** di bawah pricing section

5. **Done!** PDF 8 halaman akan langsung terdownload

---

## 🎨 Generate Banner JPG (5 menit)

### Cara Termudah:

1. **Buka file banner di browser**:
   - Navigate ke: `scripts/generate-banners.html`
   - Atau double-click file tersebut
   - Browser akan otomatis open

2. **Screenshot setiap banner**:

   **Windows**:
   - Tekan `Windows + Shift + S`
   - Select area banner
   - Paste ke Paint → Save as JPG

   **Mac**:
   - Tekan `Cmd + Shift + 4`
   - Drag select banner area
   - Screenshot saved automatically

3. **Naming convention**:
   - `storo-banner-1-paket-pro.jpg`
   - `storo-banner-2-comparison.jpg`
   - `storo-banner-3-whatsapp-story.jpg`
   - `storo-banner-4-faq.jpg`
   - `storo-banner-5-promo.jpg`

4. **Done!** 5 banner siap untuk marketing

---

## 📱 Langsung Kirim ke WhatsApp

### Template Message untuk Customer:

**Pembuka (dengan Banner 1)**:
```
Halo! 👋

Kenalan dulu, kami dari Storo.id - specialist bikin webstore profesional untuk seller marketplace.

Ini paket PALING POPULER kami:
[Attach: storo-banner-1-paket-pro.jpg]

Minat tau lebih lanjut? 😊
```

**Detail Info (dengan PDF)**:
```
Ini katalog lengkap semua paket kami dalam bentuk PDF ya.

Ada 5 paket yang bisa disesuaikan dengan kebutuhan bisnis kamu:
✅ Starter - Mulai dari Rp1,5 juta
✅ Pro - Rp2,5 juta (PALING LARIS!)
✅ Advance - Rp3,5 juta
✅ Flexible - Rp5 juta
✅ Custom - Sesuai kebutuhan

[Attach: Storo-Pricing-Catalog.pdf]

Mau konsultasi gratis dulu? 💬
```

**FAQ (dengan Banner 4)**:
```
Biar lebih jelas, ini jawaban pertanyaan yang sering ditanya:

[Attach: storo-banner-4-faq.jpg]

Ada pertanyaan lain? Langsung tanya aja! 😊
```

---

## 📊 Output Summary

Setelah selesai, kamu akan punya:

### 1 File PDF:
- ✅ `Storo-Pricing-Catalog.pdf` (8 halaman)

### 5 File JPG:
- ✅ `storo-banner-1-paket-pro.jpg` (1080x1080)
- ✅ `storo-banner-2-comparison.jpg` (1200x1600)
- ✅ `storo-banner-3-whatsapp-story.jpg` (1080x1920)
- ✅ `storo-banner-4-faq.jpg` (1080x1920)
- ✅ `storo-banner-5-promo.jpg` (1080x1080)

---

## 💾 Recommended Folder Structure

```
marketing-materials/
├── pdf/
│   └── Storo-Pricing-Catalog.pdf
├── banners/
│   ├── instagram/
│   │   ├── storo-banner-1-paket-pro.jpg (post)
│   │   └── storo-banner-5-promo.jpg (post)
│   ├── whatsapp/
│   │   ├── storo-banner-1-paket-pro.jpg
│   │   ├── storo-banner-2-comparison.jpg
│   │   └── storo-banner-4-faq.jpg
│   └── stories/
│       ├── storo-banner-3-whatsapp-story.jpg
│       └── storo-banner-4-faq.jpg
└── templates/
    └── whatsapp-messages.txt
```

---

## 🎯 Next Steps

1. **Generate materials** (done ✅)
2. **Organize files** dalam folder structure
3. **Test kirim** ke 1-2 customer
4. **Collect feedback**
5. **Iterate & improve**
6. **Scale up** marketing campaign

---

## 🆘 Need Help?

**Error saat generate?**
- Check `scripts/MARKETING-MATERIALS-README.md` untuk troubleshooting

**Mau customize?**
- Edit files di `src/components/` dan `scripts/`

**Questions?**
- WhatsApp: +62 856-4748-6700
- Email: info@storo.id

---

**Total Time**: ~10 menit untuk generate semua materials
**Difficulty**: Easy ⭐
**Result**: Professional marketing materials ready to use! 🎉
