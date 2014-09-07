from flask import request
from flask import redirect
from functools import wraps

from siege.models import Device

def ensure_device(f):
    @wraps(f)
    def decorated():
        device_id = request.cookies.get('device_id')
        if device_id and Device.query.get(device_id):
            return f()
        else:
            return redirect('/', code=302)
    return decorated
