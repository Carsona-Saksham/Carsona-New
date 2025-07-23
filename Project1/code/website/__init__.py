from flask import Flask, request, redirect, url_for, render_template, current_app
from flask_sqlalchemy import SQLAlchemy
from os import path
from flask_login import LoginManager
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from flask_migrate import Migrate
from authlib.integrations.flask_client import OAuth
import os
from flask_compress import Compress
from werkzeug.utils import secure_filename


db = SQLAlchemy()
oauth = OAuth()  # Initialize at module level so it can be imported

DB_NAME = "database32.db"


def create_app():
    app = Flask(__name__)
    
    # Basic Flask configuration
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # POINT UPLOAD FOLDER TO RENDER'S PERSISTENT DISK
    # The disk is mounted at '/var/data/static', and we'll save uploads there.
    # We still serve them from the '/static' URL path.
    app.config['UPLOAD_FOLDER'] = '/var/data/static'
    
    app.config['APP_NAME'] = 'Carsona'
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    
    # Note: Other configurations will be set from config.py in main.py
    # Don't initialize database here - it will be done after config is loaded

    # Set URL scheme based on environment
    if os.environ.get('FLASK_ENV') == 'production':
        # In production, prefer HTTPS but allow override via BASE_URL
        base_url_env = os.environ.get('BASE_URL', 'https://www.carsona.in')
        scheme = 'https' if base_url_env.startswith('https://') else 'http'
        app.config['PREFERRED_URL_SCHEME'] = scheme
    else:
        app.config['PREFERRED_URL_SCHEME'] = 'http'

    # Add domain and HTTPS redirect handler
    @app.before_request
    def force_https_and_www():
        """Handle domain redirects while working with GoDaddy forwarding"""
        if os.environ.get('FLASK_ENV') == 'production':
            # Get the host and scheme from the request
            host = request.host.lower()
            scheme = request.headers.get('X-Forwarded-Proto', request.scheme)
            path = request.full_path.rstrip('?')
            
            # Define our target using environment variables for flexibility
            target_host = os.environ.get('DOMAIN_NAME', 'www.carsona.in')
            target_scheme = 'https'
            
            # Only redirect if a custom domain is set and we're not already there
            if target_host and (host != target_host or scheme != target_scheme):
                # But don't redirect if we are on the Render default domain
                if '.onrender.com' in host:
                    return

                target_url = f'{target_scheme}://{target_host}{path}'
                current_url = f'{scheme}://{host}{path}'
                
                if current_url != target_url:
                    return redirect(target_url, code=301)

    jwt = JWTManager(app)
    
    # Initialize OAuth with app
    oauth.init_app(app)
    
    # Enable gzip compression for JSON responses
    Compress(app)
    
    # Determine the base URL for OAuth redirects
    # In production, use the custom domain; in development, use localhost
    if os.environ.get('FLASK_ENV') == 'production':
        # Use custom domain for production - prefer www subdomain
        # Support both HTTP and HTTPS based on BASE_URL env var
        base_url = os.environ.get('BASE_URL', 'https://www.carsona.in')
    else:
        base_url = 'http://localhost:5000'
    
    print(f"OAuth Base URL: {base_url}")
    
    # Register Google OAuth provider
    google = oauth.register(
        name='google',
        client_id='457880516266-el37kc2ld1ua3gtjrq9j2dksgom2f0ou.apps.googleusercontent.com',
        client_secret='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',
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile'
        },
        # Set the redirect URI dynamically
        redirect_uri=f"{base_url}/login/callback"
    )
    
    from .views import view
    app.register_blueprint(view, url_prefix='/')

    # ----------------------
    # SPA fallback for history mode
    # ----------------------
    @app.errorhandler(404)
    def spa_fallback(error):
        """Serve the Vue single-page app for any unknown non-API route so that
        client-side routing can handle it (avoids 404 after OAuth redirect)."""
        # Let API/static/asset paths return real 404s
        if (request.path.startswith('/api')
                or request.path.startswith('/static')
                or '.' in request.path):
            return error, 404

        # Serve the SPA shell (same template used for index)
        return render_template('base1.html'), 200

    return app

def init_db(app):
    """Initialize database after configuration is loaded"""
    print(f"Initializing database with URI: {app.config.get('SQLALCHEMY_DATABASE_URI')}")
    
    db.init_app(app)
    migrate = Migrate(app, db)
    migrate.init_app(app, db)

    # Import ALL models to ensure they're registered with SQLAlchemy
    from .models import (RegisteredUser, Address, SelectedCar, Category, Coupon, 
                        CouponUsage, ProductCar, Products, Availablebrands, 
                        AvailableCars, Orders, Theaters, Movie, Show, Ticket, 
                        ProductVariant, InteractionEvent)
    
    print("All models imported successfully")
    create_database(app)

    login_manager = LoginManager()
    login_manager.login_view = 'view.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(id):
        return RegisteredUser.query.get(int(id))

def create_database(app):
    # For PostgreSQL (production), always try to create tables
    # For SQLite (development), check if file exists first
    database_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    
    print(f"Creating database with URI: {database_uri}")
    
    if database_uri.startswith('postgresql://') or database_uri.startswith('postgres://'):
        # PostgreSQL - always create tables (they won't be recreated if they exist)
        with app.app_context():
            try:
                print("Creating all database tables...")
                
                # Try to create tables - this might fail if new columns don't exist yet
                try:
                    db.create_all()
                    print('✅ Database tables created/verified successfully!')
                except Exception as table_error:
                    print(f'⚠️ Table creation had issues (likely missing columns): {table_error}')
                    print('This is expected before migration - continuing...')
                
                # Verify tables were created by listing them
                from sqlalchemy import text
                try:
                    result = db.session.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public';"))
                    tables = [row[0] for row in result]
                    print(f"Tables in database: {tables}")
                except Exception as verify_error:
                    print(f'Could not verify tables: {verify_error}')
                
            except Exception as e:
                print(f'❌ Database initialization error: {e}')
                # Don't raise the error - let the app continue to run so migration can be performed
                print('App will continue running to allow migration...')
    elif not path.exists('website/' + DB_NAME):
        # SQLite - only create if file doesn't exist
        with app.app_context():
            try:
                db.create_all()
                print('SQLite database created!')
            except Exception as e:
                print(f'SQLite database creation error: {e}')
                raise e