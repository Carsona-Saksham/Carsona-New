import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-change-in-production'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'your-jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Session Configuration
    SESSION_COOKIE_SECURE = True  # Only send cookies over HTTPS in production
    SESSION_COOKIE_HTTPONLY = True  # Prevent XSS attacks
    SESSION_COOKIE_SAMESITE = 'Lax'  # CSRF protection
    
    # Request Configuration - Handle large base64 images
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB max request size
    
    # Razorpay Configuration
    RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID') or 'rzp_live_6p2bL4ZLBeFX2o'
    RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET') or 'AZo7eKbLf0zoyZp0HdwIHour'

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///instance/database31.db'
    CELERY_BROKER_URL = 'redis://localhost:6379'
    CELERY_RESULT_BACKEND = 'redis://localhost:6379'
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_HOST = 'localhost'
    CACHE_REDIS_PORT = 6379
    
    # Development session settings (less strict)
    SESSION_COOKIE_SECURE = False  # Allow HTTP in development

class HostingerConfig(Config):
    """Configuration specific to Hostinger hosting"""
    DEBUG = False
    
    # MySQL Database Configuration for Hostinger
    # Hostinger typically provides MySQL databases
    database_url = os.environ.get('DATABASE_URL')
    
    # Handle different database URL formats
    if database_url:
        if database_url.startswith('postgres://'):
            # Convert PostgreSQL URL to MySQL if migrating
            database_url = database_url.replace('postgres://', 'mysql://', 1)
        elif database_url.startswith('postgresql://'):
            database_url = database_url.replace('postgresql://', 'mysql://', 1)
    else:
        # Default MySQL connection for Hostinger
        db_user = os.environ.get('DB_USER', 'your_db_user')
        db_password = os.environ.get('DB_PASSWORD', 'your_db_password')
        db_host = os.environ.get('DB_HOST', 'localhost')
        db_name = os.environ.get('DB_NAME', 'your_db_name')
        database_url = f'mysql://{db_user}:{db_password}@{db_host}/{db_name}'
    
    SQLALCHEMY_DATABASE_URI = database_url
    
    # Cache Configuration
    # Use simple cache if Redis is not available on Hostinger
    redis_url = os.environ.get('REDIS_URL')
    if redis_url:
        CACHE_TYPE = 'RedisCache'
        CACHE_REDIS_URL = redis_url
        CELERY_BROKER_URL = redis_url
        CELERY_RESULT_BACKEND = redis_url
    else:
        CACHE_TYPE = 'SimpleCache'
        # Fallback to filesystem for Celery if Redis not available
        CELERY_BROKER_URL = 'filesystem://'
        CELERY_RESULT_BACKEND = 'cache+memory://'
    
    # Hostinger-specific settings
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'connect_args': {
            'connect_timeout': 60,
            'charset': 'utf8mb4'
        }
    }

class ProductionConfig(Config):
    """Generic production configuration"""
    DEBUG = False
    
    # Handle PostgreSQL URL compatibility
    database_url = os.environ.get('DATABASE_URL')
    if database_url and database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_DATABASE_URI = database_url or 'sqlite:///instance/database31.db'
    
    # Redis Configuration
    CELERY_BROKER_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379'
    CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL') or 'redis://localhost:6379'
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL')

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'hostinger': HostingerConfig,
    'default': DevelopmentConfig
} 