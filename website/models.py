from . import db
from flask_login import UserMixin
from sqlalchemy.sql import func
from werkzeug.security import check_password_hash
from sqlalchemy import UniqueConstraint, func
from datetime import datetime, timedelta


class RegisteredUser(db.Model, UserMixin):
    __tablename__ = 'registered_user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    pas = db.Column(db.String(150), nullable=True)   # pas = db.Column(db.String(150), nullable=False)
    name = db.Column(db.String(100))
    is_admin = db.Column(db.Boolean, default=False)
    SelectedCar = db.relationship('SelectedCar')
    brand = db.relationship('Availablebrands')
    theater = db.relationship('Theaters')
    movie = db.relationship('Movie')
    show = db.relationship('Show')
    booked_ti = db.relationship('Ticket')
    category = db.relationship('Category')
    Products = db.relationship('Products')
    addresses = db.relationship('Address', backref='user', lazy=True)

    def check_password(self, password):
       return check_password_hash(self.password, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'pas': self.pas,
            'is_admin': self.is_admin,
            'SelectedCar':self.SelectedCar,
        }
    
class Address(db.Model):
    __tablename__ = 'addresses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('registered_user.id'), nullable=False)
    flat = db.Column(db.String(100), nullable=False)
    apartment = db.Column(db.String(100), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    landmark = db.Column(db.String(100), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(15), nullable=False)
    address = db.Column(db.String(500), nullable=False)
    address_type = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone_number': self.phone_number,
            'address': self.address,
            'address_type': self.address_type,
            'flat': getattr(self, 'flat', ''),
            'apartment': getattr(self, 'apartment', ''),
            'city': getattr(self, 'city', ''),
            'state': getattr(self, 'state', ''),
            'landmark': getattr(self, 'landmark', '')
        }
    

class SelectedCar(db.Model):
    __tablename__ = 'selected_cars'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('registered_user.id'), nullable=False)
    car_id = db.Column(db.Integer, db.ForeignKey('availablecars.id'), nullable=False)
    selected = db.Column(db.Boolean, default=False)  # Which car is currently selected
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    car = db.relationship('AvailableCars', backref='user_selections', lazy='joined')
    
    # Legacy fields (keep for backward compatibility during migration)
    brand = db.Column(db.String(100), nullable=True)  # Will be removed after migration
    name = db.Column(db.String(100), nullable=True)   # Will be removed after migration
    poster = db.Column(db.Text, nullable=True)        # Will be removed after migration
    user = db.Column(db.Integer, nullable=True)       # Legacy field, use user_id instead
    available_car_id = db.Column(db.Integer, nullable=True)  # Legacy field, use car_id instead
    
    def to_dict(self):
        # Use the relationship to get car data
        car_data = self.car.to_dict() if self.car else {}
        return {
            'id': self.id,
            'user_id': self.user_id,
            'car_id': self.car_id,
            'selected': self.selected,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            # Include car details for convenience
            'car': car_data,
            # Legacy fields for backward compatibility
            'name': car_data.get('name', self.name),
            'brand': car_data.get('brand_name', self.brand),
            'poster': car_data.get('poster', self.poster),
            'user': self.user_id,  # Map to new field
            'available_car_id': self.car_id,  # Map to new field
        }
    

class Category(db.Model):
    __tablename__ = 'category'
    id = db.Column(db.Integer, primary_key=True)
    poster = db.Column(db.Text)  # Changed from String(255) to Text to support base64 images
    title = db.Column(db.String(100))
    category_admin_id = db.Column(db.Integer, db.ForeignKey('registered_user.id'))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'poster': self.poster,
        }
    
