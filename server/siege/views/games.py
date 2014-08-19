import json

from flask import render_template
from flask import request
from flask.helpers import flash
from flask import redirect
from flask import url_for
from flask import jsonify

from siege.service import app
from siege.models import Game

@app.route('/games')
def games_index():
    response = jsonify([g.to_dict() for g in Game.query.all()])
    return response

@app.route('/games/current')
def games_current():
    return 'current'