"""
conftest.py — Shared pytest fixtures for the entire test suite.

CI Strategy for PostgreSQL:
  The GitHub Actions workflow will spin up a real PostgreSQL service container,
  so DATABASE_URL is read from the environment variable set in CI.
  For local development, make sure your .env file has a TEST_DATABASE_URL
  or override DATABASE_URL before running pytest.

  Example CI env var (set in the workflow YAML):
    DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb
"""

import os
import pytest
from fastapi.testclient import TestClient

# Override DATABASE_URL *before* importing anything that touches the DB.
# This allows the app to boot against the CI test database rather than prod.
os.environ.setdefault(
    "DATABASE_URL",
    os.getenv("DATABASE_URL", "sqlite:///./test.db"),  # fallback for pure unit tests
)

from app.main import app  # noqa: E402 — import after env var is set


@pytest.fixture(scope="session")
def client():
    """A TestClient that lives for the entire test session."""
    with TestClient(app) as c:
        yield c