class Coupon(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(100))
    
    # Enhanced discount system
    discount_type = db.Column(db.String(50), nullable=False, default='percentage')  # 'percentage', 'free_delivery', 'free_installation', 'combo'
    discount_percentage = db.Column(db.Float, nullable=True)  # For percentage discounts
    offers_free_delivery = db.Column(db.Boolean, default=False)  # Free delivery flag
    offers_free_installation = db.Column(db.Boolean, default=False)  # Free installation flag
    
    if_applicable = db.Column(db.Boolean, default=True)
    is_active = db.Column(db.Boolean, default=True)
    minimum_amount = db.Column(db.Float, default=0)
    max_usage_per_user = db.Column(db.Integer, default=1)
    # Temporarily comment out created_at until we fix the database
    # created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'description': self.description,
            'category': self.category,
            'discount_type': self.discount_type,
            'discount_percentage': self.discount_percentage,
            'offers_free_delivery': self.offers_free_delivery,
            'offers_free_installation': self.offers_free_installation,
            'if_applicable': self.if_applicable,
            'is_active': self.is_active,
            'minimum_amount': self.minimum_amount,
            'max_usage_per_user': self.max_usage_per_user
        }

# New model to track coupon usage by users
class CouponUsage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('registered_user.id'), nullable=False)
    coupon_id = db.Column(db.Integer, db.ForeignKey('coupon.id'), nullable=False)
    usage_count = db.Column(db.Integer, default=0)
    last_used = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Ensure unique combination of user and coupon
    __table_args__ = (db.UniqueConstraint('user_id', 'coupon_id', name='unique_user_coupon'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'coupon_id': self.coupon_id,
            'usage_count': self.usage_count,
            'last_used': self.last_used.isoformat() if self.last_used else None
        }
    
    
# class Products(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     poster = db.Column(db.String(255))
#     name = db.Column(db.String(100))
#     price = db.Column(db.Integer)
#     discount = db.Column(db.Integer)
#     category_admin_id = db.Column(db.Integer, db.ForeignKey('registered_user.id'))
#     car_name = db.Column(db.Integer, db.ForeignKey('availablecars.name'))
#     category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
#     def to_dict(self):
#         return {
#             'id': self.id,
#             'name': self.name,
#             'poster': self.poster,
#             'price': self.price,
#             'discount': self.discount,
#             'category_admin_id': self.category_admin_id,
#             'car_name': self.car_name,
#             'category_id': self.category_id
#         }
    
# Keep only the ProductCar model
class ProductCar(db.Model):
    __tablename__ = 'product_cars'
    
    id = db.Column(db.Integer, primary_key=True)
    product_category_id = db.Column(db.Integer, nullable=False)
    product_id = db.Column(db.Integer, nullable=False)
    car_id = db.Column(db.Integer, db.ForeignKey('availablecars.id'), nullable=False)
    
    # Create a composite foreign key reference to Products
    __table_args__ = (
        db.ForeignKeyConstraint(
            ['product_category_id', 'product_id'],
            ['products.category_id', 'products.id']
        ),
    )

class Products(db.Model):
    __tablename__ = 'products'
    
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), primary_key=True)
    id = db.Column(db.Integer, primary_key=True)
    poster = db.Column(db.Text)  # Support base64 images
    name = db.Column(db.String(100))
    price = db.Column(db.Integer)
    discount = db.Column(db.Integer)
    category_admin_id = db.Column(db.Integer, db.ForeignKey('registered_user.id'))
    
    # Add relationship to variants
    variants = db.relationship('ProductVariant', backref='product', lazy=True, cascade="all, delete-orphan")
    
    # Add relationship to color variants
    color_variants = db.relationship('ColorVariant', backref='product', lazy=True, cascade="all, delete-orphan")
    
    # Use a different approach for the relationship
    @property
    def cars(self):
        product_cars = ProductCar.query.filter_by(
            product_category_id=self.category_id,
            product_id=self.id
        ).all()
        car_ids = [pc.car_id for pc in product_cars]
        return AvailableCars.query.filter(AvailableCars.id.in_(car_ids)).all()

    # Remove circular foreign key constraint - ProductCar already references Products
    # __table_args__ = (
    #     db.ForeignKeyConstraint(
    #         ['category_id', 'id'],
    #         ['product_cars.product_category_id', 'product_cars.product_id']
    #     ),
    # )

    def to_dict(self):
        variants_list = [variant.to_dict() for variant in self.variants] if self.variants else []
        color_variants_list = [color.to_dict() for color in self.color_variants] if self.color_variants else []
        
        # Calculate price range if variants exist
        min_price = min([v.price for v in self.variants]) if variants_list else self.price
        max_price = max([v.price for v in self.variants]) if variants_list else self.price
        
        # Get primary color variant poster if available
        primary_color = next((cv for cv in self.color_variants if cv.is_primary), None)
        display_poster = primary_color.poster if primary_color else self.poster
        
        return {
            'id': self.id,
            'category_id': self.category_id,
            'poster': display_poster,  # Use primary color variant poster if available
            'original_poster': self.poster,  # Keep original poster for reference
            'name': self.name,
            'price': self.price,  # Original base price
            'discount': self.discount,
            'variants': variants_list,
            'color_variants': color_variants_list,
            'has_color_variants': len(color_variants_list) > 0,
            'price_range': {
                'min': min_price,
                'max': max_price
            }
        }
    
