import json

from flask import Response
from flask import abort

from siege.models import Game


# flask.jsonify doesn't handle lists; this does.
def jsonate(obj):
    return Response(json.dumps(obj), content_type='application/json')


# Gets the game for the specified ID (or 'current') or aborts
def get_game_or_abort(game_id):
    if game_id == 'current':
        game = Game.current()
    else:
        game = Game.query.get(game_id)
    if not game:
        abort(404, 'Game not found')
    return game
