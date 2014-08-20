import json

from flask import render_template
from flask import request
from flask.helpers import flash
from flask import redirect
from flask import url_for
from flask import Response
from flask import jsonify

from siege.service import app, db

@app.route('/')
def index():
    return render_template('scoring.html')

