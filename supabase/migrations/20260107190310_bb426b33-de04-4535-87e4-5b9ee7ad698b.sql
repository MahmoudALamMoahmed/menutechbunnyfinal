-- Remove delivery_phone and complaints_phone from restaurants table
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS delivery_phone;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS complaints_phone;

-- Add address column for main location/country
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS address text;