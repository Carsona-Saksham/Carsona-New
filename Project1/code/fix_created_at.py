import sqlite3
import os

# Path to your database
db_path = 'instance/database29.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if created_at column exists
        cursor.execute("PRAGMA table_info(coupon)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'created_at' not in columns:
            # Add created_at column with NULL default first
            cursor.execute("ALTER TABLE coupon ADD COLUMN created_at DATETIME")
            print("✅ Added created_at column")
            
            # Update existing records with current timestamp
            cursor.execute("UPDATE coupon SET created_at = datetime('now') WHERE created_at IS NULL")
            print("✅ Set created_at for existing coupons")
            
            conn.commit()
            print("✅ Successfully added created_at column")
        else:
            print("✅ created_at column already exists")
            
        # Show final table structure
        cursor.execute("PRAGMA table_info(coupon)")
        final_columns = cursor.fetchall()
        print("\nFinal coupon table structure:")
        for col in final_columns:
            print(f"  {col[1]} - {col[2]}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()
else:
    print("❌ Database file not found") 