#!/usr/bin/env python3
"""
Simple debug script to check seat covers in database
"""
import os
import sys
from sqlalchemy import create_engine, text

# Database path
db_path = "website/database32.db"

if os.path.exists(db_path):
    print(f"✅ Database file exists: {db_path}")
    
    # Connect to database
    engine = create_engine(f'sqlite:///{db_path}')
    
    with engine.connect() as conn:
        print("\n📋 Checking Categories:")
        result = conn.execute(text("SELECT id, title FROM category"))
        categories = result.fetchall()
        
        for cat in categories:
            print(f"   - ID: {cat[0]}, Title: '{cat[1]}'")
        
        # Find seat covers category
        seat_cover_cat = None
        for cat in categories:
            if 'seat' in cat[1].lower() and 'cover' in cat[1].lower():
                seat_cover_cat = cat
                break
        
        if seat_cover_cat:
            print(f"\n✅ Found seat covers category: ID {seat_cover_cat[0]}, Title: '{seat_cover_cat[1]}'")
            
            # Check products in this category
            print("\n📦 Checking Products in Seat Covers Category:")
            result = conn.execute(text("SELECT id, name, price, discount FROM products WHERE category_id = :cat_id"), {"cat_id": seat_cover_cat[0]})
            products = result.fetchall()
            
            print(f"   Total products: {len(products)}")
            for product in products:
                print(f"   - ID: {product[0]}, Name: '{product[1]}', Price: {product[2]}, Discount: {product[3]}")
        else:
            print("\n❌ No seat covers category found!")
            print("Available categories that might be related:")
            for cat in categories:
                if any(word in cat[1].lower() for word in ['seat', 'cover', 'interior', 'accessory']):
                    print(f"   - '{cat[1]}'")
else:
    print(f"❌ Database file not found: {db_path}")
