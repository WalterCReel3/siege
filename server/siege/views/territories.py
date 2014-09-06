from flask import request
from flask import abort
from flask import Response

from siege.service import app
from siege.models import Player, Points
from view_utils import get_game_or_abort


@app.route('/games/<game_id>/territories/<territory>', methods=['POST'])
def territories(game_id, territory):
    game = get_game_or_abort(game_id)
    if game.ended_at is not None:
        abort(403, 'That game is over')

    player_id = request.json.get('playerId', None)
    if not player_id:
        abort(403, 'Must supply playerId')

    player = Player.query.get(player_id)
    if not player:
        abort(403, 'Player not found')

    points = 1 + player.device.bonus
    Points.score(game.id, territory, points)

    return Response(status=200)
