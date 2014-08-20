import json

from flask import Response


# flask.jsonify doesn't handle lists; this does.
def jsonate(obj):
    return Response(json.dumps(obj), content_type='application/json')

