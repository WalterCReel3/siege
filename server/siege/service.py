import os

from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy

from itsdangerous import URLSafeTimedSerializer

FLASK_APP_DIR = os.path.dirname(os.path.abspath(__file__))

# Don't import any modules that use DB models up here; import them as required
# but after db.configure_db has been executed.  This file is the only file that
# requires this special treatment.  Other files can import and use models freely.

app = Flask(__name__)

# Loaded by run
base = None
config = None
db = None
cookie_serializer = None


def populate_initial_data(config, db):
    from siege.models import Device

    # Populate the initial data
    for initial_device in config['init']['devices']:
        if not Device.query.get(initial_device['id']):
            new_device = Device(id=initial_device['id'],
                                bonus=initial_device['bonus'],
                                comment=initial_device['comment'])
            db.session.add(new_device)

    db.session.commit()


def run(the_config):
    global base, app, config, db, cookie_serializer
    config = the_config

    app.secret_key = config['flask']['session_secret_key']

    # Cookie serializer
    cookie_serializer = URLSafeTimedSerializer(app.secret_key)

    # Configure the database before importing any other packages that use DB models.
    app.config['SQLALCHEMY_DATABASE_URI'] = config['db']['uri']
    app.config['SQLALCHEMY_ECHO'] = config['db']['echo']
    db = SQLAlchemy(app)

    # Import all models so SQLAlchemy knows about their relationships
    import siege.models

    # Create all models
    db.create_all()

    # Import the views to enable Flask handlers
    import siege.views

    populate_initial_data(config, db)

    app.run(host=config['flask']['bind'], debug=config['flask']['debug'])