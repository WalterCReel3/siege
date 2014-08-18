import json

from flask import Response


# Returns a Flask Response object filled with a JSON representation of the
# specified obj.  If the object is not full of simple types that the 'json'
# module can convert automatically, you'll need to specify a transform function
# that can convert complex objects.
def json_response(obj, transform=None):
    json_str = json.dumps(obj, default=transform)
    return Response(json_str, content_type='application/json')
