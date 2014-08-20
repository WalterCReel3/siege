from flask import request
from flask import jsonify
from flask import url_for
from flask import abort

from siege.service import app, db
from siege.models import Device


@app.route('/devices')
def devices_index():
    response = jsonify([d.to_dict() for d in Device.query.all()])
    return response


@app.route('/devices/<device_id>')
def devices_get(device_id):
    device = Device.query.get(device_id)
    if not device:
        abort(404)
    response = jsonify(device.to_dict())
    return response


@app.route('/devices', methods=['POST'])
def devices_create():
    user_device = request.json

    new_device = Device(comment=user_device.get('comment', None))
    db.session.add(new_device)
    db.session.commit()

    response = jsonify(new_device.to_dict())
    response.status_code = 201
    response.headers['Location'] = url_for('devices_get', device_id=new_device.id)
    return response