class Availablebrands(db.Model):
    __tablename__ = 'availablebrands'
    id = db.Column(db.Integer, primary_key=True)
    brand = db.Column(db.String(100))
    poster = db.Column(db.Text)  # Support base64 images
    # name = db.Column(db.String(100))
    # colour = db.Column(db.String(100))
    # engine_type = db.Column(db.String(100))
    # transmission_type = db.Column(db.String(100))
    admin_id = db.Column(db.Integer, db.ForeignKey('registered_user.id'))
    
    # Add relationship to cars for eager loading
    cars = db.relationship('AvailableCars', backref='brand_ref', lazy='select')

    def to_dict(self):
        return {
            'id': self.id,
            'brand': self.brand,
            'poster': self.poster,
            # 'name': self.name,
            # 'colour': self.colour,
            'admin_id': self.admin_id,

        }
    
class AvailableCars(db.Model):
    __tablename__ = 'availablecars'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    # colour = db.Column(db.String(100))
    # engine_type = db.Column(db.String(100))
    # transmission_type = db.Column(db.String(100))
    poster = db.Column(db.Text)  # Support base64 images
    brand_id = db.Column(db.Integer, db.ForeignKey('availablebrands.id'))
    # Remove the problematic foreign key - brand_name should just be a string field
    brand_name = db.Column(db.String(100))
    is_available = db.Column(db.Boolean, default=True)  # New field for soft delete

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            # 'colour': self.colour,
            # 'engine_type': self.engine_type,
            # 'transmission_type': self.transmission_type,
            'brand_id': self.brand_id,
            'brand_name': self.brand_name,
            'poster': self.poster,
            'is_available': getattr(self, 'is_available', True),
        }

class Orders(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('registered_user.id'), nullable=False)
    product_id = db.Column(db.Integer, nullable=False)
    category_id = db.Column(db.Integer, nullable=False)
    address = db.Column(db.Text, nullable=False)
    consumer_name = db.Column(db.String(100), nullable=False)
    consumer_phone = db.Column(db.String(15), nullable=False)
    slot_date = db.Column(db.Date)
    slot_time = db.Column(db.String(50))
    status = db.Column(db.String(50), default='Pending')
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    
    # Add fields for storing final bill details
    product_original_price = db.Column(db.Float, nullable=False)
    product_final_price = db.Column(db.Float, nullable=False)
    cgst = db.Column(db.Float, nullable=False)
    sgst = db.Column(db.Float, nullable=False)
    delivery_charges = db.Column(db.Float, nullable=False)
    installation_charges = db.Column(db.Float, nullable=False, default=0)  # New installation charges field
    total_amount = db.Column(db.Float, nullable=False)
    coupon_applied = db.Column(db.String(50), nullable=True)
    discount_amount = db.Column(db.Float, nullable=True)
    delivery_discount = db.Column(db.Float, nullable=True, default=0)  # Track delivery discount
    installation_discount = db.Column(db.Float, nullable=True, default=0)  # Track installation discount
    
    # Add fields for variant information
    variant_id = db.Column(db.String(50), nullable=True)
    variant_name = db.Column(db.String(100), nullable=True)
    
    def to_dict(self):
        # Convert UTC to IST (UTC+5:30)
        created_at_ist = self.created_at + timedelta(hours=5, minutes=30) if self.created_at else None
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'product_id': self.product_id,
            'category_id': self.category_id,
            'address': self.address,
            'consumer_name': self.consumer_name,
            'consumer_phone': self.consumer_phone,
            'slot_date': self.slot_date.isoformat() if self.slot_date else None,
            'slot_time': self.slot_time,
            'status': self.status,
            'created_at': created_at_ist.isoformat() if created_at_ist else None,
            'product_original_price': self.product_original_price,
            'product_final_price': self.product_final_price,
            'cgst': self.cgst,
            'sgst': self.sgst,
            'delivery_charges': self.delivery_charges,
            'installation_charges': self.installation_charges,
            'total_amount': self.total_amount,
            'coupon_applied': self.coupon_applied,
            'discount_amount': self.discount_amount,
            'delivery_discount': self.delivery_discount,
            'installation_discount': self.installation_discount,
            'variant_id': self.variant_id,
            'variant_name': self.variant_name
        }





