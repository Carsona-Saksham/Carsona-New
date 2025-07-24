#!/usr/bin/env python3
"""
Production migration script for Railway PostgreSQL to add color variants functionality
"""

import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def get_railway_db_url():
    """Get the Railway PostgreSQL connection URL from environment"""
    # Railway typically provides DATABASE_URL environment variable
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("❌ DATABASE_URL environment variable not found")
        print("Please make sure you're running this in Railway environment")
        return None
    return db_url

def migrate_database():
    """Add color variants table and enhance product variants for PostgreSQL"""
    print("🔄 Starting color variants migration for Railway PostgreSQL...")
    
    db_url = get_railway_db_url()
    if not db_url:
        return False
    
    try:
        # Connect to PostgreSQL
        print("🔗 Connecting to Railway PostgreSQL...")
        conn = psycopg2.connect(db_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Create the color variants table
        print("📋 Creating color_variants table...")
        cursor.execute("""
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
            )
        """)
        print("   ✅ color_variants table created successfully")
        
        # Check if columns exist in product_variants table before adding them
        print("🔧 Enhancing product_variants table...")
        
        # Check existing columns
        cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'product_variants'
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        print(f"   📋 Existing columns: {existing_columns}")
        
        # Add new columns if they don't exist
        if 'material_type' not in existing_columns:
            cursor.execute("ALTER TABLE product_variants ADD COLUMN material_type VARCHAR(100)")
            print("   ✅ Added material_type column")
        
        if 'thickness' not in existing_columns:
            cursor.execute("ALTER TABLE product_variants ADD COLUMN thickness DECIMAL(4,2)")
            print("   ✅ Added thickness column")
        
        if 'warranty' not in existing_columns:
            cursor.execute("ALTER TABLE product_variants ADD COLUMN warranty INTEGER")
            print("   ✅ Added warranty column")
        
        # Update existing variants with default values
        print("📝 Updating existing product variants with default values...")
        
        # Get existing variants
        cursor.execute("SELECT id, name, material_type FROM product_variants WHERE material_type IS NULL OR material_type = ''")
        variants = cursor.fetchall()
        
        for variant_id, variant_name, material_type in variants:
            if not material_type:
                name_lower = variant_name.lower() if variant_name else ''
                if 'budget' in name_lower:
                    cursor.execute("""
                        UPDATE product_variants 
                        SET material_type = %s, thickness = %s, warranty = %s 
                        WHERE id = %s
                    """, ('Synthetic Leather', 2.0, 6, variant_id))
                elif 'standard' in name_lower:
                    cursor.execute("""
                        UPDATE product_variants 
                        SET material_type = %s, thickness = %s, warranty = %s 
                        WHERE id = %s
                    """, ('Premium PU Leather', 2.5, 12, variant_id))
                elif 'premium' in name_lower:
                    cursor.execute("""
                        UPDATE product_variants 
                        SET material_type = %s, thickness = %s, warranty = %s 
                        WHERE id = %s
                    """, ('Genuine Leather', 3.0, 24, variant_id))
                else:
                    cursor.execute("""
                        UPDATE product_variants 
                        SET material_type = %s, thickness = %s, warranty = %s 
                        WHERE id = %s
                    """, ('Premium PU Leather', 2.5, 12, variant_id))
        
        print(f"   ✅ Updated {len(variants)} product variants with default values")
        
        # Add some sample color variants for testing
        print("🎨 Adding sample color variants...")
        
        # Get a sample product to add color variants
        cursor.execute("SELECT category_id, id, name FROM products LIMIT 1")
        sample_product = cursor.fetchone()
        
        if sample_product:
            category_id, product_id, product_name = sample_product
            print(f"   📦 Adding color variants to product: {product_name}")
            
            # Sample colors
            sample_colors = [
                ('Black', '#000000', True),
                ('Brown', '#8B4513', False),
                ('Beige', '#F5F5DC', False),
                ('Gray', '#808080', False)
            ]
            
            for color_name, color_code, is_primary in sample_colors:
                try:
                    cursor.execute("""
                        INSERT INTO color_variants (product_category_id, product_id, color_name, color_code, is_primary, stock_available)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (product_category_id, product_id, color_name) DO NOTHING
                    """, (category_id, product_id, color_name, color_code, is_primary, True))
                except Exception as e:
                    print(f"   ⚠️  Could not add color {color_name}: {e}")
            
            print("   ✅ Sample color variants added")
        
        cursor.close()
        conn.close()
        
        print("✅ Color variants migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
        return False

if __name__ == "__main__":
    success = migrate_database()
    if success:
        print("🎉 Migration completed! Color variants functionality is now available.")
    else:
        print("💥 Migration failed. Please check the errors above.") 