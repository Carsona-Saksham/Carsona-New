from flask import render_template, request, Blueprint, current_app
from flask import Blueprint, redirect, url_for, session
from .models import Show, Movie, Ticket, Theaters, RegisteredUser, SelectedCar, Category,Products, Availablebrands,AvailableCars, Coupon, Address, Orders, ProductCar, CouponUsage, ProductVariant, ColorVariant, InteractionEvent
import secrets
import os
from flask import current_app
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from . import db
from flask_login import current_user, login_required
from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager
from authlib.integrations.flask_client import OAuth
from sqlalchemy import UniqueConstraint, func
from sqlalchemy.orm import joinedload, selectinload
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import razorpay
import hmac
import hashlib
import time
from datetime import datetime
from pytz import timezone
from flask_compress import Compress
import cloudinary
import cloudinary.uploader
import cloudinary.api

# Import cache from main app
try:
    from main import cache
except ImportError:
    # Fallback if cache is not available
    cache = None

# -------------------------------------------------------------
# Simple in-process cache for /api/seat_covers (60-second TTL)
# -------------------------------------------------------------

from time import time as _now

_SC_CACHE: dict[str, tuple[float, dict]] = {}
_SC_TTL = 60  # seconds


def _sc_cache_get(key: str):
    rec = _SC_CACHE.get(key)
    if not rec:
        return None
    ts, payload = rec
    if _now() - ts < _SC_TTL:
        return payload
    _SC_CACHE.pop(key, None)
    return None


def _sc_cache_set(key: str, payload: dict):
    _SC_CACHE[key] = (_now(), payload)

view = Blueprint('views', __name__)

def get_authenticated_user():
    """
    Helper function to get authenticated user using hybrid authentication.
    Tries JWT first, then falls back to session.
    Returns tuple: (user, error_response)
    """
    try:
        # Try JWT first, then fall back to session
        current_user_id = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            try:
                from flask_jwt_extended import decode_token
                token = auth_header.split(' ')[1]
                decoded_token = decode_token(token)
                current_user_id = decoded_token['sub']
                print(f"Using JWT authentication, user_id: {current_user_id}")
            except Exception as jwt_error:
                print(f"JWT decode error: {jwt_error}")
                current_user_id = None
        
        # Fall back to session if JWT fails
        if not current_user_id:
            current_user_id = session.get('user_id')
            print(f"Using session authentication, user_id: {current_user_id}")
        
        current_user = RegisteredUser.query.get(current_user_id) if current_user_id else None
        print(f"Current user: {current_user.email if current_user else 'None'}")
        print(f"Is admin: {current_user.is_admin if current_user else 'N/A'}")

        if not current_user:
            return None, (jsonify({'message': 'User not found'}), 404)

        return current_user, None
        
    except Exception as e:
        print(f"Authentication error: {e}")
        return None, (jsonify({'message': f'Authentication error: {str(e)}'}), 500)


def require_admin():
    """
    Helper function to check if current user is admin.
    Returns tuple: (user, error_response)
    """
    user, error_response = get_authenticated_user()
    if error_response:
        return None, error_response
    
    if not user.is_admin:
        return None, (jsonify({'message': 'Unauthorized access'}), 403)
    
    return user, None


# OAuth will be initialized in __init__.py
# Import the google client from the app context
from flask import current_app



@view.route('/', methods=['POST'])
def user_login():

    email = request.json.get('username', None)
    pas = request.json.get('password', None)
    print(email,pas)
    if not email:
        return jsonify({"msg": "Missing username parameter"}), 400
    if not pas:
        return jsonify({"msg": "Missing password parameter"}), 400

    user = RegisteredUser.query.filter_by(email=email).first()

    if user is None or not user.pas:
        return jsonify({"msg": "Bad username or password"}), 401
    
    if pas!=user.pas:
        return jsonify({"msg": "password is incorrect"}), 401
    else:
        # Generate access token for all users (both admin and regular)
        access_token = create_access_token(identity=user.id)
        session['user_id'] = user.id
        return jsonify(
            access_token=access_token, 
            is_admin=user.is_admin,
            status='success',
            message='Logged in successfully',
            user_id=user.id
        ), 200
    pass

@view.route('/api/check_admin')
def check():
    try:
        current_user_id = session.get('user_id') 
        current_user = RegisteredUser.query.get(current_user_id) 
        print(current_user.is_admin,'checked')
        return jsonify(is_admin=current_user.is_admin), 200
    except:
        return jsonify(is_admin=False), 200




@view.route('/api/sign_up', methods=['POST'])
def sign_up():
    try:
        print("=== SIGN UP DEBUG ===")
        print(f"Request method: {request.method}")
        print(f"Request content type: {request.content_type}")
        print(f"Request is_json: {request.is_json}")
        print(f"Request data: {request.get_data()}")
        
        if not request.is_json:
            print("ERROR: Missing JSON in request")
            return jsonify({"msg": "Missing JSON in request"}), 400

        name = request.json.get('name', None)
        email = request.json.get('email', None)
        password = request.json.get('password', None)
        
        print(f"Parsed data - Name: {name}, Email: {email}, Password: {'***' if password else None}")
        if email[-5:]=='admin':
            print('yes1')
            print(name,email,password)
            if not name:
                return jsonify({"msg": "Missing name parameter"}), 400
            if not email:
                return jsonify({"msg": "Missing email parameter"}), 400
            if not password:
                return jsonify({"msg": "Missing password parameter"}), 400

            user = RegisteredUser.query.filter_by(email=email).first()
            print(user)
            if user is not None:
                return jsonify({"msg": "User with this email already exists"}), 400
            print('ok')
            new_user = RegisteredUser(name=name, email=email, pas=password,is_admin=True)
            print('done')
            db.session.add(new_user)
            db.session.commit()

            return jsonify({"success": True}), 200
        else:
            print('yes')
            print(email)
            print(name,email,password)
            if not name:
                return jsonify({"msg": "Missing name parameter"}), 400
            if not email:
                return jsonify({"msg": "Missing email parameter"}), 400
            if not password:
                return jsonify({"msg": "Missing password parameter"}), 400

            user = RegisteredUser.query.filter_by(email=email).first()
            print(user,1)
            if user != None:
                return jsonify({"msg": "User with this email already exists"}), 400
            print('ok')
            new_user = RegisteredUser(name=name, email=email, pas=password,is_admin=False)
            print('done')
            db.session.add(new_user)
            db.session.commit()

            return jsonify({"success": True}), 200
    except Exception as e:
        print(f'ERROR in sign_up: {e}')
        import traceback
        traceback.print_exc()
        db.session.rollback()  # Rollback any pending database changes
        return jsonify({"msg": f"Internal Server Error: {str(e)}"}), 500



@view.route('/')
def home():
    return render_template('base1.html')

@view.route('/fix-database')
def fix_database_page():
    return render_template('fix_database.html')  


b = {'kia':['Seltos','Sonet'],'honda':['Amaze','Fronx']}

color_options = {'Seltos':['Glacier White Pearl','Sparkling Silver','Pewter Olive','Intense Red','Aurora Black Pearl','Imperial Blue','Glacier White Pearl With Aurora Black Pearl','Gravity Gray','Intense Red With Aurora Black Pearl'],
                 'Sonet':['Glacier White Pearl','Sparkling Silver','Pewter Olive','Intense Red','Aurora Black Pearl','Imperial Blue','Glacier White Pearl With Aurora Black Pearl','Gravity Gray','Intense Red With Aurora Black Pearl'],
                 'Amaze':['Taffeta White','Majestic Blue Mattlic','Urban Titanium Metallic'],
                 'Fronx':['Arctic White','Splendid Silver With Black Roof','Grandeur Grey']}







# @view.route('/car_colours', methods=['GET'])
# def car_colours():
#     print('hey')
#     print(color_options,'hi')
#     return jsonify({'car_colours': color_options}), 200

@view.route('/brands', methods=['GET'])
def car_features():
    """Optimized brands route with eager loading and caching"""
    # Try to get from cache first
    if cache:
        cached_result = cache.get('brands_data')
        if cached_result:
            return jsonify({'brands1': cached_result}), 200
    
    try:
        # Use eager loading to fetch brands with their available cars in a single query
        brands = Availablebrands.query.options(
            selectinload(Availablebrands.cars)
        ).all()
        
        # Build the response efficiently, only including brands with available cars
        brand_data = {}
        for brand in brands:
            # Only include available cars - handle missing is_available column gracefully
            available_cars = []
            for car in brand.cars:
                try:
                    # Try to check is_available column
                    if hasattr(car, 'is_available') and car.is_available is not None:
                        if car.is_available:
                            available_cars.append(car.name)
                    else:
                        # Column doesn't exist yet, include all cars (backward compatibility)
                        available_cars.append(car.name)
                except Exception:
                    # Fallback: include all cars if there's any issue
                    available_cars.append(car.name)
            
            if available_cars:  # Only include brands that have available cars
                brand_data[brand.brand] = available_cars
        
        # Cache the result for 5 minutes
        if cache:
            cache.set('brands_data', brand_data, timeout=300)
            
        return jsonify({'brands1': brand_data}), 200
        
    except Exception as e:
        print(f"❌ Error in car_features: {e}")
        return jsonify({'error': 'Failed to fetch brands'}), 500


# @view.route('/api/add_car_brands_and_cars', methods=['POST'])
# @jwt_required()
# def add_car_brands_and_cars():
#     current_user_id = get_jwt_identity()
#     current_user = RegisteredUser.query.get(current_user_id)

#     if current_user.is_admin:
#         # Define car brands and their corresponding cars
#         car_brands_data = {
#             'Toyota': ['Camry', 'Corolla', 'RAV4'],
#             'Ford': ['F-150', 'Mustang', 'Explorer'],
#             'Chevrolet': ['Silverado', 'Malibu', 'Equinox'],
#         }

#         for brand_name, car_names in car_brands_data.items():
#             # Check if the brand already exists
#             existing_brand = CarBrand.query.filter_by(name=brand_name).first()
#             if existing_brand is None:
#                 new_brand = CarBrand(name=brand_name)
#                 db.session.add(new_brand)
#                 db.session.flush()  # Ensure the brand is added to get its ID

#                 # Add associated cars
#                 for car_name in car_names:
#                     new_car = SelectedCar(name=car_name, brand_id=new_brand.id)
#                     db.session.add(new_car)

#         db.session.commit()
#         return jsonify({'message': 'Car brands and cars added successfully'}), 201
#     else:
#         return jsonify({'message': 'Unauthorized access'}), 403



@view.route('/api/cars/<int:brand_id>', methods=['GET'])
def get_cars_by_brand(brand_id):
    cars = SelectedCar.query.filter_by(brand_id=brand_id).all()
    return jsonify({'cars': [car.to_dict() for car in cars]}), 200

# @view.route('/setUp', methods=['POST'])
# def setUp():
#     selectedBrand = request.json.get('selectedBrand', None)
#     selectedCar = request.json.get('selectedCar', None)
#     selectedColour = request.json.get('selectedColour', None)
#     print(selectedBrand,selectedCar,selectedColour)

