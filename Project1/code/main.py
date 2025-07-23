import os
from socket import timeout
from website import create_app, init_db
from celery_worker import make_celery
from sqlalchemy import and_
from celery.result import AsyncResult
from flask import send_file,jsonify
from celery.schedules import crontab
from website.models import *
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from sqlalchemy import not_
from flask_caching import Cache
from config import config

# Debug: Print environment variables
print("=== ENVIRONMENT DEBUG ===")
print(f"FLASK_ENV: {os.environ.get('FLASK_ENV')}")
print(f"DATABASE_URL: {os.environ.get('DATABASE_URL')}")
print(f"REDIS_URL: {os.environ.get('REDIS_URL')}")
print("========================")

# Get environment (default to development)
config_name = os.environ.get('FLASK_ENV', 'development')
print(f"Using config: {config_name}")

app = create_app()

# Initialize caching
cache = Cache()

def setup_config():
    """Setup configuration based on environment"""
    if os.environ.get('FLASK_ENV') == 'production':
        # Production configuration
        app.config['SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'fallback-secret-key')
        app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'fallback-secret-key')
        
        # PostgreSQL configuration for production
        database_url = os.environ.get('DATABASE_URL')
        if database_url and database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
        
        # Redis caching for production
        redis_url = os.environ.get('REDIS_URL')
        if redis_url:
            app.config['CACHE_TYPE'] = 'RedisCache'
            app.config['CACHE_REDIS_URL'] = redis_url
        else:
            app.config['CACHE_TYPE'] = 'SimpleCache'
            
        app.config['CACHE_DEFAULT_TIMEOUT'] = 300  # 5 minutes
        
        print("✅ Production configuration loaded")
        print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI'][:50]}...")
        print(f"Cache Type: {app.config['CACHE_TYPE']}")
        
    else:
        # Development configuration
        app.config['SECRET_KEY'] = 'dev-secret-key-change-in-production'
        app.config['JWT_SECRET_KEY'] = 'dev-jwt-secret-key'
        
        # Use absolute path for SQLite database to avoid pathing issues
        basedir = os.path.abspath(os.path.dirname(__file__))
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'website/database32.db')
        
        # Simple cache for development
        app.config['CACHE_TYPE'] = 'SimpleCache'
        app.config['CACHE_DEFAULT_TIMEOUT'] = 60  # 1 minute for development
        
        print("✅ Development configuration loaded")

# Setup configuration
setup_config()

# Add OAuth redirect URI configuration
if os.environ.get('FLASK_ENV') == 'production':
    # Production OAuth configuration
    app.config['PREFERRED_URL_SCHEME'] = 'https'
    app.config['SERVER_NAME'] = os.environ.get('DOMAIN_NAME', None)  # Will be set for custom domain
else:
    # Development OAuth configuration  
    app.config['PREFERRED_URL_SCHEME'] = 'http'

# Initialize cache
cache.init_app(app)

# Initialize database after configuration
init_db(app)

# Update Celery configuration
app.config.update(
    CELERY_BROKER_URL=app.config.get('CELERY_BROKER_URL'),
    CELERY_RESULT_BACKEND=app.config.get('CELERY_RESULT_BACKEND')
)
celery = make_celery(app)

@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Calls test('hello') every 10 seconds.
    sender.add_periodic_task(12.0, send_reminder.s(), name=' evreminder every 10')
    # sender.add_periodic_task(10.0, send_monthly_report.s(), name='report every 10')
    # Executes every midnight on 1th day of month
    # sender.add_periodic_task(
    #     crontab(hour=10, minute=0, day_of_month=1),
    #     send_monthly_report.s(),
    # )

    # # Calls send_reminder every day at 8:30 pm
    # sender.add_periodic_task(
    #     crontab(hour=20, minute=30),
    #     send_reminder.s(),
    # )


def send_email(to_address, subject, message):
    msg = MIMEMultipart()
    msg['Subject'] = subject
    msg['From'] = 'yo@abc.com'
    msg['To'] = to_address
    msg.attach(MIMEText(message, "html"))

    s = smtplib.SMTP(host="localhost", port=1025)
    print("sending")
    s.login("user@gmail.com", "pass")
    s.send_message(msg)
    s.quit()
    return True




@celery.task()
def send_reminder():

    print("Reminder job starting")

    time_period = timedelta(days=2)
    cutoff_time = datetime.utcnow() - time_period

    users = RegisteredUser.query.filter(
        not_(
            RegisteredUser.booked_ti.any(Ticket.timinig_s>= cutoff_time)
        )
    ).all()
    print(users)
    for user in users:
        if user.is_admin == True:
            print(user.email)
            continue
            
        else:
            print(user)
            send_email(user.email, "reminder","This is a reminder to book tickets")


@celery.task()
def send_monthly_report():
    print("Monthly report job starting")

    time_period = timedelta(days=30)
    cutoff_time = datetime.utcnow() - time_period


    users = RegisteredUser.query.all()
    for i in range(len(users)):
        if users[i].is_admin==False:
            print(users[i].is_admin)
        
            tickets = Ticket.query.filter(
                and_(
                    Ticket.user == users[i].id,
                    Ticket.timinig_s >= cutoff_time
                )
            ).all()

            email_content = """
            <html>
            <body>
            <table border="1" style="width:100%">
            <tr>
                <th>Movie</th>
                <th>Theater</th>
                <th>Time</th>
            </tr>
            """
            for ticket in tickets:
                email_content += f"<tr><td>{ticket.movie}</td><td>{ticket.t}</td><td>{ticket.timinig_s}</td></tr>\n"
                print(ticket.movie)
            email_content += "</table></body></html>"
                
            send_email(users[i].email, "Monthly Entertainment Report", email_content)


@celery.task()
def generate_csv(theater_id):
    import csv

    theater = Theaters.query.get(theater_id)
    print("job starting")

    if theater is None:
        return "Theater not found"


    fields = ['ID', 'Name', 'Address', 'AdminID']  
    rows = [[theater.id, theater.name, theater.address, theater.theater_admin_id]]  
    print(rows)

    filename = "website/static/data.csv"

    with open(filename, 'w', newline='') as csvfile:
        csvwriter = csv.writer(csvfile)
        csvwriter.writerow(fields)
        csvwriter.writerows(rows)

    return f"CSV for theater {theater_id} generated"



@app.route("/trigger-celery-job/<int:theater_id>")
def trigger_celery_job(theater_id):
    a = generate_csv.delay(theater_id)
    return{
        "Task_ID" : a.id, 
        "Task_State" : a.state,
        "Task_Result" : a.result
    }



@app.route("/status/<id>")
def check_status(id):
    res = AsyncResult(id, app = celery)
    return {
        "Task_ID" : res.id,
        "Task_State" : res.state,
        "Task_Result" : res.result
    }

@app.route("/download-file")
def download_file():
    return send_file("static/data.csv")


@cache.cached(timeout=50,key_prefix='get_all_movies')
def get_all_movies():
    movies = Movie.query.all()
    return movies


@app.route('/movies_user', methods=['GET'])
def movies_user():
    movies = get_all_movies()
    return jsonify({
        'movies': [movie.to_dict() for movie in movies]
    }), 200


if __name__ == "__main__":
    # For local development
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

# Carsona Application - Car Accessories E-commerce Platform
# Updated: Brand deletion functionality added - Deployment trigger

# Enhanced Billing System - v2.0 with Installation Charges & Flexible Coupons
# This version includes:
# - Installation charges in billing
# - Enhanced coupon system (percentage, free delivery, free installation, combo)
# - Detailed billing breakdown
# - New coupon validation API