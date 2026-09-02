"""Top-level (unversioned) API routes, e.g. the root health checks."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.health import check_database

router = APIRouter(tags=["health"])


@router.get("/health", summary="Liveness health check")
def health() -> dict[str, object]:
    """Liveness probe. Returns the service status without touching dependencies."""
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
    }


@router.get("/health/ready", summary="Readiness health check (includes database)")
def readiness() -> JSONResponse:
    """Readiness probe: verifies database connectivity with a lightweight ``SELECT 1``.

    Distinct from ``/health``: an unreachable database returns HTTP 503 here
    without implying the process itself is dead. No credentials or connection
    details are exposed in the response.
    """
    if check_database():
        return JSONResponse(status_code=200, content={"status": "ready", "database": "ok"})
    return JSONResponse(status_code=503, content={"status": "not_ready", "database": "unavailable"})
