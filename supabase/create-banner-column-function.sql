-- Create a function to add banner_image column if it doesn't exist
CREATE OR REPLACE FUNCTION public.add_banner_image_column()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add banner_image column to startups table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'startups'
    AND column_name = 'banner_image'
  ) THEN
    ALTER TABLE public.startups ADD COLUMN banner_image TEXT;
  END IF;
  
  -- Add banner_image column to investors table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'investors'
    AND column_name = 'banner_image'
  ) THEN
    ALTER TABLE public.investors ADD COLUMN banner_image TEXT;
  END IF;
END;
$$;