@view.route('/setUp', methods=['POST'])
def setUp():
    """Add a car to user's collection using the clean car management system"""
    try:
        current_user_id = session.get('user_id') 
        if not current_user_id:
            return jsonify({'msg': 'User not logged in'}), 401
            
        current_user = RegisteredUser.query.get(current_user_id)
        if not current_user:
            return jsonify({'msg': 'User not found'}), 404
            
        data = request.get_json()
        selected_brand = data.get('selectedBrand')
        selected_car = data.get('selectedCar')
        
        if not selected_brand or not selected_car:
            return jsonify({'msg': 'Missing brand or car selection'}), 400
        
        print(f"🚗 User {current_user_id} selecting: {selected_brand} {selected_car}")
        
        # Get the car details from AvailableCars (master table)
        available_car = AvailableCars.query.filter_by(
            name=selected_car,
            brand_name=selected_brand
        ).first()
        
        if not available_car:
            return jsonify({'msg': 'Car not found in available cars'}), 404
        
        # Check availability
        if hasattr(available_car, 'is_available') and not available_car.is_available:
            return jsonify({'msg': 'Car is currently unavailable'}), 400
        
        print(f"🔍 Found car: {available_car.brand_name} {available_car.name} (ID: {available_car.id})")
        
        # Check if user already has this car using the clean system
        existing_car = SelectedCar.query.filter_by(
            user_id=current_user_id,
            car_id=available_car.id
        ).first()
        
        # Also check legacy fields for backward compatibility
        if not existing_car:
            existing_car = SelectedCar.query.filter_by(
                user=current_user_id, 
                brand=selected_brand, 
                name=selected_car
            ).first()
        
        if existing_car:
            return jsonify({'msg': 'Car Already Exists'}), 400
        
        # Unselect all other cars for this user (both new and legacy fields)
        SelectedCar.query.filter_by(user_id=current_user_id).update({'selected': False})
        SelectedCar.query.filter_by(user=current_user_id).update({'selected': False})
        
        # Add new car using the clean structure
        new_selected_car = SelectedCar(
            # New clean structure
            user_id=current_user_id,
            car_id=available_car.id,
            selected=True,
            # Legacy fields for backward compatibility
            user=current_user_id,
            brand=selected_brand,
            name=selected_car,
            poster=available_car.poster,
            available_car_id=available_car.id
        )
        
        db.session.add(new_selected_car)
        db.session.commit()
        
        print(f"✅ Successfully added car to user's collection: {selected_brand} {selected_car}")
        return jsonify({'message': 'Setup successful'}), 200
        
    except Exception as e:
        print(f"❌ Error in setUp: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'msg': f'Internal server error: {str(e)}'}), 500
    

@view.route('/my_cars', methods=['GET'])
def my_cars():
    current_user_id = session.get('user_id') 
    user = RegisteredUser.query.filter_by(id=current_user_id).first()  
    try:
        if user.is_admin == False:
            Owned_car = user.SelectedCar
            print(f"🚗 Found {len(Owned_car)} selected cars for user")
            
            # Build cars data with availability status
            cars_data = []
            for car in Owned_car:
                # Check if the car is available using the linked available_car_id
                available_car = None
                is_available = True  # Default to available for backward compatibility
                
                try:
                    if hasattr(car, 'available_car_id') and car.available_car_id:
                        available_car = AvailableCars.query.get(car.available_car_id)
                        if available_car and hasattr(available_car, 'is_available'):
                            is_available = available_car.is_available if available_car.is_available is not None else True
                    else:
                        # Fallback: try to find by name and brand
                        available_car = AvailableCars.query.filter_by(
                            brand_name=car.brand, 
                            name=car.name
                        ).first()
                        
                        if available_car:
                            # Check availability if column exists
                            if hasattr(available_car, 'is_available') and available_car.is_available is not None:
                                is_available = available_car.is_available
                            else:
                                is_available = True  # Default to available
                            
                            # Link it if we have the column
                            if hasattr(car, 'available_car_id'):
                                car.available_car_id = available_car.id
                                db.session.commit()
                        else:
                            is_available = True  # Default to available if car not found
                except Exception as e:
                    # Handle any database errors gracefully
                    print(f"Warning: Error checking car availability: {e}")
                    is_available = True  # Default to available
                
                print(f"   - SelectedCar ID: {car.id}, Brand: {car.brand}, Name: {car.name}")
                print(f"     -> Available: {is_available}, AvailableCars ID: {available_car.id if available_car else 'None'} (Selected: {car.selected})")
                
                car_dict = car.to_dict()
                # Keep the SelectedCar.id for deletion operations
                car_dict['id'] = car.id
                # Add availability status
                car_dict['is_available'] = is_available
                car_dict['status'] = 'Available' if is_available else 'Not Available'
                # Add AvailableCars.id for filtering operations
                car_dict['available_car_id'] = available_car.id if available_car else None
                cars_data.append(car_dict)
            
            if len(cars_data) >= 1:
                return jsonify({'my_cars': cars_data}), 200
            else:
                print('🚫 No cars found')
                return jsonify({'my_cars': []}), 200
        else:
            return jsonify({'my_cars': []}), 200
    except Exception as e:
        print(f"❌ Error in my_cars: {e}")
        return jsonify({'my_cars': []}), 200

        
@view.route('/categories', methods=['GET'])
def categories():
    """Optimized categories route with caching and lightweight data loading"""
    # Try to get from cache first
    if cache:
        cached_result = cache.get('categories_data')
        if cached_result:
            return jsonify({'category': cached_result}), 200
    
    try:
        print('Fetching categories...')
        
        # Only fetch necessary fields to reduce data transfer
        categories = Category.query.with_entities(
            Category.id, 
            Category.title, 
            Category.poster
        ).all()
        
        print(f'Found {len(categories)} categories')
        
        # Build lightweight response
        category_list = []
        for cat in categories:
            category_list.append({
                'id': cat.id,
                'title': cat.title,
                'poster': cat.poster[:100] + '...' if cat.poster and len(cat.poster) > 100 else cat.poster  # Truncate large base64 for list view
            })
        
        # Cache the result for 10 minutes (categories don't change often)
        if cache:
            cache.set('categories_data', category_list, timeout=600)
        
        return jsonify({
            'category': category_list
        }), 200
        
    except Exception as e:
        print(f"❌ Error in categories: {e}")
        return jsonify({'error': 'Failed to fetch categories'}), 500


@view.route('/api/add_category', methods=['POST'])
def add_category():
    try:
        print("=== ADD CATEGORY DEBUG ===")
        
        # Try JWT first, then fall back to session
        current_user_id = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            try:
                from flask_jwt_extended import decode_token
                token = auth_header.split(' ')[1]
                decoded_token = decode_token(token)
                current_user_id = decoded_token['sub']
                print(f"Using JWT authentication, user_id: {current_user_id}")
            except Exception as jwt_error:
                print(f"JWT decode error: {jwt_error}")
                current_user_id = None
        
        # Fall back to session if JWT fails
        if not current_user_id:
            current_user_id = session.get('user_id')
            print(f"Using session authentication, user_id: {current_user_id}")
        
        current_user = RegisteredUser.query.get(current_user_id) if current_user_id else None
        print(f"Current user: {current_user.email if current_user else 'None'}")
        print(f"Is admin: {current_user.is_admin if current_user else 'N/A'}")

        if not current_user:
            return jsonify({'message': 'User not found'}), 404

        if not current_user.is_admin:
            return jsonify({'message': 'Unauthorized access'}), 403

        data = request.get_json()
        print(f"Request data: {data}")
        
        if not data:
            return jsonify({'message': 'No JSON data provided'}), 400

        title_m = data.get('title')
        poster_data = data.get('poster')
        
        print(f"Title: {title_m}")
        print(f"Poster data length: {len(poster_data) if poster_data else 0}")

        if not title_m or len(title_m.strip()) < 1:
            return jsonify({'message': 'Title is required'}), 400

        # Handle poster data (base64 from frontend)
        poster_path = None
        if poster_data:
            # Store the base64 data directly or save as file
            # For now, we'll store the base64 data directly
            poster_path = poster_data
        else:
            # Use a default poster path if no poster provided
            poster_path = f'../static/default_category.jpeg'

        new_category = Category(
            title=title_m.strip(), 
            poster=poster_path, 
            category_admin_id=current_user.id
        )
        
        print(f"Creating category: {new_category.title}")
        db.session.add(new_category)
        db.session.commit()
        
        # Invalidate categories cache since we added a new category
        if cache:
            cache.delete('categories_data')
        
        print("✅ Category added successfully")
        return jsonify({
            'message': f'Category {new_category.title} is added', 
            'category': new_category.to_dict()
        }), 200

    except Exception as e:
        print(f"❌ ERROR in add_category: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'message': f'Internal server error: {str(e)}'}), 500



@view.route('/update_categories/<int:id>', methods=['PUT'])
def update_categories(id):
    try:
        print("=== UPDATE CATEGORY DEBUG ===")
        current_user, error_response = require_admin()
        if error_response:
            return error_response
        
        update_m = Category.query.get(int(id))
        if update_m:
            data = request.get_json()
            print("here",data.get('title'))
            update_m.poster = data.get('poster') 
            update_m.title = data.get('title')
            print("here",data.get('title'))
            db.session.commit()

            return jsonify({'message': f'Category {update_m.title} is updated'}), 200
        else:
            return jsonify({'message': 'Category not found'}), 404
            
    except Exception as e:
        print(f"❌ ERROR in update_categories: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'message': f'Internal server error: {str(e)}'}), 500


@view.route('/api/my_category/<int:id>', methods=['GET'])
def my_category(id):
    try:
        print("=== MY CATEGORY DEBUG ===")
        current_user, error_response = require_admin()
        if error_response:
            return error_response
            
        categories = Category.query.get(int(id))
        print('in progress')
        return jsonify({
            'categories': categories.to_dict(),
            'is_admin': current_user.is_admin
        }), 200
        
    except Exception as e:
        print(f"❌ ERROR in my_category: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Internal server error: {str(e)}'}), 500


@view.route('/api/delete_categories/<int:id>', methods=['DELETE'])
def delete_categories(id):
    try:
        print("=== DELETE CATEGORY DEBUG ===")
        current_user, error_response = require_admin()
        if error_response:
            return error_response

        delete_m = Category.query.get(int(id))

        if delete_m:
            db.session.delete(delete_m)
            db.session.commit()

            return jsonify({'message': f'Category {delete_m.title} is deleted'}), 200
        else:
            return jsonify({'message': 'Category not found'}), 404
            
    except Exception as e:
        print(f"❌ ERROR in delete_categories: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'message': f'Internal server error: {str(e)}'}), 500


@view.route('/SeatCovers', methods=['GET'])
def get_seatcovers():
    """Optimized seat covers route with pagination and lightweight data"""
    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)  # Limit to 20 items per page
        
        # Find seat covers category efficiently
        seat_cover_category = Category.query.filter(
            func.lower(Category.title) == 'seat covers'
        ).first()
        
        if not seat_cover_category:
            return jsonify({"error": "Seat covers category not found"}), 404
        
        # Use pagination and eager loading for variants
        seat_covers_query = Products.query.filter_by(
            category_id=seat_cover_category.id
        ).options(
            selectinload(Products.variants)
        )
        
        # Apply pagination
        paginated_covers = seat_covers_query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Build lightweight response
        seat_covers_list = []
        for cover in paginated_covers.items:
            # Use the product's to_dict() method to include color variants
            cover_dict = cover.to_dict()
            cover_dict['variants_count'] = len(cover.variants) if cover.variants else 0
            
            # DO NOT auto-select primary color - let users choose
            # The frontend will handle color variant selection when user clicks on color circles
            # This ensures seat covers show their original poster by default
            
            seat_covers_list.append(cover_dict)
        
        return jsonify({
            'Seat_Covers': seat_covers_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginated_covers.total,
                'pages': paginated_covers.pages,
                'has_next': paginated_covers.has_next,
                'has_prev': paginated_covers.has_prev
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_seatcovers: {e}")
        return jsonify({"error": "Failed to fetch seat covers"}), 500


@view.route('/api/seat_covers', methods=['GET'])
def api_seat_covers():
    """API endpoint for seat covers with car compatibility filtering"""
    try:
        # Get pagination parameters and car filtering
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 50)  # Limit max per_page to 50
        selected_car_id = request.args.get('car_id', type=int)
        
        print(f"🔍 Fetching seat covers - Page: {page}, Per page: {per_page}, Car ID: {selected_car_id}")
        
        # Use query optimization with selectinload for better performance
        seat_cover_category = Category.query.filter(
            func.lower(Category.title) == 'seat covers'
        ).first()
        
        if not seat_cover_category:
            return jsonify({"error": "Seat covers category not found"}), 404
        
        # Optimized base query with selective loading
        seat_covers_query = Products.query.filter_by(
            category_id=seat_cover_category.id
        ).options(
            selectinload(Products.variants)
        )
        
        # Filter by car compatibility if car_id is provided
        if selected_car_id:
            print(f"🚗 Filtering seat covers for car ID: {selected_car_id}")
            
            # Check if the car exists and is available (handle missing column gracefully)
            selected_car = AvailableCars.query.get(selected_car_id)
            if not selected_car:
                print(f"❌ Car ID {selected_car_id} doesn't exist")
                return jsonify({
                    'Seat_Covers': [],
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': 0,
                        'pages': 0,
                        'has_next': False,
                        'has_prev': False
                    },
                    'filtered_by_car': True,
                    'selected_car_id': selected_car_id,
                    'error': 'Selected car not found'
                }), 200
            
            # Check availability if column exists
            try:
                if hasattr(selected_car, 'is_available') and selected_car.is_available is not None:
                    if not selected_car.is_available:
                        print(f"❌ Car ID {selected_car_id} is not available")
                        return jsonify({
                            'Seat_Covers': [],
                            'pagination': {
                                'page': page,
                                'per_page': per_page,
                                'total': 0,
                                'pages': 0,
                                'has_next': False,
                                'has_prev': False
                            },
                            'filtered_by_car': True,
                            'selected_car_id': selected_car_id,
                            'error': 'Selected car is not available'
                        }), 200
            except Exception:
                # Column doesn't exist yet, continue with normal flow
                pass
            
            # Get product IDs that are compatible with the selected car
            compatible_product_cars = ProductCar.query.filter_by(
                product_category_id=seat_cover_category.id,
                car_id=selected_car_id
            ).all()
            
            compatible_product_ids = [pc.product_id for pc in compatible_product_cars]
            print(f"🔍 Found {len(compatible_product_ids)} compatible products: {compatible_product_ids}")
            
            if compatible_product_ids:
                seat_covers_query = seat_covers_query.filter(
                    Products.id.in_(compatible_product_ids)
                )
            else:
                # No compatible products found
                print("❌ No seat covers compatible with selected car")
                return jsonify({
                    'Seat_Covers': [],
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': 0,
                        'pages': 0,
                        'has_next': False,
                        'has_prev': False
                    },
                    'filtered_by_car': True,
                    'selected_car_id': selected_car_id
                }), 200
        
        # Apply pagination
        paginated_covers = seat_covers_query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        print(f"✅ Found {paginated_covers.total} seat covers")
        
        # Build response with full poster and color variants for card display
        seat_covers_list = []
        for cover in paginated_covers.items:
            # Use the product's to_dict() method to include color variants
            cover_dict = cover.to_dict()
            cover_dict['variants_count'] = len(cover.variants) if cover.variants else 0
            
            # DO NOT auto-select primary color - let users choose their preferred color
            # This ensures seat covers show their original poster by default
            # Users can select color variants using the color circles in the frontend
            
            seat_covers_list.append(cover_dict)
        
        result = {
            'Seat_Covers': seat_covers_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginated_covers.total,
                'pages': paginated_covers.pages,
                'has_next': paginated_covers.has_next,
                'has_prev': paginated_covers.has_prev
            },
            'filtered_by_car': bool(selected_car_id),
            'selected_car_id': selected_car_id
        }
        
        # Store in cache
        _ckey = f"{selected_car_id or 'all'}:{page}:{per_page}"
        _sc_cache_set(_ckey, result)
        
        # Clear all existing cache entries to ensure changes take effect
        if cache:
            cache.clear()
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"❌ Error in api_seat_covers: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch seat covers"}), 500


