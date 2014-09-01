import json

from flask import render_template
from flask import request
from flask import make_response
from flask.helpers import flash
from flask import redirect
from flask import url_for
from flask import session
from flask import Response
from flask import jsonify
from flask.ext.socketio import emit

from siege.service import app, db, socketio
from siege.decorators import ensure_device
from siege.models import Device

@app.route('/')
def index():
    response = make_response(render_template('index.html'))
    if not request.cookies.get('device_id'):
            new_device = Device.create(request.remote_addr,
                                       request.user_agent)
            response.set_cookie('device_id', new_device.id)
    return response

@socketio.on('click-event', namespace='/game')
def click_event(message):
    from siege.service import game_manager
    # Required for an "attack-input"
    # Device-ID
    # Territory-ID
    if not game_manager:
        print 'Game manager not initialized here...'
        return
    game_manager.register_click(message)
