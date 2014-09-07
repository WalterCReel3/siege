from flask import render_template
from flask import request
from flask import make_response

from siege.service import app
from siege.models import Device

@app.route('/')
def index():
    response = make_response(render_template('index.html'))
    device_id = request.cookies.get('device_Id')
    if (not device_id) or (not Device.query.get(device_id)):
        new_device = Device.create(request.remote_addr,
                                   request.user_agent)
        response.set_cookie('device_id', new_device.id)
    return response
