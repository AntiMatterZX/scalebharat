-- Add slug column to investors table
ALTER TABLE investors ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS investors_slug_unique ON investors(slug);

-- Function to generate clean slugs for investors
CREATE OR REPLACE FUNCTION generate_investor_slug(firm_name text, first_name text, last_name text) RETURNS text AS $$
  SELECT LOWER(
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          COALESCE(firm_name, first_name || ' ' || last_name, 'investor'),
          '[^\w\s-]', '', 'g'
        ),
        '\s+', 
        '-', 
        'g'
      ),
      '-'
    )
  );
$$ LANGUAGE SQL IMMUTABLE;

-- Update existing investors with slugs
WITH investor_slugs AS (
  SELECT 
    i.id,
    i.firm_name,
    u.first_name,
    u.last_name,
    generate_investor_slug(i.firm_name, u.first_name, u.last_name) AS base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY generate_investor_slug(i.firm_name, u.first_name, u.last_name) 
      ORDER BY i.created_at
    ) AS slug_count
  FROM investors i
  JOIN users u ON i.user_id = u.id
)
UPDATE investors i
SET slug = CASE 
  WHEN isl.slug_count > 1 THEN isl.base_slug || '-' || isl.slug_count
  ELSE isl.base_slug
END
FROM investor_slugs isl
WHERE i.id = isl.id;

-- Show updated investors
SELECT i.id, i.firm_name, u.first_name, u.last_name, i.slug 
FROM investors i
JOIN users u ON i.user_id = u.id
ORDER BY i.created_at DESC 
LIMIT 10;

-- Drop the temporary function
DROP FUNCTION generate_investor_slug;
