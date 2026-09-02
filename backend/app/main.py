"""FastAPI application factory and module-level entrypoint.

The application is created by :func:`create_app` so tests and tooling can
construct it with overridden settings. ``uvicorn app.main:app`` serves the
default instance.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router as root_router
from app.api.v1 import router as v1_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.db.session import dispose_engine

logger = logging.getLogger("arcana")


def _configure_logging() -> None:
    level = logging.DEBUG if settings.debug else logging.INFO
    setup_logging(level=level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    _configure_logging()
    logger.info(
        "%s %s starting (env=%s, debug=%s)",
        settings.app_name,
        settings.app_version,
        settings.app_env,
        settings.debug,
    )
    try:
        yield
    finally:
        dispose_engine()
        logger.info("%s shutdown complete", settings.app_name)


def create_app() -> FastAPI:
    """Build and configure the ARCANA FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="ARCANA — the world behind the work. Backend API.",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # CORS — origins come from configuration; no wildcard in production.
    if settings.app_env != "production":
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    register_exception_handlers(app)

    app.include_router(root_router.router)
    app.include_router(v1_router.router, prefix=settings.api_v1_prefix)

    return app


app = create_app()
