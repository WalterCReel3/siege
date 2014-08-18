import json

from flask import render_template
from flask import request
from flask.helpers import flash
from flask import redirect
from flask import url_for
from flask import Response

from siege.service import app
from siege.models import Device
from siege.views.view_utils import *

@app.route('/devices')
def devices_index():
    return json_response(Device.query.all(), transform=Device.json_dict)