import sqlite3
import os

# Path to your database
db_path = 'website/database29.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Add the max_usage_per_user column to coupons table
        cursor.execute("ALTER TABLE coupon ADD COLUMN max_usage_per_user INTEGER DEFAULT 1")
        print("✅ Added max_usage_per_user column to coupon table")
        
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
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column already exists")
        else:
            print(f"Error: {e}")
    finally:
        conn.close()
else:
    print("Database file not found") 