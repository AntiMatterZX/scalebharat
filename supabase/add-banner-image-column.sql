-- Add banner_image column to startups table
ALTER TABLE public.startups 
ADD COLUMN IF NOT EXISTS banner_image TEXT;

-- Add banner_image column to investors table
ALTER TABLE public.investors 
ADD COLUMN IF NOT EXISTS banner_image TEXT;