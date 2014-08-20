import datetime

from flask import url_for
from flask import abort
from flask import Response

from siege.service import app, db
from siege.models import Game
from view_utils import jsonate, get_game_or_abort


@app.route('/games')
def games_index():
    response = jsonate([g.to_dict() for g in Game.query.all()])
    return response


@app.route('/games/<game_id>')
def games_get(game_id):
    game = get_game_or_abort(game_id)
    return jsonate(game.to_dict())


@app.route('/games/<game_id>', methods=['DELETE'])
def games_stop(game_id):
    game = get_game_or_abort(game_id)
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