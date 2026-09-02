"""Structured application logging.

Configures the root logger once so that application startup, shutdown,
requests and errors produce consistent, readable output. Redaction is enforced
at the formatter level so secrets (passwords, tokens, keys, credentials) never
reach the logs, regardless of the calling code.
"""

import logging
import re
import sys

# Keys whose values must never be logged.
_SECRET_PATTERNS = [
    re.compile(
        r"(?i)(password|passwd|secret|token|api[_-]?key|access[_-]?key|credential)s?\s*[=:]\s*\S+"
    ),
    re.compile(r"(?i)(postgres(?:ql)?\+psycopg://)[^@\s]+@"),
]

_REDACTED = "<redacted>"


class RedactingFormatter(logging.Formatter):
    """Formatter that strips sensitive values from log messages."""

    def format(self, record: logging.LogRecord) -> str:
        message = super().format(record)
        for pattern in _SECRET_PATTERNS:
            message = pattern.sub(lambda m: _redact(m), message)
        return message


def _redact(match: "re.Match[str]") -> str:
    group = match.group(0)
    if "://" in group:
        # Database URL: keep scheme, hide the credentials.
        return group.split("://", 1)[0] + "://" + _REDACTED + "@"
    return group.split("=", 1)[0] + "=" + _REDACTED


def setup_logging(level: int = logging.INFO) -> None:
    """Configure the root logger (idempotent, safe to call repeatedly)."""
    root = logging.getLogger()
    if getattr(root, "_arcana_configured", False):
        return

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        RedactingFormatter(
            fmt="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )
    root.addHandler(handler)
    root.setLevel(level)

    # Uvicorn's own handlers stay intact, but our handler also sees its records.
    root._arcana_configured = True  # type: ignore[attr-defined]


def get_logger(name: str) -> logging.Logger:
    """Return a logger for ``name``, ensuring logging is configured."""
    setup_logging()
    return logging.getLogger(name)
