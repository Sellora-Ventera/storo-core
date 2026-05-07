-- Add payment columns to invoices for Gateway callback data
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_channel TEXT;
