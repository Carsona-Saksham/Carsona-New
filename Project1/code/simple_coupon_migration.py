import sqlite3
import os

# Path to your database
db_path = 'instance/database29.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Starting coupon table migration...")
        
        # First, let's see what we have
        cursor.execute("PRAGMA table_info(coupon)")
        existing_columns = [col[1] for col in cursor.fetchall()]
        print(f"Existing columns: {existing_columns}")
        
        # Step 1: Add new columns one by one
        new_columns = [
            ("code", "VARCHAR(50)"),
            ("discount_percentage", "FLOAT"),
            ("is_active", "BOOLEAN DEFAULT 1"),
            ("minimum_amount", "FLOAT DEFAULT 0"),
            ("max_usage_per_user", "INTEGER DEFAULT 1"),
            ("created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
        ]
        
        for col_name, col_type in new_columns:
            if col_name not in existing_columns:
                try:
                    cursor.execute(f"ALTER TABLE coupon ADD COLUMN {col_name} {col_type}")
                    print(f"✅ Added column: {col_name}")
                except sqlite3.OperationalError as e:
                    print(f"⚠️ Column {col_name} might already exist: {e}")
        
        # Step 2: Update existing data
        print("\nUpdating existing coupon data...")
        
        # Copy discount to discount_percentage if needed
        if 'discount' in existing_columns:
            cursor.execute("UPDATE coupon SET discount_percentage = discount WHERE discount_percentage IS NULL")
            print("✅ Copied discount values to discount_percentage")
        
        # Generate codes for existing coupons
        cursor.execute("SELECT id, name FROM coupon WHERE code IS NULL OR code = ''")
        coupons_without_codes = cursor.fetchall()
        
        for coupon_id, coupon_name in coupons_without_codes:
            # Create a simple code
            safe_name = ''.join(c for c in coupon_name if c.isalnum())[:4].upper()
            code = f"{safe_name}{coupon_id}"
            cursor.execute("UPDATE coupon SET code = ? WHERE id = ?", (code, coupon_id))
            print(f"✅ Generated code '{code}' for coupon '{coupon_name}'")
        
        # Set default values for other fields
        cursor.execute("UPDATE coupon SET is_active = 1 WHERE is_active IS NULL")
        cursor.execute("UPDATE coupon SET minimum_amount = 0 WHERE minimum_amount IS NULL")
        cursor.execute("UPDATE coupon SET max_usage_per_user = 1 WHERE max_usage_per_user IS NULL")
        print("✅ Set default values for new columns")
        
        # Step 3: Create coupon_usage table
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
        
        # Commit all changes
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
        # Show final structure
        cursor.execute("PRAGMA table_info(coupon)")
        final_columns = cursor.fetchall()
        print("\nFinal coupon table structure:")
        for col in final_columns:
            print(f"  {col[1]} - {col[2]}")
            
        # Show sample data
        cursor.execute("SELECT id, name, code, discount_percentage, max_usage_per_user FROM coupon LIMIT 3")
        sample_data = cursor.fetchall()
        if sample_data:
            print("\nSample coupon data:")
            for row in sample_data:
                print(f"  ID: {row[0]}, Name: {row[1]}, Code: {row[2]}, Discount: {row[3]}%, Max Usage: {row[4]}")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()
else:
    print("❌ Database file not found at:", db_path) 