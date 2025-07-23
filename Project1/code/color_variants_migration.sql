-- Color Variants Migration for Railway PostgreSQL
-- This script adds color variants functionality to the production database

-- Create the color variants table
CREATE TABLE IF NOT EXISTS color_variants (
    id SERIAL PRIMARY KEY,
    product_category_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    color_name VARCHAR(50) NOT NULL,
    color_code VARCHAR(7),
    poster TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    stock_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (product_category_id, product_id) REFERENCES products (category_id, id) ON DELETE CASCADE,
    UNIQUE (product_category_id, product_id, color_name)
);

-- Add new columns to product_variants table if they don't exist
-- Check if material_type column exists, if not add it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'material_type') THEN
        ALTER TABLE product_variants ADD COLUMN material_type VARCHAR(100);
    END IF;
END $$;

-- Check if thickness column exists, if not add it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'thickness') THEN
        ALTER TABLE product_variants ADD COLUMN thickness DECIMAL(4,2);
    END IF;
END $$;

-- Check if warranty column exists, if not add it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'warranty') THEN
        ALTER TABLE product_variants ADD COLUMN warranty INTEGER;
    END IF;
END $$;

-- Update existing variants with default values
UPDATE product_variants 
SET 
    material_type = CASE 
        WHEN LOWER(name) LIKE '%budget%' THEN 'Synthetic Leather'
        WHEN LOWER(name) LIKE '%standard%' THEN 'Premium PU Leather'
        WHEN LOWER(name) LIKE '%premium%' THEN 'Genuine Leather'
        ELSE 'Premium PU Leather'
    END,
    thickness = CASE 
        WHEN LOWER(name) LIKE '%budget%' THEN 2.0
        WHEN LOWER(name) LIKE '%standard%' THEN 2.5
        WHEN LOWER(name) LIKE '%premium%' THEN 3.0
        ELSE 2.5
    END,
    warranty = CASE 
        WHEN LOWER(name) LIKE '%budget%' THEN 6
        WHEN LOWER(name) LIKE '%standard%' THEN 12
        WHEN LOWER(name) LIKE '%premium%' THEN 24
        ELSE 12
    END
WHERE material_type IS NULL OR material_type = '';

-- Add sample color variants for the first product (for testing)
DO $$
DECLARE
    sample_category_id INTEGER;
    sample_product_id INTEGER;
BEGIN
    -- Get the first product for testing
    SELECT category_id, id INTO sample_category_id, sample_product_id 
    FROM products 
    LIMIT 1;
    
    -- Add sample color variants if we found a product
    IF sample_category_id IS NOT NULL AND sample_product_id IS NOT NULL THEN
        -- Insert sample colors (ignore conflicts if they already exist)
        INSERT INTO color_variants (product_category_id, product_id, color_name, color_code, is_primary, stock_available)
        VALUES 
            (sample_category_id, sample_product_id, 'Black', '#000000', TRUE, TRUE),
            (sample_category_id, sample_product_id, 'Brown', '#8B4513', FALSE, TRUE),
            (sample_category_id, sample_product_id, 'Beige', '#F5F5DC', FALSE, TRUE),
            (sample_category_id, sample_product_id, 'Gray', '#808080', FALSE, TRUE)
        ON CONFLICT (product_category_id, product_id, color_name) DO NOTHING;
    END IF;
END $$;

-- Verify the migration
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as color_variants_count FROM color_variants;
SELECT COUNT(*) as updated_variants FROM product_variants WHERE material_type IS NOT NULL; 