# AI-Powered GitHub Repository Analyzer

## Overview

The AI feature analyzes public GitHub repositories and generates resume-ready content:

- ✍️ Technical project description (1–2 sentences)
- 🛠️ Technology stack detected from languages, config files, and source code
- 📋 Three concise resume bullet points
- 🏷️ Project type classification (Web App, Software Project, etc.)

---

## Architecture

```
┌─────────────────┐      ┌───────────────────┐      ┌──────────────────┐
│   Frontend      │─────▶│   Backend         │─────▶│  Groq LLM        │
│   (React/Next)  │      │   (FastAPI)        │      │  llama-3.3-70b   │
└─────────────────┘      └───────────────────┘      └──────────────────┘
                                   │
                                   ▼
                          ┌───────────────────┐
                          │   GitHub REST API  │
                          └───────────────────┘
```

### Backend Components

| File | Purpose |
|------|---------|
| `app/ai/llm.py` | Lazy Groq client wrapper with `generate_text()` |
| `app/ai/github/analyzer.py` | Repository fetching, parsing, and prompt assembly |
| `app/api/v1/ai/github.py` | FastAPI REST endpoints |
| `app/schemas/github_ai.py` | Pydantic request/response models |

---

## API Endpoints

### `POST /api/v1/ai/github/analyze`

Analyze a GitHub repository and generate resume content.

**Request**
```json
{
  "owner": "github-username",
  "repo": "repository-name"
}
```

**Response**
```json
{
  "analysis": {
    "project_name": "string",
    "description": "string",
    "project_type": "string",
    "technologies": ["string"],
    "features": [],
    "implementation": [],
    "resume_bullets": ["string", "string", "string"]
  }
}
```

**Error Responses**

| Status | Cause |
|--------|-------|
| `404`  | Repository not found / auth failure / rate limit |
| `422`  | Missing or empty `owner` / `repo` fields |
| `500`  | LLM returned empty response or unexpected error |

---

### `POST /api/v1/ai/github/improve-bullets`

Refine existing resume bullets for a project.

**Request**
```json
{
  "project_name": "string",
  "description": "string",
  "technologies": ["string"],
  "current_bullets": ["string"]
}
```

**Response**
```json
{
  "resume_bullets": ["string", "string", "string"]
}
```

---

## Configuration

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | API key from [console.groq.com](https://console.groq.com) | **Yes** |
| `GITHUB_TOKEN` | GitHub PAT for private repos / higher rate limits | No |

> [!IMPORTANT]
> The AI endpoints will return `RuntimeError` if `GROQ_API_KEY` is missing **at the time a request is made**. The key is loaded lazily so it does not break app startup.

---

## Setup

### 1. Local Development

```bash
# 1. Get a free API key from https://console.groq.com (free tier available)
# 2. Add to backend/.env.local (gitignored — never committed)
echo "GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx" >> backend/.env.local

# 3. Start the backend
cd backend
docker compose up -d
```

### 2. CI/CD (GitHub Actions)

Add the following secrets in **GitHub → Repository Settings → Secrets and variables → Actions → New repository secret**:

| Secret Name | Where to get it |
|-------------|----------------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys |
| `GITHUB_TOKEN` | GitHub → Settings → Developer settings → Personal access tokens *(optional)* |

> [!NOTE]
> `GITHUB_TOKEN` is only required to analyze **private repositories** or if you hit the unauthenticated GitHub rate limit (60 req/hour). For public repos in development/testing it's optional.

---

## Testing

Tests mock all external APIs (GitHub and Groq) so they run fully offline:

```bash
cd backend
pytest tests/test_ai_github.py -v
```

Expected output:
```
tests/test_ai_github.py::TestAnalyzeGitHubRepository::test_analyze_success PASSED
tests/test_ai_github.py::TestAnalyzeGitHubRepository::test_analyze_missing_owner PASSED
tests/test_ai_github.py::TestAnalyzeGitHubRepository::test_analyze_missing_repo PASSED
tests/test_ai_github.py::TestAnalyzeGitHubRepository::test_analyze_empty_body PASSED
tests/test_ai_github.py::TestAnalyzeGitHubRepository::test_analyze_empty_strings PASSED
tests/test_ai_github.py::TestAnalyzeGitHubRepository::test_analyze_repo_not_found PASSED
tests/test_ai_github.py::TestAnalyzeGitHubRepository::test_analyze_github_auth_failure PASSED
tests/test_ai_github.py::TestAnalyzeGitHubRepository::test_analyze_unexpected_error PASSED
tests/test_ai_github.py::TestImproveBullets::test_improve_bullets_success PASSED
tests/test_ai_github.py::TestImproveBullets::test_improve_bullets_empty_body PASSED
tests/test_ai_github.py::TestImproveBullets::test_improve_bullets_missing_project_name PASSED
tests/test_ai_github.py::TestImproveBullets::test_improve_bullets_missing_description PASSED
tests/test_ai_github.py::TestImproveBullets::test_improve_bullets_empty_lists_are_valid PASSED
tests/test_ai_github.py::TestImproveBullets::test_improve_bullets_llm_failure PASSED
```

---

## Frontend Integration

The `GitHubAnalyzer` component (`frontend/app/components/ai/GitHubAnalyzer.tsx`) provides:

- GitHub **owner** and **repository** name inputs
- Real-time analysis with loading states
- Display of description, detected technologies, and 3 resume bullets
- **"Improve Bullets"** button for iterative refinement

**Access via:** `/resumes` page → _AI Resume Tools_ section

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `RuntimeError: GROQ_API_KEY is not configured` | Add `GROQ_API_KEY` to `backend/.env.local` (local) or GitHub Secrets (CI) |
| `GitHub authentication failed` | Check `GITHUB_TOKEN` validity and scopes |
| `GitHub access denied or API rate limit exceeded` | Add `GITHUB_TOKEN` with `public_repo` scope |
| AI returns empty response | Check Groq API key validity and quota at [console.groq.com](https://console.groq.com) |
| `404` for a public repository | Verify the exact `owner`/`repo` names (case-sensitive) |

---

## Security Notes

- `GROQ_API_KEY` is **never committed** to git — it lives in `.env.local` (gitignored) or GitHub Secrets.
- `GITHUB_TOKEN` only needs `public_repo` scope for public repositories.
- The LLM prompt explicitly instructs the model **not** to invent metrics, achievements, or technologies.
- All user inputs are validated via Pydantic models before reaching the AI layer.
