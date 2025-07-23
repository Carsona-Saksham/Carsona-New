from website import create_app, db
from sqlalchemy import text

app = create_app()

def add_product_car_table():
    with app.app_context():
        try:
            # Create the ProductCar table using newer SQLAlchemy syntax
            with db.engine.connect() as connection:
                connection.execute(text("""
                    CREATE TABLE IF NOT EXISTS product_cars (
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
    add_product_car_table() 