from flask import render_template
from flask import request
from flask import make_response

from siege.service import app
from siege.models import Device

@app.route('/')
def index():
    response = make_response(render_template('index.html'))
    if not request.cookies.get('device_id'):
            new_device = Device.create(request.remote_addr,
                                       request.user_agent)
            response.set_cookie('device_id', new_device.id)
    return response