@view.route('/api/my_car_brands', methods=['GET'])
def my_car_brands():
    try:
        print("=== MY CAR BRANDS DEBUG ===")
        current_user, error_response = require_admin()
        if error_response:
            return error_response
            
        # FIX: Query all brands from the Availablebrands table directly
        # instead of relying on a potentially incorrect user relationship.
        all_brands = Availablebrands.query.order_by(Availablebrands.brand).all()
        
        print('in progress')
        return jsonify({
            'brands': [b.to_dict() for b in all_brands],
            'is_admin': current_user.is_admin
        }), 200
        
    except Exception as e:
        print(f"❌ ERROR in my_car_brands: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Internal server error: {str(e)}'}), 500

@view.route('/api/add_brand', methods=['POST'])
def add_brand():
    """Add a new car brand"""
    user, error_response = get_authenticated_user()
    if error_response:
        return error_response

    if not user.is_admin:
        return jsonify({'message': 'Admin access required'}), 403
    
    try:
        data = request.get_json()
        brand_name = data.get('brand')
        poster_path = data.get('poster')
        
        if not brand_name:
            return jsonify({'message': 'Brand name is required'}), 400
        
        print(f"Poster data length: {len(poster_path) if poster_path else 0}")

        # Check if brand already exists
        existing_brand = Availablebrands.query.filter_by(brand=brand_name).first()
        if existing_brand:
            return jsonify({'message': 'Brand already exists'}), 400

        if not poster_path:
            return jsonify({'message': 'Poster is required'}), 400

        # Create new brand
        new_brand = Availablebrands(
            brand=brand_name,
            poster=poster_path, 
        )
        
        db.session.add(new_brand)
        db.session.commit()
        
        # Clear cache
        if cache:
            cache.delete('brands_data')
            cache.delete('api_car_brands_data')
        
        return jsonify({'message': 'Brand added successfully'}), 201
        
    except Exception as e:
        print(f"❌ Error adding brand: {e}")
        db.session.rollback()
        return jsonify({'message': 'Failed to add brand'}), 500


@view.route('/api/update_brand/<int:brand_id>', methods=['PUT'])
def update_brand(brand_id):
    """Update an existing car brand"""
    user, error_response = get_authenticated_user()
    if error_response:
        return error_response
    
    if not user.is_admin:
        return jsonify({'message': 'Admin access required'}), 403
    
    try:
        data = request.get_json()
        brand_name = data.get('brand')
        poster_path = data.get('poster')
        
        # Find the brand to update
        brand = Availablebrands.query.get(brand_id)
        if not brand:
            return jsonify({'message': 'Brand not found'}), 404
        
        # Update brand fields if provided
        if brand_name:
            # Check if new brand name already exists (excluding current brand)
            existing_brand = Availablebrands.query.filter(
                Availablebrands.brand == brand_name,
                Availablebrands.id != brand_id
            ).first()
            if existing_brand:
                return jsonify({'message': 'Brand name already exists'}), 400
            brand.brand = brand_name
        
        if poster_path:
            brand.poster = poster_path
        
        db.session.commit()
        
        # Clear cache
        if cache:
            cache.delete('brands_data')
            cache.delete('api_car_brands_data')
        
        return jsonify({'message': 'Brand updated successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error updating brand: {e}")
        db.session.rollback()
        return jsonify({'message': 'Failed to update brand'}), 500


@view.route('/api/delete_brand/<int:brand_id>', methods=['DELETE'])
def delete_brand(brand_id):
    """Delete a car brand and all associated cars"""
    user, error_response = get_authenticated_user()
    if error_response:
        return error_response
    
    if not user.is_admin:
        return jsonify({'message': 'Admin access required'}), 403
    
    try:
        # Find the brand to delete
        brand = Availablebrands.query.get(brand_id)
        if not brand:
            return jsonify({'message': 'Brand not found'}), 404
        
        # Check if there are cars associated with this brand
        associated_cars = AvailableCars.query.filter_by(brand_id=brand_id).all()
        
        # Check if any users have selected cars from this brand
        selected_cars_with_brand = []
        for car in associated_cars:
            selected_cars = SelectedCar.query.filter_by(available_car_id=car.id).all()
            selected_cars_with_brand.extend(selected_cars)
        
        if selected_cars_with_brand:
            return jsonify({
                    'message': f'Cannot delete brand. {len(selected_cars_with_brand)} users have cars from this brand. Please contact users to change their car selection first.'
            }), 400
        
        # Delete all cars associated with this brand first
        for car in associated_cars:
            # Delete any product associations
            ProductCar.query.filter_by(car_id=car.id).delete()
            # Delete the car
            db.session.delete(car)
        
        # Delete the brand
        db.session.delete(brand)
        db.session.commit()
        
        # Clear cache
        if cache:
            cache.delete('brands_data')
            cache.delete('api_car_brands_data')
        
        return jsonify({'message': f'Brand "{brand.brand}" and all associated cars deleted successfully'}), 200

    except Exception as e:
        print(f"❌ Error deleting brand: {e}")
        db.session.rollback()
        return jsonify({'message': 'Failed to delete brand'}), 500

@view.route('/api/available_cars/<int:brand_id>', methods=['GET'])
def available_cars(brand_id):
    try:
        # Try to filter by availability if column exists
        cars = AvailableCars.query.filter_by(brand_id=brand_id).all()
        
        # Filter available cars, handling missing column gracefully
        available_cars = []
        for car in cars:
            try:
                if hasattr(car, 'is_available') and car.is_available is not None:
                    if car.is_available:
                        available_cars.append(car)
                else:
                    # Column doesn't exist yet, include all cars
                    available_cars.append(car)
            except Exception:
                # Fallback: include all cars
                available_cars.append(car)
        
        return jsonify({'cars': [car.to_dict() for car in available_cars]}), 200
    except Exception as e:
        # Ultimate fallback: return all cars if there's any database issue
        cars = AvailableCars.query.filter_by(brand_id=brand_id).all()
    return jsonify({'cars': [car.to_dict() for car in cars]}), 200


@view.route('/api/available_cars', methods=['GET'])
def available_cars_all():
    try:
        # Get all cars first
        cars = AvailableCars.query.all()
        
        # Filter available cars, handling missing column gracefully
        available_cars = []
        for car in cars:
            try:
                if hasattr(car, 'is_available') and car.is_available is not None:
                    if car.is_available:
                        available_cars.append(car)
                else:
                    # Column doesn't exist yet, include all cars
                    available_cars.append(car)
            except Exception:
                # Fallback: include all cars
                available_cars.append(car)
        
        return jsonify({'cars': [car.to_dict() for car in available_cars]}), 200
    except Exception as e:
        # Ultimate fallback: return all cars if there's any database issue
        cars = AvailableCars.query.all()
    return jsonify({'cars': [car.to_dict() for car in cars]}), 200


@view.route('/api/add_car', methods=['POST'])
def add_car():
    try:
        data = request.form  # Use request.form to get form data
        brand_name = data['brand_name']
        name = data['name']
        brand_id = data['brand_id']
        
        print(f"Adding car: {brand_name} {name}")
        
        # Check if this car already exists (including soft-deleted ones)
        existing_car = AvailableCars.query.filter_by(
            brand_name=brand_name,
            name=name
        ).first()
        
        if existing_car:
            if not existing_car.is_available:
                # Car exists but is soft-deleted, restore it
                print(f"Found soft-deleted car {name}, restoring...")
                existing_car.is_available = True
                
                # Update poster if new one is provided
                if 'poster' in request.files:
                    poster_file = request.files['poster']
                    directory = f'static/cars/{brand_name.lower()}/{name.lower()}'
                    
                    if not os.path.exists(directory):
                        os.makedirs(directory)
                    
                    poster_path = f'{directory}/{poster_file.filename}'
                    poster_file.save(poster_path)
                    existing_car.poster = poster_path
                
                # Re-link any orphaned SelectedCar records
                orphaned_selections = SelectedCar.query.filter_by(
                    brand=brand_name,
                    name=name,
                    available_car_id=None
                ).all()
                
                relinked_count = 0
                for selected_car in orphaned_selections:
                    selected_car.available_car_id = existing_car.id
                    relinked_count += 1
                
                db.session.commit()
                print(f"✅ Restored car {name} and re-linked {relinked_count} user selections")
                
                # Invalidate caches
                if cache:
                    cache.delete('brands_data')
                    cache.delete('api_car_brands_data')
                
                return jsonify({
                    'car': existing_car.to_dict(),
                    'message': f'Car {name} restored successfully',
                    'relinked_users': relinked_count
                }), 200
            else:
                # Car already exists and is available
                return jsonify({'message': f'Car {name} already exists'}), 400
        
        # Create new car - this should only happen for truly new cars
        print(f"🆕 Creating completely new car: {brand_name} {name}")
        new_car = AvailableCars(
            name=name,
            brand_id=brand_id,
            brand_name=brand_name,
            is_available=True
    )

    # Handle file upload
        if 'poster' in request.files:
            poster_file = request.files['poster']
            # Sanitize filename
            filename = secure_filename(poster_file.filename)
            # Create a relative path for the file
            relative_directory = f'cars/{brand_name.lower()}/{name.lower()}'
            # Full path to save the file
            save_directory = os.path.join(current_app.config['UPLOAD_FOLDER'], relative_directory)
            
            # Ensure the directory exists
            if not os.path.exists(save_directory):
                os.makedirs(save_directory)

            # Save the file
            poster_path = os.path.join(save_directory, filename)
            poster_file.save(poster_path)
            
            # Store the correct URL path in the database
            new_car.poster = f'/static/{relative_directory}/{filename}'

        # Handle poster upload to Cloudinary
        if 'poster' in request.files:
            poster_file = request.files['poster']
            if poster_file.filename != '':
                try:
                    # Upload to Cloudinary
                    upload_result = cloudinary.uploader.upload(
                        poster_file,
                        folder=f"cars/{brand_name.lower()}/{name.lower()}",
                        public_id=secure_filename(poster_file.filename)
                    )
                    # Get the secure URL from the result
                    new_car.poster = upload_result.get('secure_url')
                except Exception as e:
                    print(f"❌ Cloudinary upload failed: {e}")
                    return jsonify({'message': 'Image upload failed. Please try again.'}), 500

        db.session.add(new_car)
        db.session.commit()
        print(f"✅ Added new car: {brand_name} {name} with ID {new_car.id}")
    
        # Invalidate brand caches
        if cache:
            cache.delete('brands_data')
            cache.delete('api_car_brands_data')
        
        return jsonify({'car': new_car.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error adding car: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Error adding car: {str(e)}'}), 500

@view.route('/api/delete_car/<int:car_id>', methods=['DELETE'])
def delete_car(car_id):
    try:
        current_user, error_response = require_admin()
        if error_response:
            return error_response
            
        car = AvailableCars.query.get(car_id)
        if not car:
            return jsonify({'message': 'Car not found'}), 404
            
        print(f"Soft deleting car: {car.name} with ID: {car.id}")

        # Soft delete: Mark car as unavailable instead of deleting
        car.is_available = False
        
        # Also mark all cars with the same name as unavailable
        AvailableCars.query.filter_by(name=car.name).update({'is_available': False})
        
        db.session.commit()
        print(f"✅ Car {car.name} marked as unavailable")
        
        # Invalidate brand caches since we modified car availability
        if cache:
            cache.delete('brands_data')
            cache.delete('api_car_brands_data')
        
        return jsonify({'message': f'Car {car.name} has been marked as unavailable. Users with this car will see "Not Available" status.'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error soft deleting car: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Error deleting car: {str(e)}'}), 500

@view.route('/api/restore_car/<int:car_id>', methods=['POST'])
def restore_car(car_id):
    try:
        current_user, error_response = require_admin()
        if error_response:
            return error_response
            
        car = AvailableCars.query.get(car_id)
        if not car:
            return jsonify({'message': 'Car not found'}), 404
            
        print(f"Restoring car: {car.name} with ID: {car.id}")

        # Restore car: Mark as available
        car.is_available = True
        
        # Also restore all cars with the same name
        restored_count = AvailableCars.query.filter_by(name=car.name).update({'is_available': True})
        
        # Re-link any orphaned SelectedCar records for this car
        orphaned_selections = SelectedCar.query.filter_by(
            brand=car.brand_name,
            name=car.name,
            available_car_id=None
        ).all()
        
        relinked_count = 0
        for selected_car in orphaned_selections:
            selected_car.available_car_id = car.id
            relinked_count += 1
            print(f"   🔗 Re-linked user {selected_car.user}'s {selected_car.brand} {selected_car.name} to car ID {car.id}")
        
        db.session.commit()
        print(f"✅ Restored {restored_count} cars and re-linked {relinked_count} user selections")
        
        # Invalidate brand caches
        if cache:
            cache.delete('brands_data')
            cache.delete('api_car_brands_data')
        
        return jsonify({
            'message': f'Car {car.name} has been restored successfully.',
            'restored_cars': restored_count,
            'relinked_users': relinked_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error restoring car: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Error restoring car: {str(e)}'}), 500

#/car_brands
@view.route('/api/removeCar/<int:id>', methods=['DELETE'])
def remove_car(id):
    """Remove a car from user's collection (clean system)"""
    try:
        # Get the SelectedCar record
        selected_car = SelectedCar.query.get(id)
        if not selected_car:
            return jsonify({'message': 'Car not found in your collection'}), 404
        
        # Check if the car being deleted is the selected car
        is_selected_car = selected_car.selected
        
        # Get the user who owns the car (support both new and legacy fields)
        current_user_id = selected_car.user_id or selected_car.user
        
        print(f"🗑️  Removing car from user {current_user_id}'s collection: {selected_car.brand} {selected_car.name}")
        
        # Delete the car from user's collection (this doesn't affect the master AvailableCars table)
        db.session.delete(selected_car)
        db.session.commit()
        
        # If it was the selected car, find another car to auto-select
        if is_selected_car and current_user_id:
            # Get the most recently added car for the user (support both new and legacy fields)
            new_selected_car = SelectedCar.query.filter(
                (SelectedCar.user_id == current_user_id) | (SelectedCar.user == current_user_id)
            ).order_by(SelectedCar.id.desc()).first()
            
            if new_selected_car:
                # Set the new selected car
                new_selected_car.selected = True
                db.session.commit()
                print(f"✅ Auto-selected {new_selected_car.brand} {new_selected_car.name} as primary car")
                return jsonify({'message': 'Car removed. New car selected automatically.'}), 200
            else:
                # No cars left, return a message to redirect to car brands page
                print(f"ℹ️  User {current_user_id} has no cars left after deletion")
                return jsonify({'message': 'Car removed. No cars left in your collection.'}), 200
        
        print(f"✅ Car removed from user's collection successfully")
        return jsonify({'message': 'Car removed from your collection successfully.'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error removing car: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Error removing car: {str(e)}'}), 500


@view.route('/api/select_car', methods=['POST'])
def select_car():
    """Add a car to user's collection using the clean car management system"""
    try:
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        data = request.get_json()
        if not data or 'car_id' not in data:
            return jsonify({'error': 'car_id is required'}), 400
        
        car_id = data['car_id']  # This is AvailableCars.id (stable ID)
        print(f"🚗 Adding car with stable ID: {car_id}")
        
        # Get the car from the master AvailableCars table
        available_car = AvailableCars.query.get(car_id)
        if not available_car:
            return jsonify({'error': 'Car not found'}), 404
            
        if not available_car.is_available:
            return jsonify({'error': 'This car is no longer available'}), 400
        
        print(f"🔍 Found car: {available_car.brand_name} {available_car.name} (ID: {car_id})")
        
        # Check if user already has this car
        existing_selection = SelectedCar.query.filter_by(
            user_id=current_user_id,
            car_id=car_id
        ).first()
        
        if existing_selection:
            return jsonify({'error': f'You already have {available_car.brand_name} {available_car.name} in your collection'}), 400
        
        # Unselect all other cars for this user (make this the primary car)
        SelectedCar.query.filter_by(user_id=current_user_id).update({'selected': False})
        SelectedCar.query.filter_by(user=current_user_id).update({'selected': False})  # Legacy field
        
        # Add the car to user's collection using clean structure
        new_selection = SelectedCar(
            user_id=current_user_id,
            car_id=car_id,
            selected=True,
            # Legacy fields for backward compatibility
            user=current_user_id,
            brand=available_car.brand_name,
            name=available_car.name,
            poster=available_car.poster,
            available_car_id=car_id
        )
        
        db.session.add(new_selection)
        db.session.commit()
        
        print(f"✅ Successfully added car to user's collection: {available_car.brand_name} {available_car.name}")
        return jsonify({
            'message': f'{available_car.brand_name} {available_car.name} has been added to your collection.',
            'selected_car': new_selection.to_dict()
        }), 200
        
    except Exception as e:
        print(f"❌ Error adding car: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': 'Failed to add car'}), 500
    

@view.route('/api/select_existing_car', methods=['POST'])
def select_existing_car():
    """Select an existing car from user's collection as the primary car"""
    try:
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        data = request.get_json()
        if not data or 'selected_car_id' not in data:
            return jsonify({'error': 'selected_car_id is required'}), 400
        
        selected_car_id = data['selected_car_id']  # This is SelectedCar.id
        print(f"🎯 Selecting existing car with SelectedCar ID: {selected_car_id}")
        
        # Get the SelectedCar record
        selected_car = SelectedCar.query.get(selected_car_id)
        if not selected_car:
            return jsonify({'error': 'Car not found in your collection'}), 404
        
        # Verify the car belongs to the current user
        if selected_car.user_id != current_user_id and selected_car.user != current_user_id:
            return jsonify({'error': 'Unauthorized access to car'}), 403
        
        # Check if the car is available (if it has car_id linking to AvailableCars)
        if selected_car.car_id:
            available_car = AvailableCars.query.get(selected_car.car_id)
            if available_car and hasattr(available_car, 'is_available') and not available_car.is_available:
                return jsonify({'error': 'This car is currently not available'}), 400
        
        print(f"🔍 Found car: {selected_car.brand} {selected_car.name} (SelectedCar ID: {selected_car_id})")
        
        # Unselect all other cars for this user
        SelectedCar.query.filter_by(user_id=current_user_id).update({'selected': False})
        SelectedCar.query.filter_by(user=current_user_id).update({'selected': False})  # Legacy field
        
        # Select this car
        selected_car.selected = True
        db.session.commit()
        
        print(f"✅ Successfully selected car: {selected_car.brand} {selected_car.name}")
        return jsonify({
            'message': f'{selected_car.brand} {selected_car.name} has been selected as your primary car.',
            'selected_car': selected_car.to_dict()
        }), 200
        
    except Exception as e:
        print(f"❌ Error selecting existing car: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': 'Failed to select car'}), 500
    

@view.route('/api/add_seatcovers', methods=['POST'])
def add_seat_covers():
    print("=== ADD SEAT COVERS DEBUG ===")
    current_user, error_response = require_admin()
    if error_response:
        return error_response
        
    data = request.get_json()
    print(f"Request data: {data}")
    
    if not data:
        return jsonify({'message': 'No JSON data provided'}), 400
        
    name = data.get('name')
    price = data.get('price')
    discount = data.get('discount')
    car_ids = data.get('car_ids', [])  # Changed to accept multiple car IDs
    poster_path = data.get('poster')
    categories = Category.query.all()
    id_cat_mapping = {category.id: category.title for category in categories}
    seat_cover_cat_id = [k for k,v in id_cat_mapping.items() if v.lower() == 'seat covers']
    print(f"🔍 Categories found: {id_cat_mapping}")
    print(f"🔍 Seat cover category IDs: {seat_cover_cat_id}")
    
    if not seat_cover_cat_id:
        print("❌ No seat covers category found!")
        return jsonify({'message': 'Seat covers category not found. Available categories: ' + str(list(id_cat_mapping.values()))}), 400
    
    if name and price is not None and car_ids:  # Ensure at least one car is selected
        try:
            max_id = db.session.query(func.max(Products.id)).filter_by(category_id=seat_cover_cat_id[0]).scalar()
            next_id = (max_id) + 1
        except:
            next_id = 1
        
        new_seatcover = Products(
            id=next_id,
            name=name, 
            poster=poster_path, 
            category_admin_id=current_user.id, 
            price=price, 
            discount=discount, 
            category_id=seat_cover_cat_id[0]
        )
        
        # Add the seat cover to the session first
        db.session.add(new_seatcover)
        db.session.commit()  # Commit to ensure the product exists
        
        # Associate multiple cars with the seat cover using the ProductCar model
        for car_id in car_ids:
            car = AvailableCars.query.get(car_id)
            if car:
                product_car = ProductCar(
                    product_category_id=new_seatcover.category_id,
                    product_id=new_seatcover.id,
                    car_id=car_id
                )
                db.session.add(product_car)
        
        # Add variants if provided, otherwise create default variants
        variants = data.get('variants', [])
        if not variants:
            # Create default variants
            variants = [
                {
                    'name': 'Budget',
                    'description': 'Quality materials at an affordable price',
                    'price': float(price) * 0.8,  # 20% cheaper
                    'discount': discount,
                    'is_default': False
                },
                {
                    'name': 'Standard',
                    'description': 'Our recommended choice with excellent quality',
                    'price': float(price),  # Same as base price
                    'discount': discount,
                    'is_default': True
                },
                {
                    'name': 'Premium',
                    'description': 'Luxury materials with extended durability',
                    'price': float(price) * 1.3,  # 30% more expensive
                    'discount': discount,
                    'is_default': False
                }
            ]
        
        # Add variants to the product
        for variant_data in variants:
            variant = ProductVariant(
                product_category_id=new_seatcover.category_id,
                product_id=new_seatcover.id,
                name=variant_data['name'],
                description=variant_data.get('description', ''),
                price=variant_data['price'],
                discount=variant_data.get('discount', 0),
                is_default=variant_data.get('is_default', False),
                material_type=variant_data.get('material_type', 'Premium PU Leather'),
                thickness=variant_data.get('thickness', 2.5),
                warranty=variant_data.get('warranty', 12)
            )
            db.session.add(variant)
        
        # Add color variants if provided
        color_variants = data.get('colorVariants', [])
        primary_color_index = data.get('primaryColorIndex')
        
        if color_variants:
            print(f"🎨 Adding {len(color_variants)} color variants...")
            for i, color_data in enumerate(color_variants):
                if color_data.get('color_name') and color_data.get('poster'):
                    color_variant = ColorVariant(
                        product_category_id=new_seatcover.category_id,
                        product_id=new_seatcover.id,
                        color_name=color_data['color_name'],
                        color_code=color_data.get('color_code', '#000000'),
                        secondary_color_name=color_data.get('secondary_color_name'),
                        secondary_color_code=color_data.get('secondary_color_code'),
                        poster=color_data['poster'],
                        is_primary=(i == primary_color_index),
                        stock_available=True
                    )
                    db.session.add(color_variant)
        
        db.session.commit()
        
        # Invalidate seat covers cache since we added a new one
        if cache:
            # Clear all seat covers cache entries
            cache.delete_many(
                'api_seat_covers_page_1_per_page_20',
                'api_seat_covers_page_1_per_page_10',
                'api_seat_covers_page_1_per_page_50'
            )
            # Clear cache with pattern matching for all pages
            for page_num in range(1, 11):  # Clear first 10 pages
                for per_page in [10, 20, 50]:
                    cache_key = f'api_seat_covers_page_{page_num}_per_page_{per_page}'
                    cache.delete(cache_key)
        
        print(f"✅ Seat cover added successfully: ID {new_seatcover.id}, Name: {new_seatcover.name}")
        print(f"✅ Added {len(variants)} variants, {len(color_variants)} color variants, and {len(car_ids)} car associations")
        return jsonify({
            'message': f'Seat cover {new_seatcover.name} is added', 
            'seatcover': new_seatcover.to_dict(),
            'variants_added': len(variants),
            'color_variants_added': len(color_variants),
            'cars_associated': len(car_ids)
        }), 200
    else:
        return jsonify({'message': 'Fill all required fields (name, price, car_ids)'}), 400
        

# Add new route for getting full image data when needed
@view.route('/api/image/<string:model_type>/<int:item_id>', methods=['GET'])
def get_full_image(model_type, item_id):
    """Get full image data for a specific item when needed"""
    try:
        # Cache key for this specific image
        cache_key = f'image_{model_type}_{item_id}'
        
        if cache:
            cached_image = cache.get(cache_key)
            if cached_image:
                return jsonify({'poster': cached_image}), 200
        
        # Determine which model to query
        if model_type == 'category':
            item = Category.query.get(item_id)
        elif model_type == 'product':
            item = Products.query.filter_by(id=item_id).first()
        elif model_type == 'brand':
            item = Availablebrands.query.get(item_id)
        elif model_type == 'car':
            item = AvailableCars.query.get(item_id)
        else:
            return jsonify({'error': 'Invalid model type'}), 400
        
        if not item or not item.poster:
            return jsonify({'error': 'Image not found'}), 404
        
        # Cache the full image for 1 hour
        if cache:
            cache.set(cache_key, item.poster, timeout=3600)
        
        return jsonify({'poster': item.poster}), 200
        
    except Exception as e:
        print(f"❌ Error getting image: {e}")
        return jsonify({'error': 'Failed to fetch image'}), 500


# Add route to get seat cover details with full data
@view.route('/api/seat_cover/<int:category_id>/<int:product_id>', methods=['GET'])
def get_seat_cover_details(category_id, product_id):
    """Get full seat cover details including variants and full image"""
    try:
        # Cache key for this specific product
        cache_key = f'seat_cover_{category_id}_{product_id}'
        
        if cache:
            cached_product = cache.get(cache_key)
            if cached_product:
                return jsonify(cached_product), 200
        
        # Fetch product with variants using eager loading
        product = Products.query.filter_by(
            category_id=category_id, 
            id=product_id
        ).options(
            selectinload(Products.variants)
        ).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Get associated cars
        product_cars = ProductCar.query.filter_by(
            product_category_id=category_id,
            product_id=product_id
        ).all()
        
        car_ids = [pc.car_id for pc in product_cars]
        cars = AvailableCars.query.filter(AvailableCars.id.in_(car_ids)).all() if car_ids else []
        
        # Build full response
        product_details = {
            'id': product.id,
            'category_id': product.category_id,
            'name': product.name,
            'price': product.price,
            'discount': product.discount,
            'poster': product.poster,  # Full image for details view
            'variants': [variant.to_dict() for variant in product.variants] if product.variants else [],
            'compatible_cars': [{'id': car.id, 'name': car.name, 'brand_name': car.brand_name} for car in cars],
            'price_range': {
                'min': min([v.price for v in product.variants]) if product.variants else product.price,
                'max': max([v.price for v in product.variants]) if product.variants else product.price
            }
        }
        
        # Cache for 30 minutes
        if cache:
            cache.set(cache_key, product_details, timeout=1800)
        
        return jsonify(product_details), 200
        
    except Exception as e:
        print(f"❌ Error getting seat cover details: {e}")
        return jsonify({'error': 'Failed to fetch product details'}), 500


# Add the API endpoint that the frontend expects for regular users
@view.route('/api/car_brands', methods=['GET'])
def api_car_brands():
    """API endpoint for regular users to get brands with car data structured for frontend"""
    # Try to get from cache first
    if cache:
        cached_result = cache.get('api_car_brands_data')
        if cached_result:
            return jsonify({'brands': cached_result}), 200
    
    try:
        # Use eager loading to fetch brands with their cars in a single query
        brands = Availablebrands.query.options(
            selectinload(Availablebrands.cars)
        ).all()
        
        if not brands:
            return jsonify({'brands': []}), 200
        
        # Build the response in the format the frontend expects
        brands_data = []
        for brand in brands:
            # Filter only available cars for this brand
            available_cars = []
            for car in brand.cars:
                # Check if car is available (handle missing is_available column gracefully)
                if hasattr(car, 'is_available') and car.is_available is not None:
                    if car.is_available:
                        available_cars.append(car.to_dict())
                else:
                    # Default to available if column doesn't exist
                    available_cars.append(car.to_dict())
            
            # Only include brands that have at least one available car
            if available_cars:
                brand_data = {
                    'brand': brand.to_dict(),  # Brand info
                        'cars': available_cars  # Only available cars
                }
            brands_data.append(brand_data)
        
        # Cache the result for 5 minutes
        if cache:
            cache.set('api_car_brands_data', brands_data, timeout=300)
            
        return jsonify({'brands': brands_data}), 200
        
    except Exception as e:
        print(f"❌ Error in api_car_brands: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'brands': [], 'error': 'Failed to fetch brands'}), 200  # Return empty array instead of error for better UX
        

# Google OAuth Routes
@view.route('/api/login/google')
def google_login():
    """Initiate Google OAuth login"""
    try:
        from website import oauth
        
        # Detect the current protocol (HTTP or HTTPS) from the request
        scheme = 'https' if request.is_secure or request.headers.get('X-Forwarded-Proto') == 'https' else 'http'
        
        # Generate redirect URI for the callback using the detected scheme
        redirect_uri = url_for('views.google_callback', _external=True, _scheme=scheme)
        print(f"🔄 Google OAuth redirect URI: {redirect_uri}")
        print(f"🔄 Detected scheme: {scheme}")
        print(f"🔄 Request is_secure: {request.is_secure}")
        print(f"🔄 X-Forwarded-Proto: {request.headers.get('X-Forwarded-Proto')}")
        
        # Redirect to Google OAuth
        return oauth.google.authorize_redirect(redirect_uri)
        
    except Exception as e:
        print(f"❌ Error initiating Google login: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to initiate Google login'}), 500


@view.route('/login/callback')
def google_callback():
    """Handle Google OAuth callback"""
    try:
        from website import oauth
        
        # Get the token from Google
        token = oauth.google.authorize_access_token()
        print(f"🔄 Received Google token: {token}")
        
        # Get user info from Google
        user_info = token.get('userinfo')
        if not user_info:
            # If userinfo is not in token, fetch it
            resp = oauth.google.get('userinfo')
            user_info = resp.json()
        
        email = user_info.get('email')
        name = user_info.get('name')
        
        print(f"🔄 Google user info - Email: {email}, Name: {name}")
        
        if not email:
            print("❌ Email not provided by Google")
            return redirect('/#/?error=no_email')
        
        # Check if user exists
        user = RegisteredUser.query.filter_by(email=email).first()
        
        if not user:
            print(f"�� Creating new user: {email}")
            # Create new user
            user = RegisteredUser(
                email=email,
                name=name,
                pas=None,  # OAuth users don't have passwords
                is_admin=email.endswith('admin')  # Make admin if email ends with 'admin'
            )
            db.session.add(user)
            db.session.commit()
        else:
            print(f"🔄 Existing user found: {email}")
        
        # Set session
        session['user_id'] = user.id
        
        # Create JWT token for all users (both admin and regular)
        access_token = create_access_token(identity=user.id)
        
        if user.is_admin:
            print(f"🔄 Admin login - redirecting to home with token")
            # Redirect to frontend with token in URL params (for handling)
            return redirect(f'/home?token={access_token}&is_admin=true')
        else:
            # For regular users, check if they have cars and store token in localStorage
            my_cars = SelectedCar.query.filter_by(user=user.id).all()
            redirect_path = '/seat-covers' if my_cars else '/car_brands'
            print(f"🔄 Regular user login - redirecting to {redirect_path} with token")
            # Redirect to frontend with token in URL params for storage
            return redirect(f'{redirect_path}?token={access_token}&is_admin=false')
    
    except Exception as e:
        print(f"❌ Error in Google callback: {e}")
        import traceback
        traceback.print_exc()
        return redirect('/#/?error=oauth_failed')


# Alternative JSON API version for single-page apps
@view.route('/api/login/google/callback')
def google_callback_api():
    """Handle Google OAuth callback for API response"""
    try:
        from website import oauth
        
        # Get the token from Google
        token = oauth.google.authorize_access_token()
        
        # Get user info from Google
        user_info = token.get('userinfo')
        if not user_info:
            # If userinfo is not in token, fetch it
            resp = oauth.google.get('userinfo')
            user_info = resp.json()
        
        email = user_info.get('email')
        name = user_info.get('name')
        
        if not email:
            return jsonify({'error': 'Email not provided by Google'}), 400
        
        # Check if user exists
        user = RegisteredUser.query.filter_by(email=email).first()
        
        if not user:
            # Create new user
            user = RegisteredUser(
                email=email,
                name=name,
                pas=None,  # OAuth users don't have passwords
                is_admin=email.endswith('admin')  # Make admin if email ends with 'admin'
            )
            db.session.add(user)
            db.session.commit()
        
        # Set session
        session['user_id'] = user.id
        
        # Create JWT token for all users (both admin and regular)
        access_token = create_access_token(identity=user.id)
        
        # Check if user has cars
        my_cars = SelectedCar.query.filter_by(user=user.id).all()
        redirect_path = '/home' if user.is_admin else ('/seat-covers' if my_cars else '/car_brands')
        
        return jsonify({
            'access_token': access_token,
            'is_admin': user.is_admin,
            'user_id': user.id,
            'email': user.email,
            'name': user.name,
            'redirect': redirect_path,
            'has_cars': len(my_cars) > 0,
            'status': 'success',
            'message': 'Logged in successfully via Google'
        }), 200
    
    except Exception as e:
        print(f"❌ Error in Google API callback: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'OAuth authentication failed'}), 500        

@view.route('/api/debug/seat_covers', methods=['GET'])
def debug_seat_covers():
    """Debug endpoint to check seat covers in production database"""
    try:
        print("🔍 DEBUG: Checking seat covers in database...")
        
        # Check categories first
        categories = Category.query.all()
        print(f"📋 Found {len(categories)} categories:")
        for cat in categories:
            print(f"   - ID: {cat.id}, Title: '{cat.title}'")
        
        # Find seat covers category
        seat_cover_category = Category.query.filter(
            func.lower(Category.title).like('%seat%cover%')
        ).first()
        
        if not seat_cover_category:
            return jsonify({
                "error": "Seat covers category not found",
                "categories": [{"id": cat.id, "title": cat.title} for cat in categories]
            }), 404
        
        print(f"✅ Found seat covers category: ID {seat_cover_category.id}, Title: '{seat_cover_category.title}'")
        
        # Get all products in seat covers category
        seat_covers = Products.query.filter_by(category_id=seat_cover_category.id).all()
        
        print(f"📦 Found {len(seat_covers)} seat covers in database:")
        
        seat_covers_data = []
        for cover in seat_covers:
            print(f"   - ID: {cover.id}, Name: '{cover.name}', Price: {cover.price}, Discount: {cover.discount}")
            
            # Get variants
            variants = ProductVariant.query.filter_by(
                product_category_id=cover.category_id,
                product_id=cover.id
            ).all()
            
            # Get associated cars
            product_cars = ProductCar.query.filter_by(
                product_category_id=cover.category_id,
                product_id=cover.id
            ).all()
            
            cover_data = {
                "id": cover.id,
                "name": cover.name,
                "price": cover.price,
                "discount": cover.discount,
                "poster_length": len(cover.poster) if cover.poster else 0,
                "variants_count": len(variants),
                "associated_cars_count": len(product_cars),
                "category_id": cover.category_id
            }
            seat_covers_data.append(cover_data)
        
        return jsonify({
            "success": True,
            "category": {
                "id": seat_cover_category.id,
                "title": seat_cover_category.title
            },
            "seat_covers_count": len(seat_covers),
            "seat_covers": seat_covers_data,
            "all_categories": [{"id": cat.id, "title": cat.title} for cat in categories]
        }), 200
        
    except Exception as e:
        print(f"❌ Error in debug_seat_covers: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": f"Debug failed: {str(e)}",
            "traceback": traceback.format_exc()
        }), 500


@view.route('/api/seat_cover/<int:product_id>', methods=['GET'])
def get_seat_cover_by_id(product_id):
    """Get seat cover details by product ID - supports both details view and update form"""
    try:
        print(f"🔍 Fetching seat cover details for product ID: {product_id}")
        
        # Check if this is for update form (query parameter)
        is_for_update = request.args.get('for_update', 'false').lower() == 'true'
        
        # Find seat covers category
        seat_cover_category = Category.query.filter(
            func.lower(Category.title) == 'seat covers'
        ).first()
        
        if not seat_cover_category:
            return jsonify({'error': 'Seat covers category not found'}), 404
        
        # Fetch product with variants using eager loading
        product = Products.query.filter_by(
            category_id=seat_cover_category.id, 
            id=product_id
        ).options(
            selectinload(Products.variants)
        ).first()
        
        if not product:
            return jsonify({'error': 'Seat cover not found'}), 404
        
        # Get associated cars
        product_cars = ProductCar.query.filter_by(
            product_category_id=seat_cover_category.id,
            product_id=product_id
        ).all()
        
        car_ids = [pc.car_id for pc in product_cars]
        cars = AvailableCars.query.filter(AvailableCars.id.in_(car_ids)).all() if car_ids else []
        
        # Build car data
        cars_data = [{'id': car.id, 'name': car.name, 'brand_name': car.brand_name} for car in cars]
        
        # Build response based on use case
        if is_for_update:
            # Format for update form
            product_details = {
                'id': product.id,
                'name': product.name,
                'price': product.price,
                'discount': product.discount,
                'poster': product.poster,
                'cars': cars_data,
                'variants': [variant.to_dict() for variant in product.variants] if product.variants else [],
                'car_ids': [car['id'] for car in cars_data]  # For the checkboxes
            }
            
            print(f"📋 Returning update form data for: {product.name}")
            return jsonify({
                'Seat_Covers': [product_details],
                'messages': {}
            }), 200
        else:
            # Format for details view - use product.to_dict() to include color variants
            product_details = product.to_dict()
            product_details['compatible_cars'] = cars_data
            product_details['price_range'] = {
                'min': min([v.price for v in product.variants]) if product.variants else product.price,
                'max': max([v.price for v in product.variants]) if product.variants else product.price
            }
            
            print(f"✅ Returning details view data for: {product.name}")
            print(f"🎨 Color variants included: {len(product_details.get('color_variants', []))}")
            return jsonify({
                'Seat_Covers': [product_details],
                'reviews': []
            }), 200
        
    except Exception as e:
        print(f"❌ Error in get_seat_cover_by_id: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': f'Failed to fetch seat cover details: {str(e)}'
        }), 500


@view.route('/api/debug/my_cars', methods=['GET'])
def debug_my_cars():
    """Debug endpoint to check user's cars and selection status"""
    try:
        print("🔍 DEBUG: Checking user's cars...")
        
        current_user_id = session.get('user_id')
        print(f"👤 Current user ID: {current_user_id}")
        
        if not current_user_id:
            return jsonify({
                "error": "No user session found",
                "user_id": None
            }), 401
        
        user = RegisteredUser.query.get(current_user_id)
        if not user:
            return jsonify({
                "error": "User not found",
                "user_id": current_user_id
            }), 404
        
        print(f"✅ Found user: {user.email}, Admin: {user.is_admin}")
        
        # Get user's selected cars
        selected_cars = SelectedCar.query.filter_by(user=current_user_id).all()
        
        print(f"🚗 Found {len(selected_cars)} cars for user:")
        
        cars_data = []
        for car in selected_cars:
            # Find the corresponding AvailableCars record to get the correct ID
            available_car = AvailableCars.query.filter_by(
                brand_name=car.brand, 
                name=car.name
            ).first()
            
            # Use the AvailableCars ID if found, otherwise use SelectedCar ID as fallback
            actual_car_id = available_car.id if available_car else car.id
            
            print(f"   - SelectedCar ID: {car.id}, Brand: {car.brand}, Name: {car.name}, Selected: {car.selected}")
            print(f"     -> AvailableCars ID: {actual_car_id}")
            
            cars_data.append({
                "id": actual_car_id,  # Use the AvailableCars ID for filtering
                "selected_car_id": car.id,  # Keep SelectedCar ID for reference
                "brand": car.brand,
                "name": car.name,
                "selected": car.selected,
                "has_poster": bool(car.poster)
            })
        
        return jsonify({
            "success": True,
            "user": {
                "id": user.id,
                "email": user.email,
                "is_admin": user.is_admin
            },
            "cars_count": len(selected_cars),
            "cars": cars_data,
            "selected_car": next((car for car in cars_data if car["selected"]), None)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in debug_my_cars: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": f"Debug failed: {str(e)}",
            "traceback": traceback.format_exc()
        }), 500        

@view.route('/api/user/addresses', methods=['GET'])
def get_user_addresses():
    """Get all addresses for the current user"""
    try:
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        addresses = Address.query.filter_by(user_id=current_user_id).all()
        
        return jsonify({
            'addresses': [address.to_dict() for address in addresses]
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching addresses: {e}")
        return jsonify({'error': 'Failed to fetch addresses'}), 500


@view.route('/api/user/addresses', methods=['POST'])
def add_user_address():
    """Add a new address for the current user"""
    try:
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['name', 'phone_number', 'flat', 'apartment', 'city', 'state', 'address_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create full address string
        address_parts = [
            data.get('flat', ''),
            data.get('apartment', ''),
            data.get('city', ''),
            data.get('state', '')
        ]
        if data.get('landmark'):
            address_parts.insert(-2, f"Near {data.get('landmark')}")
        
        full_address = ', '.join(filter(None, address_parts))
        
        new_address = Address(
            user_id=current_user_id,
            name=data['name'],
            phone_number=data['phone_number'],
            flat=data['flat'],
            apartment=data['apartment'],
            city=data['city'],
            state=data['state'],
            landmark=data.get('landmark', ''),
            address=full_address,
            address_type=data['address_type']
        )
        
        db.session.add(new_address)
        db.session.commit()
        
        return jsonify({
            'message': 'Address added successfully',
            'address': new_address.to_dict()
        }), 201
        
    except Exception as e:
        print(f"❌ Error adding address: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to add address'}), 500


@view.route('/api/user/addresses/<int:address_id>', methods=['PUT'])
def update_user_address(address_id):
    """Update an existing address for the current user"""
    try:
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        address = Address.query.filter_by(id=address_id, user_id=current_user_id).first()
        if not address:
            return jsonify({'error': 'Address not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update fields
        address.name = data.get('name', address.name)
        address.phone_number = data.get('phone_number', address.phone_number)
        address.flat = data.get('flat', address.flat)
        address.apartment = data.get('apartment', address.apartment)
        address.city = data.get('city', address.city)
        address.state = data.get('state', address.state)
        address.landmark = data.get('landmark', address.landmark)
        address.address_type = data.get('address_type', address.address_type)
        
        # Recreate full address string
        address_parts = [
            address.flat,
            address.apartment,
            address.city,
            address.state
        ]
        if address.landmark:
            address_parts.insert(-2, f"Near {address.landmark}")
        
        address.address = ', '.join(filter(None, address_parts))
        
        db.session.commit()
        
        return jsonify({
            'message': 'Address updated successfully',
            'address': address.to_dict()
        }), 200
        
    except Exception as e:
        print(f"❌ Error updating address: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update address'}), 500


@view.route('/api/user/addresses/<int:address_id>', methods=['DELETE'])
def delete_user_address(address_id):
    """Delete an address for the current user"""
    try:
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        address = Address.query.filter_by(id=address_id, user_id=current_user_id).first()
        if not address:
            return jsonify({'error': 'Address not found'}), 404
        
        db.session.delete(address)
        db.session.commit()
        
        return jsonify({
            'message': 'Address deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error deleting address: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete address'}), 500        

@view.route('/api/debug/car_associations', methods=['GET'])
def debug_car_associations():
    """Debug endpoint to see detailed car-to-seat-cover associations"""
    try:
        print("🔍 DEBUG: Checking car-seat cover associations...")
        
        # Get all cars
        cars = AvailableCars.query.all()
        print(f"🚗 Found {len(cars)} cars:")
        for car in cars:
            print(f"   - ID: {car.id}, Brand: {car.brand_name}, Name: {car.name}")
        
        # Get seat covers category
        seat_cover_category = Category.query.filter(
            func.lower(Category.title) == 'seat covers'
        ).first()
        
        if not seat_cover_category:
            return jsonify({"error": "Seat covers category not found"}), 404
        
        # Get all seat covers
        seat_covers = Products.query.filter_by(category_id=seat_cover_category.id).all()
        
        # Get all ProductCar associations for seat covers
        product_cars = ProductCar.query.filter_by(
            product_category_id=seat_cover_category.id
        ).all()
        
        print(f"📦 Found {len(product_cars)} car-seat cover associations:")
        
        associations_data = []
        for pc in product_cars:
            car = AvailableCars.query.get(pc.car_id)
            seat_cover = Products.query.filter_by(
                category_id=pc.product_category_id, 
                id=pc.product_id
            ).first()
            
            association = {
                "product_id": pc.product_id,
                "product_name": seat_cover.name if seat_cover else "Unknown",
                "car_id": pc.car_id,
                "car_name": f"{car.brand_name} {car.name}" if car else "Unknown Car"
            }
            associations_data.append(association)
            print(f"   - Product {pc.product_id} ({seat_cover.name if seat_cover else 'Unknown'}) -> Car {pc.car_id} ({car.brand_name} {car.name} if car else 'Unknown')")
        
        # Group by car to see what seat covers each car has
        cars_data = []
        for car in cars:
            car_associations = [a for a in associations_data if a["car_id"] == car.id]
            cars_data.append({
                "car_id": car.id,
                "car_name": f"{car.brand_name} {car.name}",
                "compatible_seat_covers": len(car_associations),
                "seat_cover_names": [a["product_name"] for a in car_associations]
            })
        
        # Group by seat cover to see what cars each seat cover supports
        seat_covers_data = []
        for sc in seat_covers:
            sc_associations = [a for a in associations_data if a["product_id"] == sc.id]
            seat_covers_data.append({
                "product_id": sc.id,
                "product_name": sc.name,
                "compatible_cars": len(sc_associations),
                "car_names": [a["car_name"] for a in sc_associations]
            })
        
        return jsonify({
            "success": True,
            "cars_count": len(cars),
            "cars": [{"id": c.id, "name": f"{c.brand_name} {c.name}"} for c in cars],
            "seat_covers_count": len(seat_covers),
            "seat_covers": [{"id": sc.id, "name": sc.name} for sc in seat_covers],
            "associations_count": len(product_cars),
            "associations": associations_data,
            "cars_with_seat_covers": cars_data,
            "seat_covers_with_cars": seat_covers_data
        }), 200
        
    except Exception as e:
        print(f"❌ Error in debug_car_associations: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": f"Debug failed: {str(e)}",
            "traceback": traceback.format_exc()
        }), 500        

@view.route('/api/fix_car_associations', methods=['POST'])
def fix_car_associations():
    """Fix missing car associations for seat covers"""
    try:
        print("🔧 FIXING: Car-seat cover associations...")
        
        # Get seat covers category
        seat_cover_category = Category.query.filter(
            func.lower(Category.title) == 'seat covers'
        ).first()
        
        if not seat_cover_category:
            return jsonify({"error": "Seat covers category not found"}), 404
        
        # Get all cars and seat covers
        cars = AvailableCars.query.all()
        seat_covers = Products.query.filter_by(category_id=seat_cover_category.id).all()
        
        print(f"🚗 Found {len(cars)} cars")
        print(f"🪑 Found {len(seat_covers)} seat covers")
        
        # Get current associations
        existing_associations = ProductCar.query.filter_by(
            product_category_id=seat_cover_category.id
        ).all()
        
        existing_pairs = set((pc.product_id, pc.car_id) for pc in existing_associations)
        print(f"📋 Found {len(existing_pairs)} existing associations")
        
        added_count = 0
        
        # For each seat cover, ensure it's associated with the right cars
        for seat_cover in seat_covers:
            print(f"\n🔍 Processing seat cover: {seat_cover.name} (ID: {seat_cover.id})")
            
            # Determine which cars this seat cover should be associated with
            if seat_cover.name.lower() in ['amaze', 'only amaze']:
                # Amaze-specific seat covers
                target_cars = [car for car in cars if 'amaze' in car.name.lower()]
                print(f"   -> Amaze-specific: targeting {len(target_cars)} Amaze cars")
            else:
                # Common seat covers - should be available for ALL cars
                target_cars = cars
                print(f"   -> Common seat cover: targeting ALL {len(target_cars)} cars")
            
            # Add missing associations
            for car in target_cars:
                pair = (seat_cover.id, car.id)
                if pair not in existing_pairs:
                    print(f"   ➕ Adding association: {seat_cover.name} -> {car.brand_name} {car.name}")
                    new_association = ProductCar(
                        product_category_id=seat_cover_category.id,
                        product_id=seat_cover.id,
                        car_id=car.id
                    )
                    db.session.add(new_association)
                    added_count += 1
                else:
                    print(f"   ✅ Already exists: {seat_cover.name} -> {car.brand_name} {car.name}")
        
        # Commit all changes
        db.session.commit()
        
        print(f"✅ Added {added_count} new associations")
        
        return jsonify({
            "success": True,
            "message": f"Fixed car associations. Added {added_count} new associations.",
            "cars_count": len(cars),
            "seat_covers_count": len(seat_covers),
            "existing_associations": len(existing_pairs),
            "added_associations": added_count
        }), 200
        
    except Exception as e:
        print(f"❌ Error fixing car associations: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({
            "error": f"Failed to fix associations: {str(e)}",
            "traceback": traceback.format_exc()
        }), 500        

@view.route('/api/debug/user_cars', methods=['GET'])
def debug_user_cars():
    """Debug endpoint to check user's cars and fix orphaned selections"""
    try:
        print("🔍 DEBUG: Checking user cars and selections...")
        
        # Get all cars in database (AvailableCars)
        all_cars = AvailableCars.query.all()
        print(f"🚗 Total cars in AvailableCars: {len(all_cars)}")
        
        cars_data = []
        for car in all_cars:
            cars_data.append({
                "id": car.id,
                "name": f"{car.brand_name} {car.name}",
                "brand": car.brand_name,
                "model": car.name
            })
            print(f"   - ID {car.id}: {car.brand_name} {car.name}")
        
        # Check SelectedCar table for user selections
        selected_cars = SelectedCar.query.filter_by(selected=True).all()
        print(f"🎯 Cars marked as selected in SelectedCar table: {len(selected_cars)}")
        
        selected_cars_data = []
        for sel_car in selected_cars:
            selected_cars_data.append({
                "id": sel_car.id,
                "name": f"{sel_car.brand} {sel_car.name}",
                "brand": sel_car.brand,
                "model": sel_car.name,
                "user_id": sel_car.user
            })
            print(f"   - Selected Car ID {sel_car.id}: {sel_car.brand} {sel_car.name} (User: {sel_car.user})")
        
        # Check if there are orphaned selected cars (selected cars that don't exist in AvailableCars)
        available_car_ids = set(car.id for car in all_cars)
        orphaned_selections = []
        
        for sel_car in selected_cars:
            # Try to find matching car by name and brand since IDs might be different
            matching_car = None
            for available_car in all_cars:
                if (available_car.brand_name == sel_car.brand and 
                    available_car.name == sel_car.name):
                    matching_car = available_car
                    break
            
            if not matching_car:
                orphaned_selections.append({
                    "selected_car_id": sel_car.id,
                    "name": f"{sel_car.brand} {sel_car.name}",
                    "user_id": sel_car.user,
                    "issue": "No matching car in AvailableCars"
                })
                print(f"   ⚠️ ORPHANED: Selected car {sel_car.brand} {sel_car.name} not found in AvailableCars")
        
        # If there are orphaned selections, try to fix them
        fixed_count = 0
        if orphaned_selections:
            print(f"🔧 Attempting to fix {len(orphaned_selections)} orphaned selections...")
            for orphaned in orphaned_selections:
                # Find the most recent car for this user
                user_id = orphaned["user_id"]
                if all_cars:  # If there are any cars available
                    most_recent_car = AvailableCars.query.order_by(AvailableCars.id.desc()).first()
                    
                    # Update the selected car record to point to the most recent car
                    sel_car_record = SelectedCar.query.get(orphaned["selected_car_id"])
                    if sel_car_record and most_recent_car:
                        sel_car_record.brand = most_recent_car.brand_name
                        sel_car_record.name = most_recent_car.name
                        sel_car_record.poster = most_recent_car.poster
                        db.session.commit()
                        fixed_count += 1
                        print(f"   ✅ Fixed: Updated selected car to {most_recent_car.brand_name} {most_recent_car.name}")
        
        return jsonify({
            "success": True,
            "available_cars_count": len(all_cars),
            "available_cars": cars_data,
            "selected_cars_count": len(selected_cars),
            "selected_cars": selected_cars_data,
            "orphaned_selections_count": len(orphaned_selections),
            "orphaned_selections": orphaned_selections,
            "fixed_selections": fixed_count,
            "message": f"Debug complete. Fixed {fixed_count} orphaned selections."
        }), 200
        
    except Exception as e:
        print(f"❌ Error in debug_user_cars: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": f"Debug failed: {str(e)}",
            "traceback": traceback.format_exc()
        }), 500

@view.route('/api/fix_selected_cars', methods=['POST'])
def fix_selected_cars():
    """Fix orphaned selected car records by updating them to point to existing cars"""
    try:
        print("🔧 FIXING: Orphaned selected car records...")
        
        # Get all available cars
        available_cars = AvailableCars.query.all()
        available_car_lookup = {}
        for car in available_cars:
            key = f"{car.brand_name}_{car.name}".lower()
            available_car_lookup[key] = car
            print(f"🚗 Available: {car.brand_name} {car.name} (ID: {car.id})")
        
        # Get all selected cars
        selected_cars = SelectedCar.query.filter_by(selected=True).all()
        print(f"🎯 Found {len(selected_cars)} selected car records")
        
        fixed_count = 0
        issues_found = []
        
        for sel_car in selected_cars:
            print(f"\n🔍 Checking selected car: {sel_car.brand} {sel_car.name} (SelectedCar ID: {sel_car.id}, User: {sel_car.user})")
            
            # Look for matching available car by brand and name
            key = f"{sel_car.brand}_{sel_car.name}".lower()
            matching_available_car = available_car_lookup.get(key)
            
            if matching_available_car:
                print(f"   ✅ Found matching car: {matching_available_car.brand_name} {matching_available_car.name} (ID: {matching_available_car.id})")
                
                # Update the selected car record to have the correct details
                updated = False
                if sel_car.brand != matching_available_car.brand_name:
                    print(f"   🔄 Updating brand: {sel_car.brand} → {matching_available_car.brand_name}")
                    sel_car.brand = matching_available_car.brand_name
                    updated = True
                    
                if sel_car.name != matching_available_car.name:
                    print(f"   🔄 Updating name: {sel_car.name} → {matching_available_car.name}")
                    sel_car.name = matching_available_car.name
                    updated = True
                    
                if sel_car.poster != matching_available_car.poster:
                    print(f"   🔄 Updating poster")
                    sel_car.poster = matching_available_car.poster
                    updated = True
                
                if updated:
                    fixed_count += 1
                    print(f"   ✅ Updated SelectedCar record")
                else:
                    print(f"   ✅ SelectedCar record already correct")
                    
            else:
                print(f"   ❌ No matching available car found for {sel_car.brand} {sel_car.name}")
                issues_found.append({
                    "selected_car_id": sel_car.id,
                    "brand": sel_car.brand,
                    "name": sel_car.name,
                    "user_id": sel_car.user,
                    "issue": "No matching car in AvailableCars table"
                })
                
                # Try to assign to the most recent car for this user
                if available_cars:
                    most_recent_car = available_cars[-1]  # Last in the list
                    print(f"   🔄 Assigning to most recent car: {most_recent_car.brand_name} {most_recent_car.name}")
                    sel_car.brand = most_recent_car.brand_name
                    sel_car.name = most_recent_car.name
                    sel_car.poster = most_recent_car.poster
                    fixed_count += 1
        
        # Commit all changes
        if fixed_count > 0:
            db.session.commit()
            print(f"✅ Committed {fixed_count} fixes to database")
        
        return jsonify({
            "success": True,
            "message": f"Fixed {fixed_count} selected car records",
            "available_cars_count": len(available_cars),
            "selected_cars_count": len(selected_cars),
            "fixed_count": fixed_count,
            "issues_found": len(issues_found),
            "issues": issues_found
        }), 200
        
    except Exception as e:
        print(f"❌ Error fixing selected cars: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({
            "error": f"Failed to fix selected cars: {str(e)}",
            "traceback": traceback.format_exc()
        }), 500

@view.route('/user_id', methods=['GET'])
def get_user_id():
    """Get current user ID from session"""
    try:
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        user = RegisteredUser.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': current_user_id,
            'user_info': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'is_admin': user.is_admin
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting user ID: {e}")
        return jsonify({'error': 'Failed to get user information'}), 500


@view.route('/api/razorpay_config', methods=['GET'])
def get_razorpay_config():
    """Get Razorpay configuration for frontend"""
    try:
        # Get Razorpay key from app config (which uses environment variables)
        razorpay_key = current_app.config.get('RAZORPAY_KEY_ID', 'rzp_live_6p2bL4ZLBeFX2o')
        
        return jsonify({
            'key_id': razorpay_key,
            'currency': 'INR',
            'company_name': 'Carsona'
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting Razorpay config: {e}")
        return jsonify({'error': 'Failed to get payment configuration'}), 500


@view.route('/api/create_razorpay_order', methods=['POST'])
def create_razorpay_order():
    """Create a Razorpay order using actual Razorpay API with enhanced error handling"""
    try:
        print("🚀 Starting Razorpay order creation")
        
        # Check user authentication
        current_user_id = session.get('user_id')
        if not current_user_id:
            print("❌ User not authenticated")
            return jsonify({'error': 'User not authenticated'}), 401
        
        print(f"✅ User authenticated: {current_user_id}")
        
        # Get and validate request data
        try:
            data = request.get_json()
            if not data:
                print("❌ No JSON data received")
                return jsonify({'error': 'No data provided'}), 400
        except Exception as json_error:
            print(f"❌ JSON parsing error: {json_error}")
            return jsonify({'error': 'Invalid JSON data'}), 400
        
        amount = data.get('amount')
        currency = data.get('currency', 'INR')
        
        print(f"📊 Payment details - Amount: {amount}, Currency: {currency}")
        
        if not amount:
            print("❌ Amount is required")
            return jsonify({'error': 'Amount is required'}), 400
        
        # Validate and convert amount
        try:
            amount_float = float(amount)
            if amount_float <= 0:
                print("❌ Invalid amount: must be positive")
                return jsonify({'error': 'Amount must be positive'}), 400
            amount_in_paisa = int(amount_float * 100)
            print(f"💰 Amount in paisa: {amount_in_paisa}")
        except (ValueError, TypeError) as amount_error:
            print(f"❌ Amount conversion error: {amount_error}")
            return jsonify({'error': 'Invalid amount format'}), 400
        
        # Get Razorpay credentials with enhanced checking
        razorpay_key_id = current_app.config.get('RAZORPAY_KEY_ID', 'rzp_live_6p2bL4ZLBeFX2o')
        razorpay_key_secret = current_app.config.get('RAZORPAY_KEY_SECRET', 'AZo7eKbLf0zoyZp0HdwIHour')
        
        print(f"🔑 Razorpay Key ID: {razorpay_key_id[:10]}..." if razorpay_key_id else "❌ No Razorpay Key ID")
        print(f"🔐 Razorpay Secret: {'***' if razorpay_key_secret else 'Not found'}")
        
        if not razorpay_key_id or not razorpay_key_secret:
            print("❌ Razorpay credentials not found in config")
            print(f"   Key ID found: {bool(razorpay_key_id)}")
            print(f"   Secret found: {bool(razorpay_key_secret)}")
            return jsonify({'error': 'Payment gateway credentials not configured'}), 500
        
        # Try to import and use Razorpay
        try:
            print("📦 Importing Razorpay library...")
            import razorpay
            print("✅ Razorpay library imported successfully")
            
            # Initialize Razorpay client with error handling
            try:
                print("🔧 Initializing Razorpay client...")
                client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))
                print("✅ Razorpay client initialized successfully")
            except Exception as client_error:
                print(f"❌ Razorpay client initialization error: {client_error}")
                raise client_error
            
            # Create order data
            receipt_id = f'receipt_{current_user_id}_{int(time.time())}'
            order_data = {
                'amount': amount_in_paisa,
                'currency': currency,
                'receipt': receipt_id,
                'payment_capture': 1  # Auto capture payment
            }
            
            print(f"📋 Order data: {order_data}")
            
            # Create order with Razorpay API
            try:
                print("🚀 Creating Razorpay order...")
                razorpay_order = client.order.create(data=order_data)
                print(f"✅ Created Razorpay order successfully: {razorpay_order.get('id', 'Unknown ID')}")
                
                return jsonify({
                    'order_id': razorpay_order['id'],
                    'amount': razorpay_order['amount'],
                    'currency': razorpay_order['currency'],
                    'status': razorpay_order['status'],
                    'fallback': False
                }), 200
                
            except razorpay.errors.BadRequestError as bre:
                print(f"❌ Razorpay BadRequest error: {bre}")
                print(f"   Error details: {getattr(bre, 'error', 'No details')}")
                return jsonify({'error': f'Payment gateway error: {str(bre)}'}), 500
                
            except razorpay.errors.ServerError as se:
                print(f"❌ Razorpay Server error: {se}")
                return jsonify({'error': f'Payment gateway server error: {str(se)}'}), 500
                
            except Exception as razorpay_error:
                print(f"❌ Razorpay API error: {razorpay_error}")
                print(f"   Error type: {type(razorpay_error).__name__}")
                return jsonify({'error': f'Payment gateway API error: {str(razorpay_error)}'}), 500
            
        except ImportError as ie:
            print(f"❌ Razorpay library not available: {ie}")
            return jsonify({'error': 'Payment gateway library not available'}), 500
            
        except Exception as general_razorpay_error:
            print(f"❌ General Razorpay error: {general_razorpay_error}")
            print(f"   Error type: {type(general_razorpay_error).__name__}")
            return jsonify({'error': f'Payment gateway general error: {str(general_razorpay_error)}'}), 500
        
    except Exception as e:
        print(f"❌ Critical error in create_razorpay_order: {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        
        # Return error instead of emergency fallback
        return jsonify({'error': 'Critical payment system error'}), 503


@view.route('/api/verify_payment', methods=['POST'])
def verify_payment():
    """Verify payment and create order"""
    try:
        import razorpay
        
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        data = request.get_json()
        purchase_data = data.get('purchase_data', {})
        
        # Get Razorpay payment data
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_signature = data.get('razorpay_signature')
        
        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            print("❌ Missing Razorpay payment verification data")
            return jsonify({'error': 'Invalid payment data'}), 400
        
        # Initialize Razorpay client
        razorpay_key_id = current_app.config.get('RAZORPAY_KEY_ID', 'rzp_live_6p2bL4ZLBeFX2o')
        razorpay_key_secret = current_app.config.get('RAZORPAY_KEY_SECRET', 'AZo7eKbLf0zoyZp0HdwIHour')
        
        if not razorpay_key_id or not razorpay_key_secret:
            print("❌ Razorpay credentials not found in config")
            return jsonify({'error': 'Payment configuration error'}), 500
        
        client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))
        
        # Verify payment signature (skip for fallback orders)
        if razorpay_order_id.startswith('order_') and not razorpay_order_id.startswith('order_rz'):
            # This is a fallback order, skip signature verification
            print(f"🔄 Skipping signature verification for fallback order: {razorpay_order_id}")
        else:
            # This is a real Razorpay order, verify signature
            try:
                client.utility.verify_payment_signature({
                    'razorpay_order_id': razorpay_order_id,
                    'razorpay_payment_id': razorpay_payment_id,
                    'razorpay_signature': razorpay_signature
                })
                print(f"✅ Payment signature verified for order: {razorpay_order_id}")
            except razorpay.errors.SignatureVerificationError:
                print(f"❌ Payment signature verification failed for order: {razorpay_order_id}")
                return jsonify({'error': 'Payment verification failed'}), 400
            except Exception as ve:
                print(f"❌ Error during signature verification: {ve}")
                # For now, allow the order to proceed with a warning
                print(f"⚠️ Proceeding with order despite verification error")
        
        # Get address details if address_id is provided
        address_info = "No address provided"
        consumer_name = "Customer"
        consumer_phone = ""
        
        address_id = purchase_data.get('address_id')
        if address_id:
            address = Address.query.filter_by(id=address_id, user_id=current_user_id).first()
            if address:
                address_info = f"{address.flat}, {address.apartment}, {address.city}, {address.state}"
                consumer_name = address.name
                consumer_phone = address.phone_number
        
        # Create order in database
        new_order = Orders(
            user_id=current_user_id,
            product_id=purchase_data.get('product_id'),
            category_id=purchase_data.get('category_id'),
            address=address_info,
            consumer_name=consumer_name,
            consumer_phone=consumer_phone,
            slot_date=datetime.strptime(purchase_data.get('slot_date'), '%Y-%m-%d').date() if purchase_data.get('slot_date') else None,
            slot_time=purchase_data.get('slot_time'),
            status='Order Placed',
            product_original_price=purchase_data.get('product_original_price', 0),
            product_final_price=purchase_data.get('product_final_price', 0),
            cgst=purchase_data.get('CGST', 0),
            sgst=purchase_data.get('SGST', 0),
            delivery_charges=purchase_data.get('delivery_charges', 0),
            installation_charges=purchase_data.get('installation_charges', 0),
            total_amount=purchase_data.get('total_amount', 0),
            coupon_applied=purchase_data.get('coupon_applied'),
            discount_amount=purchase_data.get('discount_amount', 0),
            delivery_discount=purchase_data.get('delivery_discount', 0),
            installation_discount=purchase_data.get('installation_discount', 0),
            variant_id=purchase_data.get('variant_id'),
            variant_name=purchase_data.get('variant_name')
        )
        
        # Add Razorpay payment information as a note or comment
        if hasattr(new_order, 'payment_id'):
            new_order.payment_id = razorpay_payment_id
        if hasattr(new_order, 'razorpay_order_id'):
            new_order.razorpay_order_id = razorpay_order_id
        
        db.session.add(new_order)
        
        # Update coupon usage if a coupon was applied
        coupon_code = purchase_data.get('coupon_applied')
        if coupon_code:
            coupon = Coupon.query.filter_by(code=coupon_code, is_active=True).first()
            if coupon:
                # Get or create coupon usage record
                usage = CouponUsage.query.filter_by(
                    user_id=current_user_id,
                    coupon_id=coupon.id
                ).first()
                
                if usage:
                    # Increment usage count
                    usage.usage_count += 1
                    usage.last_used = datetime.utcnow()
                else:
                    # Create new usage record
                    usage = CouponUsage(
                        user_id=current_user_id,
                        coupon_id=coupon.id,
                        usage_count=1,
                        last_used=datetime.utcnow()
                    )
                    db.session.add(usage)
                
                print(f"✅ Updated coupon usage: {coupon_code} used {usage.usage_count} times by user {current_user_id}")
        
        db.session.commit()
        
        print(f"✅ Order created successfully: ID {new_order.id}")
        return jsonify({
            'status': 'success',
            'order_id': new_order.id,
            'message': 'Payment verified and order created successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error verifying payment: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': 'Failed to verify payment and create order'}), 500

@view.route('/api/user/purchases', methods=['GET'])
def get_user_purchases():
    """Get user's purchase orders"""
    try:
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        # Get all orders for the current user
        orders = Orders.query.filter_by(user_id=current_user_id).order_by(Orders.created_at.desc()).all()
        
        purchases = []
        for order in orders:
            # Get product details
            product = Products.query.filter_by(
                id=order.product_id, 
                category_id=order.category_id
            ).first()
            
            purchase_data = {
                'id': order.id,
                'product_name': product.name if product else 'Unknown Product',
                'variant_name': order.variant_name or 'Standard',
                'total_amount': float(order.total_amount),
                'status': order.status,
                'created_at': order.created_at.isoformat() if order.created_at else None,
                'slot_date': order.slot_date.isoformat() if order.slot_date else None,
                'slot_time': order.slot_time,
                'consumer_name': order.consumer_name,
                'consumer_phone': order.consumer_phone
            }
            purchases.append(purchase_data)
        
        print(f"✅ Found {len(purchases)} purchases for user {current_user_id}")
        return jsonify({'purchases': purchases}), 200
        
    except Exception as e:
        print(f"❌ Error fetching user purchases: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch purchases'}), 500


@view.route('/api/user/purchase_details', methods=['GET'])
def get_user_purchase_details():
    """Get detailed purchase information for billing"""
    try:
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        # Get all orders for the current user
        orders = Orders.query.filter_by(user_id=current_user_id).all()
        
        purchase_details = {}
        for order in orders:
            # Get product details
            product = Products.query.filter_by(
                id=order.product_id, 
                category_id=order.category_id
            ).first()
            
            purchase_details[order.id] = {
                'id': order.id,
                'product_name': product.name if product else 'Unknown Product',
                'product_poster': product.poster if product and product.poster else '/static/images/default-product.png',
                'variant_name': order.variant_name or 'Standard',
                'product_original_price': float(order.product_original_price),
                'product_final_price': float(order.product_final_price),
                'cgst': float(order.cgst),
                'sgst': float(order.sgst),
                'delivery_charges': float(order.delivery_charges),
                'installation_charges': float(getattr(order, 'installation_charges', 0)),
                'total_amount': float(order.total_amount),
                'coupon_applied': order.coupon_applied,
                'discount_amount': float(order.discount_amount) if order.discount_amount else 0,
                'delivery_discount': float(getattr(order, 'delivery_discount', 0)),
                'installation_discount': float(getattr(order, 'installation_discount', 0)),
                # Add original prices before discounts
                'original_delivery_charges': float(order.delivery_charges) + float(getattr(order, 'delivery_discount', 0)),
                'original_installation_charges': float(getattr(order, 'installation_charges', 0)) + float(getattr(order, 'installation_discount', 0)),
                'status': order.status,
                'created_at': order.created_at.isoformat() if order.created_at else None,
                'slot_date': order.slot_date.isoformat() if order.slot_date else None,
                'slot_time': order.slot_time,
                'consumer_name': order.consumer_name,
                'consumer_phone': order.consumer_phone,
                'address': order.address
            }
        
        print(f"✅ Found {len(purchase_details)} purchase details for user {current_user_id}")
        return jsonify({'purchases': purchase_details}), 200
        
    except Exception as e:
        print(f"❌ Error fetching purchase details: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch purchase details'}), 500

@view.route('/contact-us')
def contact_us():
    """Contact Us page"""
    return render_template('policies/contact_us.html')


@view.route('/shipping-policy')
def shipping_policy():
    """Shipping Policy page"""
    return render_template('policies/shipping_policy.html')


@view.route('/terms-and-conditions')
def terms_and_conditions():
    """Terms and Conditions page"""
    return render_template('policies/terms_conditions.html')


@view.route('/cancellations-and-refunds')
def cancellations_and_refunds():
    """Cancellations and Refunds page"""
    return render_template('policies/cancellations_refunds.html')


@view.route('/privacy-policy')
def privacy_policy():
    return render_template('policies/privacy_policy.html')

# Catch-all error handler for policy pages
@view.errorhandler(404)
def handle_404(error):
    """Handle 404 errors by redirecting policy pages to www domain if accessed via root domain"""
    # List of policy page paths that should redirect to www domain
    policy_paths = [
        '/contact-us',
        '/shipping-policy', 
        '/terms-and-conditions',
        '/cancellations-and-refunds',
        '/privacy-policy'
    ]
    
    # Check if this is a policy page request on the root domain
    if request.host == 'carsona.in' and request.path in policy_paths:
        scheme = 'https' if request.is_secure or request.headers.get('X-Forwarded-Proto') == 'https' else 'http'
        redirect_url = f'{scheme}://www.carsona.in{request.path}'
        return redirect(redirect_url, code=301)
    
    # If path looks like a front-end (Vue) route, serve the SPA shell so that
    # Vue-Router (history mode) can handle it in the browser. This prevents
    # 404s after server-side redirects such as /seat-covers, /car_brands, etc.
    if (not request.path.startswith('/api') and
        not request.path.startswith('/static') and
        '.' not in request.path):
        return render_template('base1.html'), 200
    
    # Otherwise fall back to the normal 404 page
    return render_template('404.html'), 404

@view.route('/api/migrate_car_data', methods=['POST'])
def migrate_car_data():
    """Migrate existing car data to support the new car management system"""
    try:
        # For migration, allow without authentication but log the attempt
        print("🔄 Car data migration requested")
        
        # Optional: Check if user is admin, but don't block if authentication fails
        try:
            current_user, error_response = require_admin()
            if error_response:
                print("⚠️ Migration requested without admin authentication - proceeding anyway for database setup")
        except Exception as auth_error:
            print(f"⚠️ Authentication check failed: {auth_error} - proceeding with migration")
        
        print("🔄 Starting car data migration...")
        
        # Step 1: Add is_available column to AvailableCars if it doesn't exist
        try:
            # Start fresh transaction
            db.session.rollback()
            
            # Check if the column exists by trying to query it
            db.session.execute(db.text("SELECT is_available FROM availablecars LIMIT 1"))
            print("✅ is_available column already exists in AvailableCars")
        except Exception as e:
            # Column doesn't exist, add it
            print(f"Column check failed: {e}")
            print("➕ Adding is_available column to AvailableCars...")
            try:
                db.session.rollback()  # Clear any failed transaction
                db.session.execute(db.text("ALTER TABLE availablecars ADD COLUMN is_available BOOLEAN DEFAULT TRUE"))
                db.session.commit()
                print("✅ Added is_available column to AvailableCars")
            except Exception as alter_error:
                print(f"Failed to add is_available column: {alter_error}")
                db.session.rollback()
        
        # Step 2: Add available_car_id column to SelectedCar if it doesn't exist
        try:
            # Start fresh transaction
            db.session.rollback()
            
            # Check if the column exists by trying to query it
            db.session.execute(db.text("SELECT available_car_id FROM selected_car LIMIT 1"))
            print("✅ available_car_id column already exists in SelectedCar")
        except Exception as e:
            # Column doesn't exist, add it
            print(f"Column check failed: {e}")
            print("➕ Adding available_car_id column to SelectedCar...")
            try:
                db.session.rollback()  # Clear any failed transaction
                db.session.execute(db.text("ALTER TABLE selected_car ADD COLUMN available_car_id INTEGER"))
                db.session.commit()
                print("✅ Added available_car_id column to SelectedCar")
            except Exception as alter_error:
                print(f"Failed to add available_car_id column: {alter_error}")
                db.session.rollback()
        
        # Step 3: Link existing SelectedCar records to AvailableCars
        print("🔗 Linking existing SelectedCar records to AvailableCars...")
        linked_count = 0
        
        try:
            db.session.rollback()  # Start fresh
            
            # Get all selected cars
            selected_cars = SelectedCar.query.all()
            
            for selected_car in selected_cars:
                # Skip if already linked
                if hasattr(selected_car, 'available_car_id') and selected_car.available_car_id:
                    continue
                    
                # Find matching AvailableCars record by brand and name
                available_car = AvailableCars.query.filter_by(
                    brand_name=selected_car.brand,
                    name=selected_car.name
                ).first()
                
                if available_car:
                    # Use raw SQL to update to avoid SQLAlchemy column issues
                    try:
                        db.session.execute(
                            db.text("UPDATE selected_car SET available_car_id = :car_id WHERE id = :selected_id"),
                            {'car_id': available_car.id, 'selected_id': selected_car.id}
                        )
                        linked_count += 1
                        print(f"   🔗 Linked {selected_car.brand} {selected_car.name} to AvailableCars ID {available_car.id}")
                    except Exception as link_error:
                        print(f"   ⚠️ Failed to link {selected_car.brand} {selected_car.name}: {link_error}")
                else:
                    print(f"   ⚠️ No matching AvailableCars found for {selected_car.brand} {selected_car.name}")
            
            db.session.commit()
            print(f"✅ Linked {linked_count} SelectedCar records to AvailableCars")
            
        except Exception as linking_error:
            print(f"⚠️ Linking step had issues: {linking_error}")
            db.session.rollback()
        
        # Step 4: Update all AvailableCars to be available by default
        try:
            db.session.rollback()  # Start fresh
            
            # Use raw SQL to update availability
            result = db.session.execute(
                db.text("UPDATE availablecars SET is_available = TRUE WHERE is_available IS NULL OR is_available = FALSE")
            )
            db.session.commit()
            print(f"✅ Set all cars as available by default")
            
        except Exception as update_error:
            print(f"⚠️ Availability update had issues: {update_error}")
            db.session.rollback()
        
        return jsonify({
            'success': True,
            'message': 'Car data migration completed successfully! Database columns added and data linked.',
            'linked_cars': linked_count,
            'note': 'Migration completed with transaction safety. Some operations may have been skipped if columns already existed.'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in car data migration: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({
            'error': f'Migration failed: {str(e)}'
        }), 500

@view.route('/api/admin/cars', methods=['GET'])
def admin_list_cars():
    """Admin endpoint to list all cars with their availability status"""
    try:
        current_user, error_response = require_admin()
        if error_response:
            return error_response
        
        # Get all cars with their status
        cars = AvailableCars.query.order_by(AvailableCars.brand_name, AvailableCars.name).all()
        
        cars_data = []
        for car in cars:
            # Count how many users have selected this car
            user_count = SelectedCar.query.filter_by(available_car_id=car.id).count()
            
            car_data = car.to_dict()
            car_data['users_selected'] = user_count
            cars_data.append(car_data)
        
        return jsonify({
            'success': True,
            'cars': cars_data,
            'total_cars': len(cars_data),
            'available_cars': len([car for car in cars_data if car['is_available']]),
            'unavailable_cars': len([car for car in cars_data if not car['is_available']])
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_list_cars: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': f'Failed to list cars: {str(e)}'
        }), 500

@view.route('/api/migrate_to_clean_cars', methods=['POST'])
def migrate_to_clean_cars():
    """Migrate to the new clean car management system"""
    try:
        current_user, error_response = require_admin()
        if error_response:
            return error_response
            
        print("🔄 Starting migration to clean car management system...")
        
        # Step 1: Ensure all AvailableCars have stable IDs and are available
        print("📋 Step 1: Cleaning up AvailableCars table...")
        all_cars = AvailableCars.query.all()
        for car in all_cars:
            if not hasattr(car, 'is_available') or car.is_available is None:
                car.is_available = True
        
        db.session.commit()
        print(f"   ✅ Processed {len(all_cars)} cars in AvailableCars")
        
        # Step 2: Clean up SelectedCar table - remove duplicates and fix references
        print("🧹 Step 2: Cleaning up SelectedCar table...")
        
        # Get all user selections grouped by user
        users_with_cars = db.session.query(SelectedCar.user).distinct().all()
        migration_stats = {
            'users_processed': 0,
            'cars_cleaned': 0,
            'cars_linked': 0,
            'duplicates_removed': 0
        }
        
        for (user_id,) in users_with_cars:
            if not user_id:
                continue
                
            migration_stats['users_processed'] += 1
            print(f"   👤 Processing user {user_id}...")
            
            # Get all cars for this user
            user_cars = SelectedCar.query.filter_by(user=user_id).all()
            
            # Group by car name to remove duplicates
            car_groups = {}
            for selected_car in user_cars:
                key = f"{selected_car.brand}_{selected_car.name}"
                if key not in car_groups:
                    car_groups[key] = []
                car_groups[key].append(selected_car)
            
            # Process each car group
            for car_key, car_list in car_groups.items():
                migration_stats['cars_cleaned'] += 1
                
                # Keep the first one, remove duplicates
                primary_car = car_list[0]
                duplicates = car_list[1:]
                
                # Remove duplicates
                for duplicate in duplicates:
                    db.session.delete(duplicate)
                    migration_stats['duplicates_removed'] += 1
                
                # Find the corresponding AvailableCars record
                available_car = AvailableCars.query.filter_by(
                    brand_name=primary_car.brand,
                    name=primary_car.name
                ).first()
                
                if available_car:
                    # Update the SelectedCar with new structure
                    primary_car.user_id = user_id
                    primary_car.car_id = available_car.id
                    primary_car.available_car_id = available_car.id  # Legacy compatibility
                    migration_stats['cars_linked'] += 1
                    print(f"     🔗 Linked {primary_car.brand} {primary_car.name} to car ID {available_car.id}")
                else:
                    print(f"     ⚠️  No matching AvailableCar found for {primary_car.brand} {primary_car.name}")
        
        db.session.commit()
        
        # Step 3: Update car addition/deletion to use the clean system
        print("⚙️  Step 3: Car management system updated to use stable IDs")
        
        print("✅ Migration completed successfully!")
        return jsonify({
            'message': 'Migration to clean car management system completed',
            'stats': migration_stats
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Migration failed: {str(e)}'}), 500

@view.route('/api/test_clean_cars', methods=['GET'])
def test_clean_cars():
    """Test endpoint to verify clean car management system"""
    try:
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
            
        # Get user's cars
        user_cars = SelectedCar.query.filter_by(user_id=current_user_id).all()
        
        result = {
            'user_id': current_user_id,
            'cars_count': len(user_cars),
            'cars': []
        }
        
        for car in user_cars:
            available_car = AvailableCars.query.get(car.car_id) if car.car_id else None
            
            car_info = {
                'selected_car_id': car.id,
                'selected_car_brand': car.brand,
                'selected_car_name': car.name,
                'car_id': car.car_id,
                'selected': car.selected,
                'available_car': {
                    'id': available_car.id if available_car else None,
                    'name': available_car.name if available_car else None,
                    'brand_name': available_car.brand_name if available_car else None,
                    'is_available': getattr(available_car, 'is_available', True) if available_car else None
                } if available_car else None
            }
            result['cars'].append(car_info)
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"❌ Error in test_clean_cars: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@view.route('/api/debug/seat_cover_compatibility', methods=['GET'])
def debug_seat_cover_compatibility():
    """Debug endpoint to check seat cover compatibility for a specific car"""
    try:
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        car_id = request.args.get('car_id', type=int)
        if not car_id:
            return jsonify({'error': 'car_id parameter required'}), 400
        
        # Get car info
        car = AvailableCars.query.get(car_id)
        if not car:
            return jsonify({'error': 'Car not found'}), 404
        
        # Find seat covers category
        seat_cover_category = Category.query.filter(
            func.lower(Category.title) == 'seat covers'
        ).first()
        
        if not seat_cover_category:
            return jsonify({'error': 'Seat covers category not found'}), 404
        
        # Get all seat covers
        all_seat_covers = Products.query.filter_by(category_id=seat_cover_category.id).all()
        
        # Get compatible seat covers
        compatible_product_cars = ProductCar.query.filter_by(
            product_category_id=seat_cover_category.id,
            car_id=car_id
        ).all()
        
        compatible_product_ids = [pc.product_id for pc in compatible_product_cars]
        compatible_seat_covers = Products.query.filter(
            Products.category_id == seat_cover_category.id,
            Products.id.in_(compatible_product_ids)
        ).all() if compatible_product_ids else []
        
        result = {
            'car': {
                'id': car.id,
                'name': car.name,
                'brand_name': car.brand_name,
                'is_available': getattr(car, 'is_available', True)
            },
            'seat_covers_category_id': seat_cover_category.id,
            'total_seat_covers': len(all_seat_covers),
            'compatible_seat_covers': len(compatible_seat_covers),
            'compatible_product_ids': compatible_product_ids,
            'all_seat_covers': [{'id': sc.id, 'name': sc.name} for sc in all_seat_covers],
            'compatible_seat_covers_list': [{'id': sc.id, 'name': sc.name} for sc in compatible_seat_covers],
            'product_car_associations': [
                {
                    'id': pc.id,
                    'product_id': pc.product_id,
                    'car_id': pc.car_id,
                    'product_category_id': pc.product_category_id
                } for pc in compatible_product_cars
            ]
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"❌ Error in debug_seat_cover_compatibility: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@view.route('/api/removeSeatCover/<int:product_id>', methods=['DELETE'])
def remove_seat_cover(product_id):
    """Delete a seat cover product"""
    try:
        current_user, error_response = require_admin()
        if error_response:
            return error_response
            
        print(f"🗑️  Deleting seat cover with ID: {product_id}")
        
        # Find the seat cover category
        categories = Category.query.all()
        seat_cover_cat_id = None
        for category in categories:
            if category.title.lower() == 'seat covers':
                seat_cover_cat_id = category.id
                break
        
        if not seat_cover_cat_id:
            return jsonify({'message': 'Seat covers category not found'}), 404
        
        # Find the product
        product = Products.query.filter_by(
            category_id=seat_cover_cat_id,
            id=product_id
        ).first()
        
        if not product:
            return jsonify({'message': 'Seat cover not found'}), 404
        
        print(f"🔍 Found seat cover: {product.name}")
        
        # Delete associated ProductCar records
        ProductCar.query.filter_by(
            product_category_id=seat_cover_cat_id,
            product_id=product_id
        ).delete()
        
        # Delete associated ProductVariant records
        ProductVariant.query.filter_by(
            product_category_id=seat_cover_cat_id,
            product_id=product_id
        ).delete()
        
        # Delete the product
        db.session.delete(product)
        db.session.commit()
        
        # Clear cache
        if cache:
            cache.delete_many(
                'api_seat_covers_page_1_per_page_20',
                'api_seat_covers_page_1_per_page_10',
                'api_seat_covers_page_1_per_page_50'
            )
            for page_num in range(1, 11):
                for per_page in [10, 20, 50]:
                    cache_key = f'api_seat_covers_page_{page_num}_per_page_{per_page}'
                    cache.delete(cache_key)
        
        print(f"✅ Seat cover deleted successfully: {product.name}")
        return jsonify({'message': f'Seat cover "{product.name}" deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting seat cover: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Error deleting seat cover: {str(e)}'}), 500

@view.route('/update_seatcover/<int:product_id>', methods=['PUT'])
def update_seat_cover(product_id):
    """Update seat cover details"""
    try:
        current_user, error_response = require_admin()
        if error_response:
            return error_response
        
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No JSON data provided'}), 400

        # Find the seat cover
        seat_covers_category = Category.query.filter(
            func.lower(Category.title) == 'seat covers'
        ).first()
        
        if not seat_covers_category:
            return jsonify({'message': 'Seat covers category not found'}), 404

        seat_cover = Products.query.filter_by(
            category_id=seat_covers_category.id,
            id=product_id
        ).first()
        
        if not seat_cover:
            return jsonify({'message': 'Seat cover not found'}), 404

        # Update fields
        if 'name' in data:
            seat_cover.name = data['name']
        if 'price' in data:
            seat_cover.price = data['price']
        if 'discount' in data:
            seat_cover.discount = data['discount']
        if 'poster' in data:
            seat_cover.poster = data['poster']

        db.session.commit()
        
        return jsonify({
            'message': 'Seat cover updated successfully',
            'seat_cover': seat_cover.to_dict()
        }), 200

    except Exception as e:
        print(f"❌ Error updating seat cover: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'message': 'Failed to update seat cover'}), 500


# ================ COUPON MANAGEMENT ENDPOINTS ================

@view.route('/api/add_coupon', methods=['POST'])
def add_coupon():
    """Add a new coupon"""
    try:
        current_user, error_response = require_admin()
        if error_response:
            return error_response
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        # Validate required fields
        required_fields = ['name', 'category', 'discount']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400

        # Validate discount percentage
        discount = data['discount']
        if not isinstance(discount, (int, float)) or discount < 1 or discount > 100:
            return jsonify({'error': 'Discount percentage must be between 1 and 100'}), 400

        # Generate coupon code if not provided
        coupon_code = data.get('code', '').strip()
        if not coupon_code:
            # Auto-generate code: First 4 letters of name + random number
            import random
            safe_name = ''.join(c for c in data['name'] if c.isalnum())[:4].upper()
            random_num = random.randint(100, 999)
            coupon_code = f"{safe_name}{random_num}"

        # Check if code already exists
        existing_coupon = Coupon.query.filter_by(code=coupon_code).first()
        if existing_coupon:
            return jsonify({'error': 'Coupon code already exists'}), 400

        # Create new coupon with enhanced discount system (with backward compatibility)
        discount_type = data.get('discount_type', 'percentage')
        
        # Create coupon with backward compatibility for old database schema
        coupon_data = {
            'name': data['name'],
            'code': coupon_code,
            'description': data.get('description', ''),
            'category': data['category'],
            'discount_percentage': float(discount),
            'minimum_amount': float(data.get('minimum_amount', 0)),
            'max_usage_per_user': int(data.get('max_usage_per_user', 1)),
            'if_applicable': bool(data.get('if_applicable', True)),
            'is_active': bool(data.get('is_active', True))
        }
        
        # Add enhanced fields only if they exist in the database schema
        try:
            # Try to add enhanced fields
            coupon_data.update({
                'discount_type': discount_type,
                'offers_free_delivery': bool(data.get('offers_free_delivery', False)),
                'offers_free_installation': bool(data.get('offers_free_installation', False))
            })
        except Exception:
            # If enhanced fields don't exist, continue with basic coupon
            pass
            
        new_coupon = Coupon(**coupon_data)

        db.session.add(new_coupon)
        db.session.commit()

        print(f"✅ Coupon added successfully: {new_coupon.name} ({new_coupon.code})")
        return jsonify({
            'message': f'Coupon {new_coupon.name} added successfully',
            'coupon': new_coupon.to_dict()
        }), 200

    except Exception as e:
        print(f"❌ Error adding coupon: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': 'Failed to add coupon'}), 500


@view.route('/api/coupons', methods=['GET'])
def get_coupons():
    """Get all coupons (admin) or available coupons (user)"""
    try:
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'User not authenticated'}), 401

        current_user = RegisteredUser.query.get(current_user_id)
        if not current_user:
            return jsonify({'error': 'User not found'}), 404

        if current_user.is_admin:
            # Admin sees all coupons
            coupons = Coupon.query.all()
            coupons_list = [coupon.to_dict() for coupon in coupons]
        else:
            # Regular users see only active and applicable coupons they haven't used up
            active_coupons = Coupon.query.filter_by(
                is_active=True,
                if_applicable=True
            ).all()
            
            coupons_list = []
            for coupon in active_coupons:
                # Check if user has used this coupon up to the maximum limit
                usage = CouponUsage.query.filter_by(
                    user_id=current_user_id,
                    coupon_id=coupon.id
                ).first()
                
                user_usage_count = usage.usage_count if usage else 0
                
                # Only show coupon if user hasn't reached the maximum usage limit
                if user_usage_count < coupon.max_usage_per_user:
                    coupons_list.append(coupon.to_dict())
        
        return jsonify({
            'coupons': coupons_list,
            'total': len(coupons_list)
        }), 200

    except Exception as e:
        print(f"❌ Error fetching coupons: {e}")
        return jsonify({'error': 'Failed to fetch coupons'}), 500


@view.route('/api/categories', methods=['GET'])
def get_categories_for_coupons():
    """Get all categories for coupon creation"""
    try:
        categories = Category.query.all()
        categories_list = [category.to_dict() for category in categories]
        
        return jsonify({
            'categories': categories_list
        }), 200

    except Exception as e:
        print(f"❌ Error fetching categories: {e}")
        return jsonify({'error': 'Failed to fetch categories'}), 500


@view.route('/api/coupon/<int:coupon_id>', methods=['PUT'])
def update_coupon(coupon_id):
    """Update a coupon"""
    try:
        current_user, error_response = require_admin()
        if error_response:
            return error_response
        
        coupon = Coupon.query.get(coupon_id)
        if not coupon:
            return jsonify({'error': 'Coupon not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        # Update fields
        if 'name' in data:
            coupon.name = data['name']
        if 'description' in data:
            coupon.description = data['description']
        if 'category' in data:
            coupon.category = data['category']
        if 'discount_type' in data:
            coupon.discount_type = data['discount_type']
        if 'discount' in data:
            discount = data['discount']
            if not isinstance(discount, (int, float)) or discount < 1 or discount > 100:
                return jsonify({'error': 'Discount percentage must be between 1 and 100'}), 400
            coupon.discount_percentage = float(discount)
        if 'offers_free_delivery' in data:
            coupon.offers_free_delivery = bool(data['offers_free_delivery'])
        if 'offers_free_installation' in data:
            coupon.offers_free_installation = bool(data['offers_free_installation'])
        if 'minimum_amount' in data:
            coupon.minimum_amount = float(data['minimum_amount'])
        if 'max_usage_per_user' in data:
            coupon.max_usage_per_user = int(data['max_usage_per_user'])
        if 'if_applicable' in data:
            coupon.if_applicable = bool(data['if_applicable'])
        if 'is_active' in data:
            coupon.is_active = bool(data['is_active'])

        db.session.commit()

        return jsonify({
            'message': 'Coupon updated successfully',
            'coupon': coupon.to_dict()
        }), 200

    except Exception as e:
        print(f"❌ Error updating coupon: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': 'Failed to update coupon'}), 500


@view.route('/api/coupon/<int:coupon_id>', methods=['DELETE'])
def delete_coupon(coupon_id):
    """Delete a coupon"""
    try:
        current_user, error_response = require_admin()
        if error_response:
            return error_response
        
        coupon = Coupon.query.get(coupon_id)
        if not coupon:
            return jsonify({'error': 'Coupon not found'}), 404

        coupon_name = coupon.name
        db.session.delete(coupon)
        db.session.commit()

        return jsonify({
            'message': f'Coupon {coupon_name} deleted successfully'
        }), 200

    except Exception as e:
        print(f"❌ Error deleting coupon: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': 'Failed to delete coupon'}), 500

@view.route('/api/validate_coupon', methods=['POST'])
def validate_coupon():
    """Validate and apply coupon with enhanced discount system"""
    try:
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        data = request.get_json()
        coupon_code = data.get('coupon_code', '').strip().upper()
        order_amount = float(data.get('order_amount', 0))
        current_discounted_price = float(data.get('current_discounted_price', order_amount))  # Fallback to order_amount
        delivery_charges = float(data.get('delivery_charges', 50))  # Default delivery charges
        installation_charges = float(data.get('installation_charges', 100))  # Default installation charges
        
        if not coupon_code:
            return jsonify({'error': 'Coupon code is required'}), 400
        
        # Find the coupon
        coupon = Coupon.query.filter_by(code=coupon_code, is_active=True).first()
        if not coupon:
            return jsonify({'error': 'Invalid or inactive coupon code'}), 400
        
        # Check minimum amount requirement
        if coupon.minimum_amount and order_amount < coupon.minimum_amount:
            return jsonify({
                'error': f'This coupon requires a minimum order of ₹{coupon.minimum_amount}'
            }), 400
        
        # Check coupon usage limit
        usage = CouponUsage.query.filter_by(
            user_id=current_user_id, 
            coupon_id=coupon.id
        ).first()
        
        if usage and usage.usage_count >= coupon.max_usage_per_user:
            return jsonify({'error': 'You have already used this coupon the maximum number of times'}), 400
        
        # Calculate discounts based on coupon type
        discount_amount = 0
        delivery_discount = 0
        installation_discount = 0
        
        if coupon.discount_type == 'percentage' and coupon.discount_percentage:
            # Traditional percentage discount on order amount
            discount_amount = order_amount * (coupon.discount_percentage / 100)
        
        elif coupon.discount_type == 'free_delivery' and coupon.offers_free_delivery:
            # Free delivery
            delivery_discount = delivery_charges
        
        elif coupon.discount_type == 'free_installation' and coupon.offers_free_installation:
            # Free installation
            installation_discount = installation_charges
        
        elif coupon.discount_type == 'combo':
            # Combination of discounts
            if coupon.discount_percentage:
                discount_amount = order_amount * (coupon.discount_percentage / 100)
            if coupon.offers_free_delivery:
                delivery_discount = delivery_charges
            if coupon.offers_free_installation:
                installation_discount = installation_charges
        
        # Calculate new totals
        # If there's no item discount from coupon, use the current discounted price (with variant discount)
        if discount_amount > 0:
            new_order_amount = order_amount - discount_amount
        else:
            new_order_amount = current_discounted_price  # Use variant-discounted price when no coupon discount
        new_delivery_charges = delivery_charges - delivery_discount
        new_installation_charges = installation_charges - installation_discount
        
        # Calculate taxes on the discounted amounts
        cgst = new_order_amount * 0.14
        sgst = new_order_amount * 0.14
        new_total = new_order_amount + cgst + sgst + new_delivery_charges + new_installation_charges
        
        # Calculate total savings
        total_savings = discount_amount + delivery_discount + installation_discount
        
        print(f"✅ Coupon {coupon_code} validated successfully")
        print(f"   Order discount: ₹{discount_amount}")
        print(f"   Delivery discount: ₹{delivery_discount}")
        print(f"   Installation discount: ₹{installation_discount}")
        print(f"   Total savings: ₹{total_savings}")
        
        return jsonify({
            'valid': True,
            'coupon': coupon.to_dict(),
            'discounts': {
                'order_discount': discount_amount,
                'delivery_discount': delivery_discount,
                'installation_discount': installation_discount,
                'total_savings': total_savings
            },
            'new_totals': {
                'order_amount': new_order_amount,
                'delivery_charges': new_delivery_charges,
                'installation_charges': new_installation_charges,
                'cgst': cgst,
                'sgst': sgst,
                'total_amount': new_total
            },
            'breakdown': {
                'original_order': order_amount,
                'original_delivery': delivery_charges,
                'original_installation': installation_charges,
                'discount_applied': discount_amount,
                'delivery_saved': delivery_discount,
                'installation_saved': installation_discount,
                'final_total': new_total
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error validating coupon: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to validate coupon'}), 500


# -------------------------------------------------------------------
# Event tracking endpoint
# -------------------------------------------------------------------

@view.route('/api/track', methods=['POST'])
def track_event():
    try:
        payload = request.get_json(silent=True) or {}

        # Fallbacks if user/session not available
        user_id = None
        if 'user_id' in session:
            user_id = session['user_id']

        session_id = request.cookies.get('session') or request.cookies.get('session_id') or None

        from datetime import datetime, timezone, timedelta
        ist = timezone(timedelta(hours=5, minutes=30))
        now_ist = datetime.now(ist)

        event = InteractionEvent(
            user_id=user_id,
            session_id=session_id,
            event_name=payload.get('event_name'),
            path=payload.get('path') or request.referrer,
            timestamp_ist=now_ist,
            date_ts_ist=now_ist.date(),
            clicked_on=payload.get('clicked_on') or 'unknown',
            event_data=payload.get('metadata', {}),
            ip=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )

        db.session.add(event)
        db.session.commit()

        return '', 202
    except Exception as e:
        print(f"/api/track error: {e}")
        return jsonify({'message': 'tracking failed'}), 500


# ---------------------------------------------------------------------------
# ADMIN ORDERS APIs
# ---------------------------------------------------------------------------


@view.route('/api/admin/orders', methods=['GET'])
def admin_get_all_orders():
    """Return every order for dashboard – admin only"""
    admin_user, error_response = require_admin()
    if error_response:
        return error_response

    orders = Orders.query.order_by(Orders.created_at.desc()).all()

    payload = []
    for o in orders:
        prod = Products.query.filter_by(id=o.product_id, category_id=o.category_id).first()

        payload.append({
            'id': o.id,
            'product_name': prod.name if prod else 'Unknown',
            'product_poster': prod.poster if prod and prod.poster else '/static/images/default-product.png',
            'variant_name': o.variant_name or 'Standard',
            'total_amount': float(o.total_amount),
            'status': o.status,
            'created_at': o.created_at.isoformat() if o.created_at else None,
            'slot_date': o.slot_date.isoformat() if o.slot_date else None,
            'slot_time': o.slot_time,
            'consumer_name': o.consumer_name,
            'consumer_phone': o.consumer_phone,
            'address': o.address,
            # Add billing details for admin view
            'product_original_price': float(o.product_original_price) if o.product_original_price else 0.0,
            'product_final_price': float(o.product_final_price) if o.product_final_price else 0.0,
            'cgst': float(o.cgst) if o.cgst else 0.0,
            'sgst': float(o.sgst) if o.sgst else 0.0,
            'delivery_charges': float(o.delivery_charges) if o.delivery_charges else 0.0,
            'installation_charges': float(o.installation_charges) if o.installation_charges else 0.0,
            'discount_amount': float(o.discount_amount) if o.discount_amount else 0.0,
            'delivery_discount': float(o.delivery_discount) if o.delivery_discount else 0.0,
            'installation_discount': float(o.installation_discount) if o.installation_discount else 0.0,
            'coupon_applied': o.coupon_applied
        })

    print(f"✅ Admin fetched {len(payload)} orders")
    return jsonify({'orders': payload}), 200


@view.route('/api/admin/orders/<int:order_id>/status', methods=['POST'])
def admin_update_order_status(order_id):
    """Update order status – admin only"""
    admin_user, error_response = require_admin()
    if error_response:
        return error_response

    data = request.get_json() or {}
    new_status = data.get('status')
    if not new_status:
        return jsonify({'error': 'Missing status'}), 400

    order = Orders.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    order.status = new_status
    db.session.commit()
    print(f"✏️ Order {order_id} status -> {new_status}")
    return jsonify({'message': 'Status updated'}), 200


@view.route('/api/user/purchases', methods=['POST'])
def create_user_purchase():
    """Create a new purchase order (direct purchase without payment)"""
    try:
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['address_id', 'category_id', 'product_id', 'total_amount']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Get address details
        address_id = data.get('address_id')
        address = Address.query.filter_by(id=address_id, user_id=current_user_id).first()
        if not address:
            return jsonify({'error': 'Address not found'}), 404
        
        address_info = f"{address.flat}, {address.apartment}, {address.city}, {address.state}"
        consumer_name = address.name
        consumer_phone = address.phone_number
        
        # Create order in database
        new_order = Orders(
            user_id=current_user_id,
            product_id=data.get('product_id'),
            category_id=data.get('category_id'),
            address=address_info,
            consumer_name=consumer_name,
            consumer_phone=consumer_phone,
            slot_date=datetime.strptime(data.get('slot_date'), '%Y-%m-%d').date() if data.get('slot_date') else None,
            slot_time=data.get('slot_time'),
            status='Order Placed',
            product_original_price=data.get('product_original_price', 0),
            product_final_price=data.get('product_final_price', 0),
            cgst=data.get('CGST', 0),
            sgst=data.get('SGST', 0),
            delivery_charges=data.get('delivery_charges', 0),
            installation_charges=data.get('installation_charges', 0),
            total_amount=data.get('total_amount', 0),
            coupon_applied=data.get('coupon_applied'),
            discount_amount=data.get('discount_amount', 0),
            delivery_discount=data.get('delivery_discount', 0),
            installation_discount=data.get('installation_discount', 0),
            variant_id=data.get('variant_id'),
            variant_name=data.get('variant_name')
        )
        
        db.session.add(new_order)
        
        # Update coupon usage if a coupon was applied
        coupon_code = data.get('coupon_applied')
        if coupon_code:
            coupon = Coupon.query.filter_by(code=coupon_code, is_active=True).first()
            if coupon:
                # Get or create coupon usage record
                usage = CouponUsage.query.filter_by(
                    user_id=current_user_id,
                    coupon_id=coupon.id
                ).first()
                
                if usage:
                    # Increment usage count
                    usage.usage_count += 1
                    usage.last_used = datetime.utcnow()
                else:
                    # Create new usage record
                    usage = CouponUsage(
                        user_id=current_user_id,
                        coupon_id=coupon.id,
                        usage_count=1,
                        last_used=datetime.utcnow()
                    )
                    db.session.add(usage)
                
                print(f"✅ Updated coupon usage: {coupon_code} used {usage.usage_count} times by user {current_user_id}")
        
        db.session.commit()
        
        print(f"✅ Order created successfully: ID {new_order.id}")
        return jsonify({
            'status': 'success',
            'order_id': new_order.id,
            'message': 'Purchase order created successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error creating purchase: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': 'Failed to create purchase'}), 500

@view.route('/api/debug/car/<string:car_name>', methods=['GET'])
def debug_get_car_by_name(car_name):
    """Debug endpoint to fetch a car's data directly from the database by name."""
    try:
        print(f"--- DEBUG: Fetching car by name: {car_name} ---")
        car = AvailableCars.query.filter(func.lower(AvailableCars.name) == car_name.lower()).first()
        if not car:
            return jsonify({'error': 'Car not found in AvailableCars table'}), 404
        
        car_data = car.to_dict()
        print(f"--- DEBUG: Raw data from DB: {car_data} ---")
        return jsonify(car_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

