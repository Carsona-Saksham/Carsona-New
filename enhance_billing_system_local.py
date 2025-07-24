#!/usr/bin/env python3
"""
Local database migration script to enhance the billing system:
1. Add installation charges to orders
2. Enhance coupon system with different discount types
3. Add tracking for delivery and installation discounts
"""

import os
import sys
import sqlite3
from pathlib import Path

def get_database_connection():
    """Get database connection for local SQLite"""
    db_path = Path('instance/database31.db')
    if not db_path.exists():
        print(f"Error: Database file {db_path} not found")
        print("Please make sure you're running this from the correct directory")
        sys.exit(1)
    
    return sqlite3.connect(str(db_path))

def migrate_database():
    """Apply database migrations"""
    conn = get_database_connection()
    cursor = conn.cursor()
    
    try:
        print("Starting database migration for enhanced billing system...")
        
        # 1. Add new fields to coupon table
        print("1. Enhancing coupon table...")
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(coupon)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add discount_type column
        if 'discount_type' not in columns:
            cursor.execute("ALTER TABLE coupon ADD COLUMN discount_type VARCHAR(50) DEFAULT 'percentage'")
            print("   ✓ Added discount_type column")
        
        # Add free delivery and installation flags
        if 'offers_free_delivery' not in columns:
            cursor.execute("ALTER TABLE coupon ADD COLUMN offers_free_delivery BOOLEAN DEFAULT 0")
            print("   ✓ Added offers_free_delivery column")
            
        if 'offers_free_installation' not in columns:
            cursor.execute("ALTER TABLE coupon ADD COLUMN offers_free_installation BOOLEAN DEFAULT 0")
            print("   ✓ Added offers_free_installation column")
        
        # Update existing coupons to have discount_type = 'percentage'
        cursor.execute("UPDATE coupon SET discount_type = 'percentage' WHERE discount_type IS NULL OR discount_type = ''")
        
        print("   ✓ Coupon table enhanced successfully")
        
        # 2. Add new fields to orders table
        print("2. Enhancing orders table...")
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(orders)")
        order_columns = [column[1] for column in cursor.fetchall()]
        
        # Add installation charges
        if 'installation_charges' not in order_columns:
            cursor.execute("ALTER TABLE orders ADD COLUMN installation_charges FLOAT DEFAULT 0")
            print("   ✓ Added installation_charges column")
        
        # Add delivery and installation discount tracking
        if 'delivery_discount' not in order_columns:
            cursor.execute("ALTER TABLE orders ADD COLUMN delivery_discount FLOAT DEFAULT 0")
            print("   ✓ Added delivery_discount column")
            
        if 'installation_discount' not in order_columns:
            cursor.execute("ALTER TABLE orders ADD COLUMN installation_discount FLOAT DEFAULT 0")
            print("   ✓ Added installation_discount column")
        
        # Update existing orders to have default values
        cursor.execute("UPDATE orders SET installation_charges = 0 WHERE installation_charges IS NULL")
        cursor.execute("UPDATE orders SET delivery_discount = 0 WHERE delivery_discount IS NULL")
        cursor.execute("UPDATE orders SET installation_discount = 0 WHERE installation_discount IS NULL")
        
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
                'offers_free_delivery': 1,
                'minimum_amount': 2000
            },
            {
                'name': 'Free Installation Offer',
                'code': 'FREEINST',
                'description': 'Free installation service on premium products',
                'category': 'installation',
                'discount_type': 'free_installation',
                'offers_free_installation': 1,
                'minimum_amount': 5000
            },
            {
                'name': 'Complete Package Deal',
                'code': 'COMPLETE20',
                'description': '20% off + Free delivery + Free installation',
                'category': 'combo',
                'discount_type': 'combo',
                'discount_percentage': 20.0,
                'offers_free_delivery': 1,
                'offers_free_installation': 1,
                'minimum_amount': 10000
            }
        ]
        
        for coupon in sample_coupons:
            # Check if coupon already exists
            cursor.execute("SELECT id FROM coupon WHERE code = ?", (coupon['code'],))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO coupon (
                        name, code, description, category, discount_type, 
                        discount_percentage, offers_free_delivery, offers_free_installation,
                        minimum_amount, if_applicable, is_active, max_usage_per_user
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                    )
                """, (
                    coupon['name'], coupon['code'], coupon['description'], 
                    coupon['category'], coupon['discount_type'],
                    coupon.get('discount_percentage'), coupon.get('offers_free_delivery', 0),
                    coupon.get('offers_free_installation', 0), coupon['minimum_amount'],
                    1, 1, 5
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