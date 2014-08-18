import json

from flask import render_template
from flask import request
from flask.helpers import flash
from flask import redirect
from flask import url_for

from siege.service import app
from siege.models import Game
from siege.views.view_utils import *

@app.route('/games')
def games_index():
    return json_response(Game.query.all(), Game.json_dict)

@app.route('/games/current')
def games_current():
    return 'current'