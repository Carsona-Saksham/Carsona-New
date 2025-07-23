import sqlite3
import os

# Path to your database
db_path = 'website/database29.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current coupon table structure
        cursor.execute("PRAGMA table_info(coupon)")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"Current coupon table columns: {columns}")
        
        # Add missing columns to coupon table
        columns_to_add = [
            ("code", "VARCHAR(50) UNIQUE"),
            ("discount_percentage", "FLOAT"),
            ("is_active", "BOOLEAN DEFAULT 1"),
            ("minimum_amount", "FLOAT DEFAULT 0"),
            ("max_usage_per_user", "INTEGER DEFAULT 1"),
            ("created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
        ]
        
        for column_name, column_type in columns_to_add:
            if column_name not in columns:
                try:
                    cursor.execute(f"ALTER TABLE coupon ADD COLUMN {column_name} {column_type}")
                    print(f"✅ Added {column_name} column to coupon table")
                except sqlite3.OperationalError as e:
                    print(f"⚠️ Could not add {column_name}: {e}")
        
        # Update existing coupons to have codes if they don't
        cursor.execute("SELECT id, name FROM coupon WHERE code IS NULL OR code = ''")
        coupons_without_codes = cursor.fetchall()
        
        for coupon_id, coupon_name in coupons_without_codes:
            # Generate a simple code based on name and ID
            code = f"{coupon_name[:4].upper()}{coupon_id}"
            cursor.execute("UPDATE coupon SET code = ? WHERE id = ?", (code, coupon_id))
            print(f"✅ Generated code '{code}' for coupon ID {coupon_id}")
        
        # Migrate discount field to discount_percentage if needed
        if 'discount' in columns and 'discount_percentage' in columns:
            cursor.execute("UPDATE coupon SET discount_percentage = discount WHERE discount_percentage IS NULL")
            print("✅ Migrated discount values to discount_percentage")
        
        # Create the coupon_usage table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS coupon_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                coupon_id INTEGER NOT NULL,
                usage_count INTEGER DEFAULT 0,
                last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES registered_user (id),
                FOREIGN KEY (coupon_id) REFERENCES coupon (id),
                UNIQUE(user_id, coupon_id)
            )
        """)
        print("✅ Created coupon_usage table")
        
        conn.commit()
        print("✅ Successfully updated database schema for coupon usage tracking")
        
        # Show final table structure
        cursor.execute("PRAGMA table_info(coupon)")
        final_columns = cursor.fetchall()
        print("\nFinal coupon table structure:")
        for col in final_columns:
            print(f"  {col[1]} ({col[2]})")
            
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()
else:
    print("Database file not found") 