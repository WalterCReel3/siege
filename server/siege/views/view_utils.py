import json

from flask import Response

def json_response(obj, transform=None):
    json_str = json.dumps(obj, default=transform)
    return Response(json_str, content_type='application/json')
