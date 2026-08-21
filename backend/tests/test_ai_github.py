"""
test_ai_github.py — Tests for AI GitHub Analyzer endpoints.

All external calls (GitHub API and Groq/LLM) are mocked, so these tests
run fully offline without a real GROQ_API_KEY or network access.
"""

import pytest
from unittest.mock import patch, MagicMock


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

MOCK_REPO = {
    "name": "test-repo",
    "description": "A test project",
    "languages": {"Python": 1000, "TypeScript": 500},
    "topics": ["fastapi", "ai"],
    "default_branch": "main",
    "readme": "# Test Project\nThis is a test.",
}

MOCK_TREE = ["README.md", "main.py", "app/api.py"]

MOCK_SOURCE = "FILE: main.py\nprint('hello world')"

MOCK_LLM_RESPONSE = """
DESCRIPTION:
A test project built with FastAPI and Python that demonstrates AI integration.

BULLET 1:
Built a REST API using FastAPI and Python with PostgreSQL for persistent storage.

BULLET 2:
Implemented AI-powered features using the Groq LLM API with llama-3.3-70b.

BULLET 3:
Designed a modular architecture separating concerns across service, schema, and API layers.
"""

MOCK_IMPROVE_RESPONSE = (
    "Engineered a scalable REST API with FastAPI\n"
    "Integrated Groq LLM for AI-powered text generation\n"
    "Architected a clean service layer with Pydantic validation"
)


# ---------------------------------------------------------------------------
# POST /api/v1/ai/github/analyze
# ---------------------------------------------------------------------------

