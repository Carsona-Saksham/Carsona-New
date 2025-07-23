-- Dual Color Migration for Railway PostgreSQL
-- This script adds dual color support to the color_variants table

-- Add new columns for dual color support
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'color_variants' AND column_name = 'secondary_color_name') THEN
        ALTER TABLE color_variants ADD COLUMN secondary_color_name VARCHAR(50);
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'color_variants' AND column_name = 'secondary_color_code') THEN
        ALTER TABLE color_variants ADD COLUMN secondary_color_code VARCHAR(7);
    END IF;
END $$;

-- Verify the migration
SELECT 'Dual color migration completed successfully!' as status;
SELECT COUNT(*) as color_variants_total FROM color_variants;

-- Show sample of updated structure
SELECT 
    id,
    color_name,
    color_code,
    secondary_color_name,
    secondary_color_code,
    is_primary,
    stock_available
FROM color_variants 
LIMIT 5; 