#!/usr/bin/env python3
"""
Database migration script to enhance the billing system:
1. Add installation charges to orders
2. Enhance coupon system with different discount types
3. Add tracking for delivery and installation discounts
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
from urllib.parse import urlparse

def get_database_connection():
    """Get database connection from environment variables"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("Error: DATABASE_URL environment variable not set")
        sys.exit(1)
    
    # Parse the database URL
    parsed = urlparse(database_url)
    
    return psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port,
        database=parsed.path[1:],  # Remove leading '/'
        user=parsed.username,
        password=parsed.password,
        sslmode='require'
    )

def migrate_database():
    """Apply database migrations"""
    conn = get_database_connection()
    cursor = conn.cursor()
    
    try:
        print("Starting database migration for enhanced billing system...")
        
        # 1. Add new fields to coupon table
        print("1. Enhancing coupon table...")
        
        # Add discount_type column
        cursor.execute("""
            ALTER TABLE coupon 
            ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50) DEFAULT 'percentage';
        """)
        
        # Make discount_percentage nullable (for non-percentage coupons)
        cursor.execute("""
            ALTER TABLE coupon 
            ALTER COLUMN discount_percentage DROP NOT NULL;
        """)
        
        # Add free delivery and installation flags
        cursor.execute("""
            ALTER TABLE coupon 
            ADD COLUMN IF NOT EXISTS offers_free_delivery BOOLEAN DEFAULT FALSE;
        """)
        
        cursor.execute("""
            ALTER TABLE coupon 
            ADD COLUMN IF NOT EXISTS offers_free_installation BOOLEAN DEFAULT FALSE;
        """)
        
        # Update existing coupons to have discount_type = 'percentage'
        cursor.execute("""
            UPDATE coupon 
            SET discount_type = 'percentage' 
            WHERE discount_type IS NULL OR discount_type = '';
        """)
        
        print("   ✓ Coupon table enhanced successfully")
        
        # 2. Add new fields to orders table
        print("2. Enhancing orders table...")
        
        # Add installation charges
        cursor.execute("""
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS installation_charges FLOAT DEFAULT 0;
        """)
        
        # Add delivery and installation discount tracking
        cursor.execute("""
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS delivery_discount FLOAT DEFAULT 0;
        """)
        
        cursor.execute("""
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS installation_discount FLOAT DEFAULT 0;
        """)
        
        # Update existing orders to have installation_charges = 0 where NULL
        cursor.execute("""
            UPDATE orders 
            SET installation_charges = 0 
            WHERE installation_charges IS NULL;
        """)
        
        cursor.execute("""
            UPDATE orders 
            SET delivery_discount = 0 
            WHERE delivery_discount IS NULL;
        """)
        
        cursor.execute("""
            UPDATE orders 
            SET installation_discount = 0 
            WHERE installation_discount IS NULL;
        """)
        
        print("   ✓ Orders table enhanced successfully")
        
        # 3. Create some sample enhanced coupons
        print("3. Creating sample enhanced coupons...")
        
        sample_coupons = [
            {
                'name': 'Free Delivery Special',
                'code': 'FREEDEL25',
                'description': 'Get free delivery on all orders above ₹2000',
                'category': 'delivery',
                'discount_type': 'free_delivery',
                'offers_free_delivery': True,
                'minimum_amount': 2000
            },
            {
                'name': 'Free Installation Offer',
                'code': 'FREEINST',
                'description': 'Free installation service on premium products',
                'category': 'installation',
                'discount_type': 'free_installation',
                'offers_free_installation': True,
                'minimum_amount': 5000
            },
            {
                'name': 'Complete Package Deal',
                'code': 'COMPLETE20',
                'description': '20% off + Free delivery + Free installation',
                'category': 'combo',
                'discount_type': 'combo',
                'discount_percentage': 20.0,
                'offers_free_delivery': True,
                'offers_free_installation': True,
                'minimum_amount': 10000
            }
        ]
        
        for coupon in sample_coupons:
            # Check if coupon already exists
            cursor.execute("SELECT id FROM coupon WHERE code = %s", (coupon['code'],))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO coupon (
                        name, code, description, category, discount_type, 
                        discount_percentage, offers_free_delivery, offers_free_installation,
                        minimum_amount, if_applicable, is_active, max_usage_per_user
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    coupon['name'], coupon['code'], coupon['description'], 
                    coupon['category'], coupon['discount_type'],
                    coupon.get('discount_percentage'), coupon.get('offers_free_delivery', False),
                    coupon.get('offers_free_installation', False), coupon['minimum_amount'],
                    True, True, 5
                ))
                print(f"   ✓ Created coupon: {coupon['code']}")
        
        # Commit all changes
        conn.commit()
        print("\n✅ Database migration completed successfully!")
        
        # Display summary
        cursor.execute("SELECT COUNT(*) FROM coupon")
        coupon_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM coupon WHERE discount_type != 'percentage'")
        enhanced_coupon_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM orders")
        order_count = cursor.fetchone()[0]
        
        print(f"\n📊 Migration Summary:")
        print(f"   • Total coupons: {coupon_count}")
        print(f"   • Enhanced coupons (non-percentage): {enhanced_coupon_count}")
        print(f"   • Total orders updated: {order_count}")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
        raise
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    migrate_database() 