-- ============================================================
-- Seeder: data dummy Komunikasi (Pesan, Notifikasi, Leads)
-- untuk akun wahyu.ventera@gmail.com
-- ============================================================
--
-- Run di Supabase SQL Editor. Idempotent — skip kalau data dengan
-- email/title yang sama sudah ada. Insert untuk SEMUA toko milik
-- wahyu.ventera@gmail.com.
--
-- Prasyarat:
--   - Migrasi 20260520000006 (custom_domain) sudah jalan
--   - Migrasi 20260520000007 (leads.store_id) sudah jalan
--   - store_messages & store_notifications table sudah ada (storoengine)
-- ============================================================

-- 1. Resolve target stores (semua toko milik wahyu.ventera@gmail.com)
WITH target_stores AS (
  SELECT s.id, s.name, s.slug
  FROM public.stores s
  JOIN public.clients c ON c.id = s.client_id
  JOIN auth.users u ON u.id::text = c.user_id
  WHERE u.email = 'wahyu.ventera@gmail.com'
)
SELECT 'Target stores untuk seeding:' AS info, COUNT(*) AS n FROM target_stores;

-- ============================================================
-- 2. SEEDER: store_messages
-- ============================================================
INSERT INTO public.store_messages
  (store_id, customer_name, customer_email, customer_phone, product_name, message, is_read, created_at)
SELECT s.id, m.customer_name, m.customer_email, m.customer_phone, m.product_name, m.message, m.is_read, m.created_at
FROM (
  SELECT s.id
  FROM public.stores s
  JOIN public.clients c ON c.id = s.client_id
  JOIN auth.users u ON u.id::text = c.user_id
  WHERE u.email = 'wahyu.ventera@gmail.com'
) s
CROSS JOIN (VALUES
  ('Andi Wijaya',     'andi.wijaya@gmail.com',    '081234567890', 'Pet Glider Cage Premium',  'Halo, apakah produk ini masih ready stock?',                                                FALSE, NOW() - INTERVAL '2 hour'),
  ('Siti Nurhaliza',  'siti.nh@yahoo.com',        '085678901234', NULL,                       'Mau tanya, ongkos kirim ke Bandung berapa ya?',                                             FALSE, NOW() - INTERVAL '5 hour'),
  ('Budi Santoso',    'budi.s@hotmail.com',       NULL,           'Vitamin Glider 30ml',      'Apakah ada diskon kalau beli paket?',                                                       TRUE,  NOW() - INTERVAL '1 day'),
  ('Rina Permata',    'rina.permata@gmail.com',   '087812345678', NULL,                       'Pesanan saya order #ADW-001 belum dikirim. Bisa dicek?',                                    FALSE, NOW() - INTERVAL '3 hour'),
  ('Dewi Lestari',    'dewi.lestari@outlook.com', '081298765432', 'Kandang Glider Mini',      'Berapa lama estimasi pengiriman ke Jakarta?',                                               TRUE,  NOW() - INTERVAL '2 day'),
  ('Hendra Kusuma',   'hendra.k@gmail.com',       NULL,           NULL,                       'Saya mau jadi reseller. Bagaimana caranya?',                                                FALSE, NOW() - INTERVAL '6 hour'),
  ('Maya Anggraini',  'maya.ag@gmail.com',        '085411223344', 'Makanan Glider Organic',   'Produknya bagus banget, mau beli lagi 5pcs. Bisa nego harga?',                              TRUE,  NOW() - INTERVAL '5 day')
) AS m(customer_name, customer_email, customer_phone, product_name, message, is_read, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.store_messages sm
  WHERE sm.store_id = s.id AND sm.customer_email = m.customer_email AND sm.message = m.message
);

-- ============================================================
-- 3. SEEDER: store_notifications
-- ============================================================
INSERT INTO public.store_notifications
  (store_id, type, title, body, metadata, is_read, created_at)
