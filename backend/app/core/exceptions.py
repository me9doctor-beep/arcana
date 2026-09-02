"""Application exception infrastructure.

A small, consistent error model for the API. Future phases add domain-specific
exceptions (authentication, authorization, resource-not-found, conflict, ...)
by subclassing :class:`ArcanaError` and assigning an appropriate ``status_code``.
"""

import logging

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger("arcana.errors")


class ArcanaError(Exception):
    """Base class for all ARCANA application errors.

    Subclasses declare the HTTP status code and machine-readable code used in
    API error responses.
    """

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    code: str = "internal_error"
    message: str = "An unexpected error occurred."

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.message)
        self.detail = message or self.message

    def to_dict(self) -> dict[str, object]:
        return {
            "error": {
                "code": self.code,
                "message": self.detail,
            }
        }


class NotFoundError(ArcanaError):
    """A requested resource does not exist."""

    status_code = status.HTTP_404_NOT_FOUND
    code = "not_found"
    message = "Resource not found."


class ConflictError(ArcanaError):
    """The request conflicts with the current resource state."""

    status_code = status.HTTP_409_CONFLICT
    code = "conflict"
    message = "Request conflicts with the current state."


class ValidationError(ArcanaError):
    """A request failed application-level validation."""

    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    code = "validation_error"
    message = "Validation failed."


class AuthenticationError(ArcanaError):
    """Authentication is required or the provided credentials are invalid."""

    status_code = status.HTTP_401_UNAUTHORIZED
    code = "authentication_error"
    message = "Authentication failed."


class AuthorizationError(ArcanaError):
    """The authenticated principal is not permitted to perform this action."""

    status_code = status.HTTP_403_FORBIDDEN
    code = "authorization_error"
    message = "Not permitted."


def register_exception_handlers(app: FastAPI) -> None:
    """Attach exception handlers to the application."""

    @app.exception_handler(ArcanaError)
    async def handle_arcana_error(request: Request, exc: ArcanaError) -> JSONResponse:
        logger.warning("%s: %s", exc.code, exc.detail)
        return JSONResponse(status_code=exc.status_code, content=exc.to_dict())
