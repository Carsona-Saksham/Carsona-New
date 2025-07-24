#!/usr/bin/env python3
"""
Fix NOT NULL constraint on discount_percentage column
"""

import sqlite3
from pathlib import Path

def fix_constraints():
    """Fix the NOT NULL constraint on discount_percentage"""
    db_path = Path('instance/database31.db')
    if not db_path.exists():
        print(f"Error: Database file {db_path} not found")
        return
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        print("Fixing coupon table constraints...")
        
        # Get current table structure
        cursor.execute("PRAGMA table_info(coupon)")
        columns = cursor.fetchall()
        
        # Create new table with nullable discount_percentage
        cursor.execute("""
            CREATE TABLE coupon_new (
                id INTEGER PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                category VARCHAR(100),
                discount_type VARCHAR(50) DEFAULT 'percentage',
                discount_percentage FLOAT,
                offers_free_delivery BOOLEAN DEFAULT 0,
                offers_free_installation BOOLEAN DEFAULT 0,
                if_applicable BOOLEAN DEFAULT 1,
                is_active BOOLEAN DEFAULT 1,
                minimum_amount FLOAT DEFAULT 0,
                max_usage_per_user INTEGER DEFAULT 1
            )
        """)
        
        # Copy data from old table
        cursor.execute("""
            INSERT INTO coupon_new (
                id, name, code, description, category, discount_percentage,
                if_applicable, is_active, minimum_amount, max_usage_per_user,
                discount_type, offers_free_delivery, offers_free_installation
            )
            SELECT 
                id, name, code, description, category, discount_percentage,
                if_applicable, is_active, minimum_amount, max_usage_per_user,
                COALESCE(discount_type, 'percentage'),
                COALESCE(offers_free_delivery, 0),
                COALESCE(offers_free_installation, 0)
            FROM coupon
        """)
        
        # Drop old table and rename new one
        cursor.execute("DROP TABLE coupon")
        cursor.execute("ALTER TABLE coupon_new RENAME TO coupon")
        
        conn.commit()
        print("✅ Fixed coupon table constraints successfully!")
        
    except Exception as e:
        print(f"❌ Error fixing constraints: {e}")
        conn.rollback()
        raise
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    fix_constraints() 