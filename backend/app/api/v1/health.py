"""Health check endpoints under the versioned namespace."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.health import check_database

router = APIRouter(tags=["health"])


@router.get("/health", summary="Health check (v1)")
def health() -> dict[str, object]:
    """Liveness probe for the versioned API namespace."""
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
    }


@router.get("/health/ready", summary="Readiness health check (v1)")
def readiness() -> JSONResponse:
    """Readiness probe for the versioned namespace (verifies database connectivity)."""
    if check_database():
        return JSONResponse(status_code=200, content={"status": "ready", "database": "ok"})
    return JSONResponse(status_code=503, content={"status": "not_ready", "database": "unavailable"})
