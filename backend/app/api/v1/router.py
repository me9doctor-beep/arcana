"""Router aggregating every endpoint under ``/api/v1``.

Future domain routers (users, organizations, projects, missions, sprints, ...)
register here, e.g.::

    from app.api.v1 import organizations
    router.include_router(organizations.router, tags=["organizations"])
"""

from fastapi import APIRouter

from app.api.v1 import auth, health

router = APIRouter()
router.include_router(health.router)
router.include_router(auth.router)
