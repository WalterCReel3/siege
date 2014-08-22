import json

from flask import render_template
from flask import request
from flask.helpers import flash
from flask import redirect
from flask import url_for
from flask import session
from flask import Response
from flask import jsonify
from flask.ext.socketio import emit

from siege.service import app, db, socketio

@app.route('/')
def index():
    return render_template('scoring.html')

@socketio.on('click-event', namespace='/test')
def click_event(message):
    emit('game-update', message, namespace='/test', broadcast=True)
