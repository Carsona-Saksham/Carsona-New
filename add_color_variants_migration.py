#!/usr/bin/env python3
"""
Migration script to add color variants functionality and enhance product variants
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from website import create_app, db
from website.models import ColorVariant, ProductVariant

def migrate_database():
    """Add color variants table and enhance product variants"""
    app = create_app()
    
    with app.app_context():
        print("🔄 Starting color variants migration...")
        
        try:
            # Create the color variants table
            print("📋 Creating color_variants table...")
            db.engine.execute("""
                CREATE TABLE IF NOT EXISTS color_variants (
                    id INTEGER PRIMARY KEY,
                    product_category_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    color_name VARCHAR(50) NOT NULL,
                    color_code VARCHAR(7),
                    poster TEXT,
                    is_primary BOOLEAN DEFAULT 0,
                    stock_available BOOLEAN DEFAULT 1,
                    FOREIGN KEY (product_category_id, product_id) REFERENCES products (category_id, id) ON DELETE CASCADE,
                    UNIQUE (product_category_id, product_id, color_name)
                )
            """)
            
            # Add new columns to product_variants table if they don't exist
            print("🔧 Enhancing product_variants table...")
            
            # Check if columns exist before adding them
            result = db.engine.execute("PRAGMA table_info(product_variants)")
            existing_columns = [row[1] for row in result]
            
            if 'material_type' not in existing_columns:
                db.engine.execute("ALTER TABLE product_variants ADD COLUMN material_type VARCHAR(100)")
                print("   ✅ Added material_type column")
            
            if 'thickness' not in existing_columns:
                db.engine.execute("ALTER TABLE product_variants ADD COLUMN thickness FLOAT")
                print("   ✅ Added thickness column")
            
            if 'warranty' not in existing_columns:
                db.engine.execute("ALTER TABLE product_variants ADD COLUMN warranty INTEGER")
                print("   ✅ Added warranty column")
            
            # Update existing variants with default values
            print("📝 Updating existing product variants with default values...")
            existing_variants = ProductVariant.query.all()
            
            for variant in existing_variants:
                if not variant.material_type:
                    if variant.name.lower() == 'budget':
                        variant.material_type = 'Synthetic Leather'
                        variant.thickness = 2.0
                        variant.warranty = 6
                    elif variant.name.lower() == 'standard':
                        variant.material_type = 'Premium PU Leather'
                        variant.thickness = 2.5
                        variant.warranty = 12
                    elif variant.name.lower() == 'premium':
                        variant.material_type = 'Genuine Leather'
                        variant.thickness = 3.0
                        variant.warranty = 24
                    else:
                        variant.material_type = 'Premium PU Leather'
                        variant.thickness = 2.5
                        variant.warranty = 12
            
            db.session.commit()
            print("✅ Color variants migration completed successfully!")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            db.session.rollback()
            raise

if __name__ == "__main__":
    migrate_database() 