#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.String(100), unique=True, nullable=False)
#     cars = db.relationship('Car', backref='brand', lazy=True)

#     def to_dict(self):
#         return {
#             'id': self.id,
#             'name': self.name,
#         }
    

class Theaters(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    address = db.Column(db.String(100))
    theater_admin_id = db.Column(db.Integer, db.ForeignKey('registered_user.id'))
    show = db.relationship('Show')
    booked_ti = db.relationship('Ticket')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'theater_admin_id': self.theater_admin_id
        }


class Movie(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    poster = db.Column(db.Text)  # Support base64 images
    title = db.Column(db.String(100))
    times_watched = db.Column(db.Integer)
    movie_admin_id = db.Column(db.Integer, db.ForeignKey('registered_user.id'))
    show = db.relationship('Show')
    booked_ti = db.relationship('Ticket')
    rating = db.Column(db.Float)
    Genre = db.Column(db.String(100))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'rating': self.rating,
            'genre': self.Genre,
            'poster': self.poster,
        }

# class CarBrand(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.String(100))

#     def to_dict(self):
#         return {
#             'id': self.id,
#             'name': self.name,
#         }
    

class Show(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    screened_m = db.Column(db.Integer, db.ForeignKey('movie.id'))
    t_in = db.Column(db.Integer, db.ForeignKey('theaters.id'))
    movie = db.Column(db.String(100))
    t = db.Column(db.String(100))
    address_t = db.Column(db.String(100))
    datetime = db.Column(db.DateTime(timezone=True), default=func.now())
    t_admin_id = db.Column(db.Integer, db.ForeignKey('registered_user.id'))
    available_seats = db.Column(db.Integer)
    cost = db.Column(db.Integer)
    booked_ti = db.relationship('Ticket')
    def to_dict(self):
        return {
            'id': self.id,
            'movie': self.movie,
            'theater': self.t_in,
            'theater_name':self.t,
            'cost': self.cost,
            'add': self.address_t,
            'time': self.datetime,
            'available_seats':self.available_seats
        }

class Ticket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booked_show = db.Column(db.Integer, db.ForeignKey('show.id'))
    booked_m = db.Column(db.Integer, db.ForeignKey('movie.id'))
    booked_t = db.Column(db.Integer, db.ForeignKey('theaters.id'))
    user = db.Column(db.Integer, db.ForeignKey('registered_user.id'))
    movie = db.Column(db.String(100))
    t = db.Column(db.String(100))
    address_t = db.Column(db.String(100))
    total_seats = db.Column(db.Integer)
    cost = db.Column(db.Integer)
    timinig_s = db.Column(db.DateTime(timezone=True), default=func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'show_id': self.booked_show,
            'movie': self.booked_m,
            'theater': self.booked_t,
            'user_id': self.user,
            'movie_name': self.movie,
            'total_seats': self.total_seats,
            'cost': self.cost,
            'time': self.timinig_s

        }

# Add a new ProductVariant model
class ProductVariant(db.Model):
    __tablename__ = 'product_variants'
    
    id = db.Column(db.Integer, primary_key=True)
    product_category_id = db.Column(db.Integer, nullable=False)
    product_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(100), nullable=False)  # e.g., "Budget", "Standard", "Premium"
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    discount = db.Column(db.Float, default=0)
    is_default = db.Column(db.Boolean, default=False)
    
    # Additional variant properties
    material_type = db.Column(db.String(100))  # e.g., "Synthetic Leather", "Genuine Leather"
    thickness = db.Column(db.Float)  # Thickness in mm
    warranty = db.Column(db.Integer)  # Warranty in months
    
    # Foreign key relationship
    __table_args__ = (
        db.ForeignKeyConstraint(
            ['product_category_id', 'product_id'],
            ['products.category_id', 'products.id'],
            ondelete='CASCADE'
        ),
    )
    
    @property
    def final_price(self):
        return self.price * (1 - self.discount / 100)
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_category_id': self.product_category_id,
            'product_id': self.product_id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'discount': self.discount,
            'final_price': self.final_price,
            'is_default': self.is_default,
            'material_type': self.material_type,
            'thickness': self.thickness,
            'warranty': self.warranty
        }

