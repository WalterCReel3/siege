from flask import request
from flask import url_for
from flask import abort

from siege.service import app, db
from siege.models import Device
from view_utils import jsonate


@app.route('/devices')
def devices_index():
    response = jsonate([d.to_dict() for d in Device.query.all()])
    return response


@app.route('/devices/<device_id>')
def devices_get(device_id):
    device = Device.query.get(device_id)
    if not device:
        abort(404, 'Device not found')
    response = jsonate(device.to_dict())
    return response


@app.route('/devices', methods=['POST'])
def devices_create():
    new_device = Device(comment=request.access_route)
    db.session.add(new_device)
    db.session.commit()

    response = jsonate(new_device.to_dict())
    response.status_code = 201
    response.headers['Location'] = url_for('devices_get', device_id=new_device.id)
    return response