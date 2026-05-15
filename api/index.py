"""Vercel Python 진입점. FastAPI 앱을 그대로 노출."""

from backend.app.main import app  # noqa: F401

__all__ = ["app"]
