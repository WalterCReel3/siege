import datetime

from flask import url_for
from flask import abort
from flask import Response

from siege.service import app, db
from siege.models import Game
from view_utils import jsonate


@app.route('/games')
def games_index():
    response = jsonate([g.to_dict() for g in Game.query.all()])
    return response


@app.route('/games/current')
def games_current():
    game = Game.current()
    if not game:
        abort(404, 'Game not found')
    return jsonate(game.to_dict())


@app.route('/games/<game_id>')
def games_get(game_id):
    game = Game.query.get(game_id)
    if not game:
        abort(404, 'Game not found')
    response = jsonate(game.to_dict())
    return response


@app.route('/games/<game_id>', methods=['DELETE'])
def games_stop(game_id):
    game = Game.query.get(game_id)
    if not game:
        abort(404, 'Game not found')

    if game.ended_at:
        abort(403, 'That game has already been stopped')

    game.ended_at = datetime.datetime.utcnow()
    db.session.commit()
    return Response(status=200)


@app.route('/games', methods=['POST'])
def games_create():
    current_game = Game.current()
    if current_game:
        abort(403, 'Game %s is in progress' % current_game.id)

    new_game = Game()
    db.session.add(new_game)
    db.session.commit()

    response = jsonate(new_game.to_dict())
    response.status_code = 201
    response.headers['Location'] = url_for('games_get', game_id=new_game.id)
    return response