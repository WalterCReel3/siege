import json

from flask import render_template
from flask import request
from flask.helpers import flash
from flask import redirect
from flask import url_for
from flask import Response
from flask import jsonify

from siege.service import app, db
from siege.models import Device

@app.route('/devices')
def devices_index():
    response = jsonify([d.to_dict() for d in Device.query.all()])
    return response

@app.route('/devices', methods=['POST'])
def devices_create():
    # user_device = request.json
    #
    # new_device = Device(comment=user_device['comment'])
    # db.session.add(new_device)
    # db.session.commit()

    response = jsonify(dict(message='todo'))
    response.status_code = 201
    return response