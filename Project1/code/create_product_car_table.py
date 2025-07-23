from website import create_app, db
from sqlalchemy import text

app = create_app()

def create_product_car_table():
    with app.app_context():
        try:
            # Check if table already exists using newer SQLAlchemy syntax
            with db.engine.connect() as connection:
                result = connection.execute(text("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='product_cars'
                """)).fetchone()
                
                if result:
                    print("ProductCar table already exists!")
                    return
                
                # Create the ProductCar table
                connection.execute(text("""
                    CREATE TABLE product_cars (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        product_category_id INTEGER NOT NULL,
                        product_id INTEGER NOT NULL,
                        car_id INTEGER NOT NULL,
                        FOREIGN KEY (car_id) REFERENCES availablecars(id)
                    )
                """))
                connection.commit()
                
                print("✅ ProductCar table created successfully!")
            
        except Exception as e:
            print(f"❌ Error creating table: {e}")

if __name__ == "__main__":
    create_product_car_table() 