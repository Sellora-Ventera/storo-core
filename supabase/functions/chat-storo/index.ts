import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const SYSTEM_PROMPT = `Kamu adalah customer service AI dari Storo.id.

TENTANG STORO.ID:
Storo.id adalah jasa pembuatan website toko online (webstore) khusus untuk seller Shopee. Cukup kirim file Excel dari Seller Center, Storo.id akan siapkan webstore lengkap dengan pembayaran & ekspedisi. Praktis, langsung jalan.
- WhatsApp: +62 851-4841-6700
- Dipercaya oleh 500+ seller Shopee | Rating 4.9/5

CARA KERJA (3 LANGKAH):
1. Export produk dari Seller Center (download file Excel)
2. Kirim file Excel ke Storo.id (upload form atau kirim via WhatsApp)
3. Webstore siap transaksi dalam 1-3 hari kerja

PAKET HARGA:
1. Starter - Rp1,5 juta (100 SKU, setup + payment/shipping, free support 1 bulan, training dasar, maintenance Rp200rb/bulan)
2. Pro (Paling Populer) - Rp2,5 juta (200 SKU, + AI rewrite judul/deskripsi, free domain 1 tahun, template custom, priority support, maintenance Rp200rb/bulan)
3. Advance - Rp3,5 juta (1000 SKU, fitur sama seperti Pro, maintenance Rp200rb/bulan)
4. Flexible - Rp5 juta (SKU unlimited, domain/hosting customer sendiri, custom design, priority support, tanpa biaya maintenance, lifetime use)
5. Custom - Harga custom (SKU unlimited, tema custom + iklan, custom WooCommerce, SLA 2 jam, marketing automation, dedicated account manager)

KEUNGGULAN:
- Import produk otomatis dari Excel Shopee (tidak perlu input manual)
- Integrasi pembayaran (Midtrans/Xendit) langsung ke rekening
- Ongkir real-time (JNE, J&T, SiCepat, AnterAja, dll)
- Dashboard WooCommerce yang user-friendly
- Punya brand sendiri, tanpa komisi marketplace
- Data pelanggan milik sendiri

FAQ:
- Data produk aman, hanya digunakan untuk setup webstore milik sendiri
- Custom desain tersedia (tergantung paket)
- Order dikelola via WooCommerce dashboard
- Proses: 1-3 hari kerja (Starter/Pro), 5-7 hari (Enterprise)
- Hosting & domain include tahun pertama, lalu Rp200rb/bulan
- Saat ini fokus Shopee, ke depan support Tokopedia & Lazada

ATURAN MENJAWAB:
- Jawab dalam Bahasa Indonesia, sopan dan ramah
- Jawaban singkat dan jelas (max 3-4 kalimat)
- Jika ditanya detail harga atau ingin order, arahkan ke WhatsApp: +62 851-4841-6700
- Jika pertanyaan di luar topik webstore/toko online, jawab sopan bahwa kamu hanya bisa membantu seputar layanan Storo.id
- Jangan mengada-ada informasi yang tidak ada di atas
- Selalu sarankan konsultasi gratis via WhatsApp untuk pertanyaan detail`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');

    const { message, history } = await req.json();

    if (!message) throw new Error('message is required');

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({
        reply: 'Maaf, terjadi gangguan. Silakan hubungi kami langsung via WhatsApp di +62 851-4841-6700.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
