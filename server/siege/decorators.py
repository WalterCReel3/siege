from flask import request
from flask import redirect
from siege.service import db
from siege.models import Device

def ensure_device(f):
    def decorated():
        if not request.cookies.get('device_id'):
            return redirect('/', code=302)
        return f()
    return decorated
