"""Error responses shaped the way the React client's HttpClient expects:

    { "message": "...", "code": "EMAIL_TAKEN", "field_errors": { "email": "..." } }

The client camelizes keys, so `field_errors` arrives as `fieldErrors`.
"""
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler


class ApiError(exceptions.APIException):
    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(self, message, code="VALIDATION_ERROR", status_code=400, field_errors=None):
        super().__init__(detail=message)
        self.status_code = status_code
        self.message = message
        self.error_code = code
        self.field_errors = field_errors


def _first_message(value):
    if isinstance(value, (list, tuple)):
        for item in value:
            text = _first_message(item)
            if text:
                return text
        return None
    if isinstance(value, dict):
        for item in value.values():
            text = _first_message(item)
            if text:
                return text
        return None
    return str(value) if value else None


def _flatten_field_errors(detail):
    out = {}
    if isinstance(detail, dict):
        for key, value in detail.items():
            text = _first_message(value)
            if text:
                out["_form" if key == "non_field_errors" else key] = text
    return out


def api_exception_handler(exc, context):
    if isinstance(exc, ApiError):
        body = {"message": exc.message, "code": exc.error_code}
        if exc.field_errors:
            body["field_errors"] = exc.field_errors
        return Response(body, status=exc.status_code)

    response = exception_handler(exc, context)
    if response is None:
        return None  # unhandled -> Django's 500

    if isinstance(exc, exceptions.ValidationError):
        fields = _flatten_field_errors(exc.detail)
        message = _first_message(exc.detail) or "Please check the highlighted fields."
        body = {"message": message, "code": "VALIDATION_ERROR"}
        if fields:
            body["field_errors"] = fields
        response.data = body
        return response

    message = _first_message(response.data.get("detail") if isinstance(response.data, dict) else response.data)
    code = {
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        429: "RATE_LIMITED",
    }.get(response.status_code, "UNKNOWN_ERROR")
    response.data = {"message": message or "Request failed.", "code": code}
    return response