class TestAnalyzeGitHubRepository:
    """Tests for the /api/v1/ai/github/analyze endpoint."""

    @patch("app.ai.github.analyzer.collect_source_code", return_value=MOCK_SOURCE)
    @patch("app.ai.github.analyzer.get_repository_tree", return_value=MOCK_TREE)
    @patch("app.ai.github.analyzer.get_repository", return_value=MOCK_REPO)
    @patch("app.ai.github.analyzer.generate_text", return_value=MOCK_LLM_RESPONSE)
    def test_analyze_success(self, mock_llm, mock_repo, mock_tree, mock_collect, client):
        """Successful analysis returns HTTP 200 with expected structure."""
        response = client.post(
            "/api/v1/ai/github/analyze",
            json={"owner": "testuser", "repo": "test-repo"},
        )

        assert response.status_code == 200
        data = response.json()

        assert "analysis" in data
        analysis = data["analysis"]
        assert analysis["project_name"] == "test-repo"
        assert isinstance(analysis["description"], str)
        assert len(analysis["description"]) > 0
        assert isinstance(analysis["resume_bullets"], list)
        assert len(analysis["resume_bullets"]) == 3
        assert isinstance(analysis["technologies"], list)
        assert "project_type" in analysis

    def test_analyze_missing_owner(self, client):
        """Missing 'owner' field returns HTTP 422 Unprocessable Entity."""
        response = client.post(
            "/api/v1/ai/github/analyze",
            json={"repo": "test-repo"},
        )
        assert response.status_code == 422

    def test_analyze_missing_repo(self, client):
        """Missing 'repo' field returns HTTP 422 Unprocessable Entity."""
        response = client.post(
            "/api/v1/ai/github/analyze",
            json={"owner": "testuser"},
        )
        assert response.status_code == 422

    def test_analyze_empty_body(self, client):
        """Empty request body returns HTTP 422 Unprocessable Entity."""
        response = client.post("/api/v1/ai/github/analyze", json={})
        assert response.status_code == 422

    def test_analyze_empty_strings(self, client):
        """Empty string values for owner/repo return HTTP 422."""
        response = client.post(
            "/api/v1/ai/github/analyze",
            json={"owner": "", "repo": ""},
        )
        assert response.status_code == 422

    @patch(
        "app.ai.github.analyzer.get_repository",
        side_effect=ValueError("GitHub repository or resource not found"),
    )
    def test_analyze_repo_not_found(self, mock_repo, client):
        """Non-existent repository returns HTTP 404."""
        response = client.post(
            "/api/v1/ai/github/analyze",
            json={"owner": "nonexistent-user-xyz", "repo": "nonexistent-repo-xyz"},
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    @patch(
        "app.ai.github.analyzer.get_repository",
        side_effect=ValueError("GitHub authentication failed"),
    )
    def test_analyze_github_auth_failure(self, mock_repo, client):
        """GitHub auth failure surfaces as HTTP 404 (ValueError path)."""
        response = client.post(
            "/api/v1/ai/github/analyze",
            json={"owner": "someuser", "repo": "private-repo"},
        )
        assert response.status_code == 404
        assert "authentication" in response.json()["detail"].lower()

    @patch(
        "app.ai.github.analyzer.get_repository",
        side_effect=Exception("Unexpected network error"),
    )
    def test_analyze_unexpected_error(self, mock_repo, client):
        """Unexpected exceptions surface as HTTP 500."""
        response = client.post(
            "/api/v1/ai/github/analyze",
            json={"owner": "testuser", "repo": "some-repo"},
        )
        assert response.status_code == 500


# ---------------------------------------------------------------------------
# POST /api/v1/ai/github/improve-bullets
# ---------------------------------------------------------------------------

class TestImproveBullets:
    """Tests for the /api/v1/ai/github/improve-bullets endpoint."""

    @patch("app.ai.github.analyzer.generate_text", return_value=MOCK_IMPROVE_RESPONSE)
    def test_improve_bullets_success(self, mock_llm, client):
        """Successful request returns HTTP 200 with 3 improved bullets."""
        response = client.post(
            "/api/v1/ai/github/improve-bullets",
            json={
                "project_name": "Test Project",
                "description": "A test project using FastAPI",
                "technologies": ["Python", "FastAPI", "PostgreSQL"],
                "current_bullets": [
                    "Built a REST API",
                    "Used Python and FastAPI",
                    "Deployed to AWS",
                ],
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "resume_bullets" in data
        bullets = data["resume_bullets"]
        assert isinstance(bullets, list)
        assert len(bullets) == 3
        # Verify bullets are non-empty strings
        for bullet in bullets:
            assert isinstance(bullet, str)
            assert len(bullet.strip()) > 0

    def test_improve_bullets_empty_body(self, client):
        """Empty body returns HTTP 422."""
        response = client.post("/api/v1/ai/github/improve-bullets", json={})
        assert response.status_code == 422

    def test_improve_bullets_missing_project_name(self, client):
        """Missing 'project_name' returns HTTP 422."""
        response = client.post(
            "/api/v1/ai/github/improve-bullets",
            json={
                "description": "A project",
                "technologies": ["Python"],
                "current_bullets": ["Did something"],
            },
        )
        assert response.status_code == 422

    def test_improve_bullets_missing_description(self, client):
        """Missing 'description' returns HTTP 422."""
        response = client.post(
            "/api/v1/ai/github/improve-bullets",
            json={
                "project_name": "My Project",
                "technologies": ["Python"],
                "current_bullets": ["Did something"],
            },
        )
        assert response.status_code == 422

    @patch("app.ai.github.analyzer.generate_text", return_value=MOCK_IMPROVE_RESPONSE)
    def test_improve_bullets_empty_lists_are_valid(self, mock_llm, client):
        """technologies and current_bullets default to [] — both optional."""
        response = client.post(
            "/api/v1/ai/github/improve-bullets",
            json={
                "project_name": "My Project",
                "description": "A simple project",
            },
        )
        # Schema marks these as optional with default_factory=list
        assert response.status_code == 200

    @patch(
        "app.ai.github.analyzer.generate_text",
        side_effect=Exception("Groq API error"),
    )
    def test_improve_bullets_llm_failure(self, mock_llm, client):
        """LLM failures surface as HTTP 500."""
        response = client.post(
            "/api/v1/ai/github/improve-bullets",
            json={
                "project_name": "Test Project",
                "description": "A project",
                "technologies": ["Python"],
                "current_bullets": ["Built something"],
            },
        )
        assert response.status_code == 500
