import sqlite3
import os

# Path to your database
db_path = 'instance/database29.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Fixing coupon table schema...")
        
        # Check current table structure
        cursor.execute("PRAGMA table_info(coupon)")
        columns = cursor.fetchall()
        print("Current columns:")
        for col in columns:
            print(f"  {col[1]} - {col[2]} - {'NOT NULL' if col[3] else 'NULL'}")
        
        # Step 1: Create a new table with the correct schema
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS coupon_new (
                id INTEGER PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                category VARCHAR(100),
                discount_percentage FLOAT NOT NULL,
                if_applicable BOOLEAN DEFAULT 1,
                is_active BOOLEAN DEFAULT 1,
                minimum_amount FLOAT DEFAULT 0,
                max_usage_per_user INTEGER DEFAULT 1
            )
        """)
        print("✅ Created new coupon table with correct schema")
        
        # Step 2: Copy data from old table to new table
        cursor.execute("""
            INSERT INTO coupon_new (
                id, name, code, description, category, discount_percentage, 
                if_applicable, is_active, minimum_amount, max_usage_per_user
            )
            SELECT 
                id, name, 
                COALESCE(code, 'CODE' || id) as code,
                description, 
                CAST(category AS TEXT) as category,
                COALESCE(discount_percentage, discount, 0) as discount_percentage,
                COALESCE(if_applicable, 1) as if_applicable,
                COALESCE(is_active, 1) as is_active,
                COALESCE(minimum_amount, 0) as minimum_amount,
                COALESCE(max_usage_per_user, 1) as max_usage_per_user
            FROM coupon
        """)
        print("✅ Copied data to new table")
        
        # Step 3: Drop old table and rename new table
        cursor.execute("DROP TABLE coupon")
        cursor.execute("ALTER TABLE coupon_new RENAME TO coupon")
        print("✅ Replaced old table with new table")
        
        # Step 4: Verify the new structure
        cursor.execute("PRAGMA table_info(coupon)")
        final_columns = cursor.fetchall()
        print("\nFinal coupon table structure:")
        for col in final_columns:
            print(f"  {col[1]} - {col[2]} - {'NOT NULL' if col[3] else 'NULL'}")
        
        # Step 5: Show sample data
        cursor.execute("SELECT id, name, code, discount_percentage, max_usage_per_user FROM coupon LIMIT 3")
        sample_data = cursor.fetchall()
        if sample_data:
            print("\nSample coupon data:")
            for row in sample_data:
                print(f"  ID: {row[0]}, Name: {row[1]}, Code: {row[2]}, Discount: {row[3]}%, Max Usage: {row[4]}")
        
        conn.commit()
        print("\n✅ Schema fix completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()
else:
    print("❌ Database file not found") 