SELECT s.id, n.type, n.title, n.body, n.metadata, n.is_read, n.created_at
FROM (
  SELECT s.id
  FROM public.stores s
  JOIN public.clients c ON c.id = s.client_id
  JOIN auth.users u ON u.id::text = c.user_id
  WHERE u.email = 'wahyu.ventera@gmail.com'
) s
CROSS JOIN (VALUES
  ('order_paid',        'Pesanan Baru #ADW-1001',              'Andi Wijaya membeli Pet Glider Cage Premium senilai Rp 850.000',     '{"order_number":"ADW-1001","amount":850000,"customer":"Andi Wijaya"}'::jsonb,            FALSE, NOW() - INTERVAL '30 minute'),
  ('order_paid',        'Pesanan Baru #ADW-1002',              'Rina Permata membeli 2 produk senilai Rp 425.000',                   '{"order_number":"ADW-1002","amount":425000,"customer":"Rina Permata"}'::jsonb,           FALSE, NOW() - INTERVAL '2 hour'),
  ('customer_message',  'Pesan Baru dari Customer',            'Siti Nurhaliza mengirim pesan tentang ongkos kirim',                 '{"customer_name":"Siti Nurhaliza"}'::jsonb,                                              FALSE, NOW() - INTERVAL '5 hour'),
  ('order_paid',        'Pesanan Baru #ADW-1000',              'Budi Santoso membeli Vitamin Glider 30ml senilai Rp 125.000',        '{"order_number":"ADW-1000","amount":125000,"customer":"Budi Santoso"}'::jsonb,           TRUE,  NOW() - INTERVAL '1 day'),
  ('order_cancelled',   'Pesanan Dibatalkan #ADW-0999',        'Pesanan dibatalkan oleh customer Maya Anggraini',                    '{"order_number":"ADW-0999","customer":"Maya Anggraini","reason":"Customer request"}'::jsonb, TRUE,  NOW() - INTERVAL '2 day'),
  ('customer_message',  'Pesan Baru dari Customer',            'Hendra Kusuma menanyakan tentang program reseller',                  '{"customer_name":"Hendra Kusuma"}'::jsonb,                                               FALSE, NOW() - INTERVAL '6 hour'),
  ('order_paid',        'Pesanan Baru #ADW-0995',              'Dewi Lestari membeli Kandang Glider Mini senilai Rp 320.000',        '{"order_number":"ADW-0995","amount":320000,"customer":"Dewi Lestari"}'::jsonb,           TRUE,  NOW() - INTERVAL '3 day')
) AS n(type, title, body, metadata, is_read, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.store_notifications sn
  WHERE sn.store_id = s.id AND sn.title = n.title AND sn.body = n.body
);

-- ============================================================
-- 4. SEEDER: leads
-- ============================================================
INSERT INTO public.leads
  (store_id, email, name, phone, source, domain, project, metadata, created_at)
SELECT s.id, l.email, l.name, l.phone, l.source, COALESCE(s.slug || '.storo.id', 'unknown'), 'storo-store', l.metadata, l.created_at
FROM (
  SELECT s.id, s.slug
  FROM public.stores s
  JOIN public.clients c ON c.id = s.client_id
  JOIN auth.users u ON u.id::text = c.user_id
  WHERE u.email = 'wahyu.ventera@gmail.com'
) s
CROSS JOIN (VALUES
  ('newsletter1@gmail.com',  'Putri Ayu',      '081234560001', 'newsletter-popup', '{"page":"/"}'::jsonb,           NOW() - INTERVAL '1 hour'),
  ('newsletter2@gmail.com',  'Joko Susilo',    '081234560002', 'exit-intent',      '{"page":"/products"}'::jsonb,   NOW() - INTERVAL '4 hour'),
  ('lead3@yahoo.com',        'Anita Sari',     NULL,           'contact-form',     '{"interest":"reseller"}'::jsonb, NOW() - INTERVAL '8 hour'),
  ('lead4@outlook.com',      'Ridwan Kamil',   '085812345670', 'footer-form',      '{}'::jsonb,                     NOW() - INTERVAL '1 day'),
  ('lead5@gmail.com',        'Tika Rahmawati', '081298765001', 'newsletter-popup', '{"page":"/about"}'::jsonb,      NOW() - INTERVAL '2 day'),
  ('lead6@hotmail.com',      'Fajar Pratama',  NULL,           'exit-intent',      '{"page":"/checkout"}'::jsonb,   NOW() - INTERVAL '3 day'),
  ('lead7@gmail.com',        'Lisa Hartono',   '085599887766', 'contact-form',     '{"interest":"product"}'::jsonb, NOW() - INTERVAL '5 day'),
  ('lead8@yahoo.co.id',      'Eko Prabowo',    '081234560008', 'newsletter-popup', '{}'::jsonb,                     NOW() - INTERVAL '6 day')
) AS l(email, name, phone, source, metadata, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.leads ll
  WHERE ll.store_id = s.id AND ll.email = l.email
);

-- ============================================================
-- 5. Verifikasi hasil
-- ============================================================
SELECT
  'store_messages' AS table_name,
  COUNT(*) AS rows_for_user
FROM public.store_messages sm
JOIN public.stores s ON s.id = sm.store_id
JOIN public.clients c ON c.id = s.client_id
JOIN auth.users u ON u.id::text = c.user_id
WHERE u.email = 'wahyu.ventera@gmail.com'

UNION ALL

SELECT
  'store_notifications',
  COUNT(*)
FROM public.store_notifications sn
JOIN public.stores s ON s.id = sn.store_id
JOIN public.clients c ON c.id = s.client_id
JOIN auth.users u ON u.id::text = c.user_id
WHERE u.email = 'wahyu.ventera@gmail.com'

UNION ALL

SELECT
  'leads',
  COUNT(*)
FROM public.leads l
JOIN public.stores s ON s.id = l.store_id
JOIN public.clients c ON c.id = s.client_id
JOIN auth.users u ON u.id::text = c.user_id
WHERE u.email = 'wahyu.ventera@gmail.com';
