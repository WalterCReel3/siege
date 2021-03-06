import random

from flask import request
from flask import url_for
from flask import abort
from flask import Response

from siege.service import app, db, config
from siege.models import Player, Device
from view_utils import jsonate, get_game_or_abort


@app.route('/games/<game_id>/players')
def players_index(game_id):
    get_game_or_abort(game_id)
    response = jsonate([p.to_dict() for p in Player.query.all()])
    return response


@app.route('/games/<game_id>/players/<player_id>')
def players_get(game_id, player_id):
    get_game_or_abort(game_id)
    player = Player.query.get(player_id)
    if not player:
        abort(404, 'Player not found')
    response = jsonate(player.to_dict())
    return response


@app.route('/games/<game_id>/players/<player_id>', methods=['DELETE'])
def players_delete(game_id, player_id):
    get_game_or_abort(game_id)
    player = Player.query.get(player_id)
    if not player:
        abort(404, 'Player not found')
    db.session.delete(player)
    db.session.commit()
    return Response(status=200)

@app.route('/games/<game_id>/players', methods=['POST'])
def players_create(game_id):
    game = get_game_or_abort(game_id)

    if game.ended_at is not None:
        abort(403, 'Cannot join a player to a finished game')

    device_id = request.json.get('deviceId', None)
    if not device_id:
        abort(403, 'Must supply deviceId')

    device = Device.query.get(device_id)
    if not device:
        abort(403, 'Device %s not found' % device_id)

    clan = request.json.get('clan', random.choice(config['clans']))
    territory = request.json.get('territory', None)

    player = Player.create(game.id, device.id, clan, territory)

    response = jsonate(player.to_dict())
    response.status_code = 201
    response.headers['Location'] = url_for(
            'players_get', game_id=game.id, player_id=player.id)
    return response
