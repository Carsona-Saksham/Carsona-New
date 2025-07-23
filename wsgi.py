#!/usr/bin/env python3
"""
WSGI entry point for Hostinger deployment
This file serves as the entry point for the Carsona Flask application
"""

import sys
import os

# Add the project directory to Python path
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Project1', 'code'))

# Set environment variables for production
os.environ.setdefault('FLASK_ENV', 'production')

# Import the Flask application
try:
    from Project1.code.main import app as application
    
    # Ensure the app is properly configured
    if application.config.get('SECRET_KEY') == 'dev-secret-key-change-in-production':
        print("WARNING: Using default development secret key in production!")
    
    print("✅ WSGI application loaded successfully")
    print(f"Flask app: {application}")
    print(f"Environment: {os.environ.get('FLASK_ENV')}")
    
except ImportError as e:
    print(f"❌ Failed to import Flask application: {e}")
    raise

# For compatibility with different WSGI servers
app = application

if __name__ == "__main__":
    # For testing the WSGI file directly
    application.run(host='0.0.0.0', port=5000, debug=False) 