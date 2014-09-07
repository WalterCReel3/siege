from flask import request
from flask import make_response
from flask import render_template

from siege.service import app, socketio, get_game_manager
from siege.decorators import ensure_device
from siege.views.view_utils import jsonate
from siege.models import Game, Device, Player

@app.route('/game')
@ensure_device
def game():
    response = make_response(render_template('scoring.html'))
    return response


@app.route('/game/info')
def game_info():
    if not request.cookies.get('device_id'):
        abort(404, 'Device not found')
    device_id = request.cookies.get('device_id')
    device = Device.query.get(device_id)
    if not device:
        abort(404, 'Device not found')
    game = Game.current()
    player = Player.current(device_id)
    ret = dict(game=game.to_dict(),
               player=player.to_dict(),
               device=device.to_dict())
    response = jsonate(ret)
    return response


@socketio.on('click-event', namespace='/game')
def click_event(message):
    game_manager = get_game_manager()
    if not game_manager:
        return # too early.. game loop not initialized

    device_id = message.get('device_id')
    territory = message.get('territory', None)
    if not device_id:
        device_id = request.cookies.get('device_id')
    game_manager.register_click(device_id, territory)
