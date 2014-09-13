import random

from flask import abort
from flask import request
from flask import redirect

from siege.service import app, config, get_game_manager
from siege.decorators import ensure_device
from siege.models import Device
from siege.models import Game
from siege.models import Player


@app.route('/game/join/<clan_id>')
@ensure_device
def game_join_clan(clan_id):
    device_id = request.cookies.get('device_id')
    device = Device.query.get(device_id)
    if not device:
        abort(403, 'No device found')

    player = Player.current(device.id)
    if player:
        return redirect('/game', code=302)

    current_game = Game.current()
    if not current_game:
        abort(404, 'No current game')

    game = get_game_manager()
    game.create_player(device, clan_id=int(clan_id))

    return redirect('/game', code=302)


@app.route('/game/join')
@ensure_device
def game_join():
    device_id = request.cookies.get('device_id')
    device = Device.query.get(device_id)
    if not device:
        abort(403, 'No device found')

    player = Player.current(device.id)
    if player:
        return redirect('/game', code=302)

    current_game = Game.current()
    if not current_game:
        abort(404, 'No current game')

    game = get_game_manager()
    game.create_player(device)

    return redirect('/game', code=302)

