from flask import render_template
from flask import request
from flask import make_response

from siege.service import app
from siege.models import Device

@app.route('/_location')
def location():
    response = make_response(render_template('location.html'))
    return response

@app.route('/_roam')
def roam():
    response = make_response(render_template('roam.html'))
    return response
