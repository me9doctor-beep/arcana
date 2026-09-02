"""SQLAlchemy ORM models and model discovery.

Convention for adding a new domain model in a future phase:

1. Create ``app/models/<domain>.py`` with classes subclassing
   :class:`app.db.base.Base` (and, where appropriate, the mixins in
   :mod:`app.db.mixins`).
2. Import the module here so its tables register on ``Base.metadata``::

       from app.models import <domain>  # noqa: F401  (registration side effect)

``alembic/env.py`` imports this package once, so every imported model is visible
to ``alembic revision --autogenerate``. Keep imports explicit — no dynamic
module scanning, no application imports inside Alembic.
"""

from app.models import auth_session as auth_session
from app.models import user as user
