from flask import request
from flask import make_response
from flask import render_template

from siege.service import app, socketio
from siege.decorators import ensure_device

@app.route('/game')
@ensure_device
def game():
    response = make_response(render_template('scoring.html'))
    return response

@socketio.on('click-event', namespace='/game')
def click_event(message):
    from siege.service import game_manager
    if not game_manager:
        return # too early.. game loop not initialized

    device_id = request.cookies.get('device_id')
    game_manager.register_click(device_id)
