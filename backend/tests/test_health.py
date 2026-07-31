"""
test_health.py — Smoke tests that verify the API is reachable.

These are intentionally dependency-free so they pass even without a real
PostgreSQL instance (useful for fast local checks and pure CI unit runs).
"""

import pytest


@pytest.mark.unit
def test_root_endpoint_returns_200(client):
    """GET / should return HTTP 200 and a welcome message."""
    response = client.get("/")
    assert response.status_code == 200


@pytest.mark.unit
def test_root_endpoint_returns_json(client):
    """GET / should return a JSON body."""
    response = client.get("/")
    assert response.headers["content-type"].startswith("application/json")


@pytest.mark.unit
def test_root_message_content(client):
    """GET / body should contain the expected welcome key."""
    response = client.get("/")
    data = response.json()
    assert "message" in data
