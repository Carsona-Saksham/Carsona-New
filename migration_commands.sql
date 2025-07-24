-- Migration commands to enhance billing system
-- Run these commands one by one in the PostgreSQL prompt

-- 1. Check current coupon table structure
\d coupon;

-- 2. Add new columns to coupon table
ALTER TABLE coupon ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50) DEFAULT 'percentage';
ALTER TABLE coupon ALTER COLUMN discount_percentage DROP NOT NULL;
ALTER TABLE coupon ADD COLUMN IF NOT EXISTS offers_free_delivery BOOLEAN DEFAULT FALSE;
ALTER TABLE coupon ADD COLUMN IF NOT EXISTS offers_free_installation BOOLEAN DEFAULT FALSE;

-- 3. Update existing coupons
UPDATE coupon SET discount_type = 'percentage' WHERE discount_type IS NULL OR discount_type = '';

-- 4. Add new columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS installation_charges FLOAT DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_discount FLOAT DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS installation_discount FLOAT DEFAULT 0;

-- 5. Update existing orders
UPDATE orders SET installation_charges = 0 WHERE installation_charges IS NULL;
UPDATE orders SET delivery_discount = 0 WHERE delivery_discount IS NULL;
UPDATE orders SET installation_discount = 0 WHERE installation_discount IS NULL;

-- 6. Verify changes
\d coupon;
\d orders;

-- 7. Create sample enhanced coupons
INSERT INTO coupon (name, code, description, category, discount_type, offers_free_delivery, minimum_amount, if_applicable, is_active, max_usage_per_user) 
VALUES ('Free Delivery Special', 'FREEDEL25', 'Get free delivery on all orders above ₹2000', 'delivery', 'free_delivery', TRUE, 2000, TRUE, TRUE, 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO coupon (name, code, description, category, discount_type, offers_free_installation, minimum_amount, if_applicable, is_active, max_usage_per_user) 
VALUES ('Free Installation Offer', 'FREEINST', 'Free installation service on premium products', 'installation', 'free_installation', TRUE, 5000, TRUE, TRUE, 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO coupon (name, code, description, category, discount_type, discount_percentage, offers_free_delivery, offers_free_installation, minimum_amount, if_applicable, is_active, max_usage_per_user) 
VALUES ('Complete Package Deal', 'COMPLETE20', '20% off + Free delivery + Free installation', 'combo', 'combo', 20.0, TRUE, TRUE, 10000, TRUE, TRUE, 5)
ON CONFLICT (code) DO NOTHING;

-- 8. Check final results
SELECT COUNT(*) as total_coupons FROM coupon;
SELECT COUNT(*) as enhanced_coupons FROM coupon WHERE discount_type != 'percentage';
SELECT code, discount_type, offers_free_delivery, offers_free_installation FROM coupon WHERE discount_type != 'percentage'; 