class ColorVariant(db.Model):
    __tablename__ = 'color_variants'
    
    id = db.Column(db.Integer, primary_key=True)
    product_category_id = db.Column(db.Integer, nullable=False)
    product_id = db.Column(db.Integer, nullable=False)
    color_name = db.Column(db.String(50), nullable=False)  # e.g., "Black", "Brown", "Beige"
    color_code = db.Column(db.String(7))  # Hex color code, e.g., "#000000"
    
    # Support for dual colors
    secondary_color_name = db.Column(db.String(50))  # e.g., "Red Stitching", "Gold Trim"
    secondary_color_code = db.Column(db.String(7))  # Secondary hex color code
    
    poster = db.Column(db.Text)  # Base64 image for this color variant
    is_primary = db.Column(db.Boolean, default=False)  # Primary color shown on main card
    stock_available = db.Column(db.Boolean, default=True)
    
    # Foreign key relationship
    __table_args__ = (
        db.ForeignKeyConstraint(
            ['product_category_id', 'product_id'],
            ['products.category_id', 'products.id'],
            ondelete='CASCADE'
        ),
        # Ensure unique color names per product
        db.UniqueConstraint('product_category_id', 'product_id', 'color_name', name='unique_product_color'),
    )
    
    def to_dict(self):
        # Create display name for dual colors
        display_name = self.color_name
        if self.secondary_color_name:
            display_name = f"{self.color_name} with {self.secondary_color_name}"
        
        return {
            'id': self.id,
            'product_category_id': self.product_category_id,
            'product_id': self.product_id,
            'color_name': self.color_name,
            'color_code': self.color_code,
            'secondary_color_name': self.secondary_color_name,
            'secondary_color_code': self.secondary_color_code,
            'display_name': display_name,  # Combined name for display
            'poster': self.poster,
            'is_primary': self.is_primary,
            'stock_available': self.stock_available,
            'is_dual_color': bool(self.secondary_color_name)  # Flag for dual color
        }

# -------------------------------------------------------------
# Interaction events for analytics
# -------------------------------------------------------------
class InteractionEvent(db.Model):
    __tablename__ = 'interaction_events'

    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('registered_user.id'), nullable=True)
    session_id = db.Column(db.String(255), index=True)
    event_name = db.Column(db.String(80), index=True, nullable=False)
    path = db.Column(db.String(256))
    # Store full timestamp in IST and separate date part for quick grouping
    timestamp_ist = db.Column(db.DateTime(timezone=True), server_default=func.now(), nullable=False)
    date_ts_ist = db.Column(db.Date, nullable=False)
    clicked_on = db.Column(db.String(100))  # UI element/button that was clicked
    event_data = db.Column(db.JSON)  # free-form key/values (was `metadata`)
    ip = db.Column(db.String(45))
    user_agent = db.Column(db.String(256))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'event_name': self.event_name,
            'path': self.path,
            'timestamp_ist': self.timestamp_ist.isoformat() if self.timestamp_ist else None,
            'date_ts_ist': self.date_ts_ist.isoformat() if self.date_ts_ist else None,
            'clicked_on': self.clicked_on,
            'event_data': self.event_data,
            'ip': self.ip,
            'user_agent': self.user_agent,
        }






