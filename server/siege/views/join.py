import random

from flask import abort
from flask import request
from flask import redirect

from siege.service import app, config
from siege.decorators import ensure_device
from siege.models import Device
from siege.models import Game
from siege.models import Player


# @app.route('/clan/<clan_id>')
# @ensure_device
# def game_joined(clan_id):
#     response = make_response(render_template('clan-joined.html'))
#     return response


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

    clan = random.choice(config['clans'])
    territory = 0
    player = Player.create(current_game.id, device.id, clan, territory)

    return redirect('/game', code=302)

