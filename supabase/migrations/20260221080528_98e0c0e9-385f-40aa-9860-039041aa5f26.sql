
-- Hapus cron job lama yang salah (jobid 5)
SELECT cron.unschedule(5);

-- Buat cron job baru: generate blog setiap hari jam 09:00 UTC (16:00 WIB)
SELECT cron.schedule(
  'daily-generate-blog',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://wfthvovlhphnrodrqxqt.supabase.co/functions/v1/generate-blog',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdGh2b3ZsaHBobnJvZHJxeHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTU1NjYsImV4cCI6MjA3MzgzMTU2Nn0.cXHWZbabCY93LbzgCgle9lVOW407MPV4jrtw1BuPkHo"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
