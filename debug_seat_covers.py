#!/usr/bin/env python3
"""
Debug script to test seat covers functionality
"""
import os
import sys

# Set environment
os.environ['FLASK_ENV'] = 'development'

try:
    from website import create_app
    from website.models import Category, Products
    
    print("🔍 Testing Seat Covers Functionality")
    print("=" * 50)
    
    # Create app and context
    app = create_app()
    
    with app.app_context():
        # Test 1: Check if categories exist
        print("\n1. Checking Categories:")
        categories = Category.query.all()
        print(f"   Total categories: {len(categories)}")
        
        for cat in categories:
            print(f"   - ID: {cat.id}, Title: '{cat.title}'")
        
        # Test 2: Find seat covers category
        print("\n2. Finding Seat Covers Category:")
        seat_cover_category = Category.query.filter(
            Category.title.ilike('%seat%cover%')
        ).first()
        
        if seat_cover_category:
            print(f"   ✅ Found: ID {seat_cover_category.id}, Title: '{seat_cover_category.title}'")
            
            # Test 3: Check seat covers products
            print("\n3. Checking Seat Covers Products:")
            seat_covers = Products.query.filter_by(
                category_id=seat_cover_category.id
            ).all()
            
            print(f"   Total seat covers: {len(seat_covers)}")
            for cover in seat_covers:
                print(f"   - ID: {cover.id}, Name: '{cover.name}', Price: {cover.price}")
                
        else:
            print("   ❌ No seat covers category found!")
            print("   Available categories:")
            for cat in categories:
                if 'seat' in cat.title.lower() or 'cover' in cat.title.lower():
                    print(f"   - Similar: '{cat.title}'")
        
        # Test 4: Test route availability
        print("\n4. Testing Routes:")
        with app.test_client() as client:
            try:
                # Test /api/seat_covers
                response = client.get('/api/seat_covers')
                print(f"   /api/seat_covers: Status {response.status_code}")
                if response.status_code == 200:
                    data = response.get_json()
                    if data and 'Seat_Covers' in data:
                        print(f"   - Returned {len(data['Seat_Covers'])} seat covers")
                    else:
                        print(f"   - Response: {data}")
                else:
                    print(f"   - Error: {response.get_data(as_text=True)}")
            except Exception as e:
                print(f"   ❌ Route test failed: {e}")

except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("Make sure you're in the correct directory and all dependencies are installed")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 50)
print("Debug complete!") 