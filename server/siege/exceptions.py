from flask import jsonify

from siege.service import app


class UnsupportedContentTypeException(Exception):
    STATUS_CODE = 400

    def __init__(self, unsupported_content_type):
        self.message = 'Content type "%s" is not supported' % unsupported_content_type

    def to_dict(self):
        return dict(message=self.message)


@app.errorhandler(UnsupportedContentTypeException)
def handle_unsupported_content_type(error):
    response = jsonify(error.to_dict())
    response.status_code = error.STATUS_CODE
    return response