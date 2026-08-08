import os
import base64
from pathlib import Path

import requests
from dotenv import load_dotenv

from app.ai.llm import generate_text
from app.schemas.github_ai import GitHubProjectAnalysis


# =========================================================
# Environment
# =========================================================

# analyzer.py
# backend/
#   app/
#     ai/
#       github/
#         analyzer.py

BASE_DIR = Path(__file__).resolve().parents[3]

load_dotenv(BASE_DIR / ".env.local")


# =========================================================
# GitHub configuration
# =========================================================

GITHUB_API_BASE = "https://api.github.com"

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

# Use authentication when a token is configured.
# This allows access to private repositories that
# the token owner has permission to read.
if GITHUB_TOKEN:
    HEADERS["Authorization"] = f"Bearer {GITHUB_TOKEN}"


# =========================================================
# Files useful for understanding a project
# =========================================================

IMPORTANT_FILES = (
    "README.md",
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "pom.xml",
    "build.gradle",
    "Dockerfile",
    "docker-compose.yml",
)


# =========================================================
# Directories to ignore
# =========================================================

IGNORED_DIRECTORIES = (
    "node_modules/",
    ".git/",
    "venv/",
    ".venv/",
    "__pycache__/",
    "dist/",
    "build/",
    ".next/",
    "coverage/",
    ".idea/",
    ".vscode/",
)


# =========================================================
# Source file extensions
# =========================================================

SOURCE_EXTENSIONS = (
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".java",
    ".cpp",
    ".c",
    ".html",
    ".css",
    ".sql",
)


# =========================================================
# GitHub GET request
# =========================================================

def _github_get(url: str) -> dict:
    """
    Make a GET request to GitHub API.

    Uses GITHUB_TOKEN when configured.
    """

    response = requests.get(
        url,
        timeout=15,
        headers=HEADERS,
    )

    # Repository/resource doesn't exist or is not accessible.
    if response.status_code == 404:
        raise ValueError(
            "GitHub repository or resource not found. "
            "Check the username, repository name, "
            "and repository permissions."
        )

    # Authentication/permission problem.
    if response.status_code == 401:
        raise ValueError(
            "GitHub authentication failed. "
            "Check your GITHUB_TOKEN."
        )

    if response.status_code == 403:
        raise ValueError(
            "GitHub access denied or API rate limit exceeded. "
            "Check your GitHub token and permissions."
        )

    response.raise_for_status()

    return response.json()


# =========================================================
# Repository information
# =========================================================

def get_repository(
    owner: str,
    repo: str,
) -> dict:
    """
    Get basic repository information,
    languages and README.
    """

    # -----------------------------------------------------
    # Repository information
    # -----------------------------------------------------

    repo_url = (
        f"{GITHUB_API_BASE}/repos/"
        f"{owner}/{repo}"
    )

    data = _github_get(repo_url)

    # -----------------------------------------------------
    # Languages
    # -----------------------------------------------------

    languages_url = (
        f"{GITHUB_API_BASE}/repos/"
        f"{owner}/{repo}/languages"
    )

    try:
        languages = _github_get(
            languages_url
        )
    except Exception:
        languages = {}

    # -----------------------------------------------------
    # README
    # -----------------------------------------------------

    readme_url = (
        f"{GITHUB_API_BASE}/repos/"
        f"{owner}/{repo}/readme"
    )

    readme = ""

    try:
        readme_data = _github_get(
            readme_url
        )

        encoded = readme_data.get(
            "content",
            "",
        )

        if encoded:
            readme = (
                base64.b64decode(encoded)
                .decode(
                    "utf-8",
                    errors="replace",
                )
            )

    except Exception:
        readme = ""

    return {
        "name": data.get("name") or repo,
        "description": data.get("description") or "",
        "languages": languages,
        "topics": data.get("topics", []),
        "default_branch": data.get(
            "default_branch",
            "main",
        ),
        "readme": readme,
    }


# =========================================================
# Repository tree
# =========================================================

def get_repository_tree(
    owner: str,
    repo: str,
    branch: str,
) -> list[str]:
    """
    Get repository file paths.
    """

    url = (
        f"{GITHUB_API_BASE}/repos/"
        f"{owner}/{repo}/git/trees/"
        f"{branch}?recursive=1"
    )

    try:
        data = _github_get(url)

        return [
            item["path"]
            for item in data.get(
                "tree",
                [],
            )
            if item.get("type") == "blob"
        ]

    except Exception:
        return []


# =========================================================
# Select relevant files
# =========================================================

def select_relevant_files(
    paths: list[str],
) -> list[str]:
    """
    Select only a small number of useful files.

    This prevents sending an entire repository
    to the AI model.
    """

    important = []
    source = []

    for path in paths:

        lower = path.lower()

        # Ignore unwanted directories.
        if any(
            ignored in lower
            for ignored in IGNORED_DIRECTORIES
        ):
            continue

        filename = path.split("/")[-1]

        # Important project configuration files.
        if filename in IMPORTANT_FILES:
            important.append(path)

        # Source files.
        elif lower.endswith(
            SOURCE_EXTENSIONS
        ):
            source.append(path)

    # Keep the amount of data small.
    return (important + source)[:4]


# =========================================================
# Get one file
# =========================================================

def get_file_content(
    owner: str,
    repo: str,
    path: str,
) -> str:
    """
    Download one repository file.
    """

    url = (
        f"{GITHUB_API_BASE}/repos/"
        f"{owner}/{repo}/contents/{path}"
    )

    try:
        data = _github_get(url)

        encoded = data.get(
            "content",
            "",
        )

        if not encoded:
            return ""

        content = (
            base64.b64decode(encoded)
            .decode(
                "utf-8",
                errors="replace",
            )
        )

        # Keep individual files small.
        return content[:2000]

    except Exception:
        return ""


# =========================================================
# Collect a small amount of source code
# =========================================================

def collect_source_code(
    owner: str,
    repo: str,
    paths: list[str],
) -> str:
    """
    Collect only a small amount of useful source code.
    """

    selected = select_relevant_files(
        paths
    )

    sections = []

    for path in selected:

        content = get_file_content(
            owner,
            repo,
            path,
        )

        if content:
            sections.append(
                f"FILE: {path}\n{content}"
            )

    # Maximum total source sent to AI.
    return "\n\n".join(
        sections
    )[:5000]


# =========================================================
# Main analyzer
# =========================================================

def analyze_repository(
    owner: str,
    repo: str,
) -> GitHubProjectAnalysis:
    """
    Analyze a GitHub repository and generate
    resume-ready project information.
    """

    # -----------------------------------------------------
    # 1. Repository information
    # -----------------------------------------------------

    repository = get_repository(
        owner,
        repo,
    )

    # -----------------------------------------------------
    # 2. Languages
    # -----------------------------------------------------

    languages = repository.get(
        "languages",
        {},
    )

    language_names = list(
        languages.keys()
    )

    # -----------------------------------------------------
    # 3. Repository tree
    # -----------------------------------------------------

    branch = repository.get(
        "default_branch",
        "main",
    )

    paths = get_repository_tree(
        owner,
        repo,
        branch,
    )

    # -----------------------------------------------------
    # 4. Small amount of source code
    # -----------------------------------------------------

    source_code = collect_source_code(
        owner,
        repo,
        paths,
    )

    # -----------------------------------------------------
    # 5. Small README
    # -----------------------------------------------------

    readme = repository.get(
        "readme",
        "",
    )[:3000]

    # -----------------------------------------------------
    # 6. Ask AI for resume content
    # -----------------------------------------------------

    prompt = f"""
You are a technical resume writer.

Analyze this GitHub project and create
resume-ready content.

Use ONLY the information provided.

Do not invent technologies,
features, metrics, achievements,
users, performance numbers,
or functionality.

PROJECT NAME:
{repository["name"]}

GITHUB DESCRIPTION:
{repository["description"]}

PROGRAMMING LANGUAGES:
{", ".join(language_names) if language_names else "Not detected"}

README:
{readme if readme else "No README available."}

SOURCE CODE:
{source_code if source_code else "No source code available."}

Generate ONLY the following:

DESCRIPTION:
Write ONE concise technical description
of 1-2 sentences suitable for a resume.

BULLET 1:
Write ONE technical resume bullet.

BULLET 2:
Write ONE technical resume bullet.

BULLET 3:
Write ONE technical resume bullet.

Rules:
- Explain what was built.
- Explain how it was implemented.
- Use technologies only when supported.
- Do not invent metrics.
- Do not invent features.
- Keep each bullet concise.
- Do not use Markdown.
- Do not add headings other than the required headings.
"""

    # -----------------------------------------------------
    # 7. Generate normal text
    # -----------------------------------------------------

    raw_response = generate_text(
        prompt=prompt,
        model="llama-3.3-70b-versatile",
        temperature=0.1,
        json_mode=False,
    )

    if not raw_response:
        raise ValueError(
            "AI returned an empty response."
        )

    raw_response = raw_response.strip()

    # -----------------------------------------------------
    # 8. Extract description
    # -----------------------------------------------------

    description = ""

    if "DESCRIPTION:" in raw_response:

        description = (
            raw_response
            .split(
                "DESCRIPTION:",
                1,
            )[1]
            .split(
                "BULLET 1:",
                1,
            )[0]
            .strip()
        )

    # Fallback description.
    if not description:

        description = (
            repository["description"]
            or f"{repository['name']} is a software project."
        )

    # -----------------------------------------------------
    # 9. Extract bullets
    # -----------------------------------------------------

    bullets = []

    for number in range(1, 4):

        marker = f"BULLET {number}:"

        if marker not in raw_response:
            continue

        start = (
            raw_response
            .split(
                marker,
                1,
            )[1]
        )

        if number < 3:

            next_marker = (
                f"BULLET {number + 1}:"
            )

            text = start.split(
                next_marker,
                1,
            )[0]

        else:

            text = start

        text = text.strip()

        if text:
            bullets.append(text)

    # -----------------------------------------------------
    # 10. Fallback bullets
    # -----------------------------------------------------

    while len(bullets) < 3:

        bullets.append(
            f"Analyzed and documented the "
            f"{repository['name']} project "
            f"using the available repository evidence."
        )

    bullets = bullets[:3]

    # -----------------------------------------------------
    # 11. Project type
    # -----------------------------------------------------

    lower_languages = [
        language.lower()
        for language in language_names
    ]

    if (
        "javascript" in lower_languages
        or "typescript" in lower_languages
        or "react" in lower_languages
    ):
        project_type = "Web Application"

    elif "python" in lower_languages:

        project_type = "Software Project"

    else:

        project_type = "Software Project"

    # -----------------------------------------------------
    # 12. Return Pydantic structure
    # -----------------------------------------------------

    return GitHubProjectAnalysis(
        project_name=repository["name"],
        description=description,
        project_type=project_type,
        technologies=language_names[:8],
        features=[],
        implementation=[],
        resume_bullets=bullets,
    )

def improve_resume_bullets(
    project_name: str,
    description: str,
    technologies: list[str],
    current_bullets: list[str],
) -> list[str]:

    prompt = f"""
You are an expert technical resume writer.

Improve the following resume bullets for this project.

PROJECT:
{project_name}

DESCRIPTION:
{description}

TECHNOLOGIES:
{", ".join(technologies)}

CURRENT BULLETS:
{chr(10).join(current_bullets)}

Generate exactly 3 improved resume bullets.

Rules:
- Preserve the actual meaning and facts.
- Do not invent technologies.
- Do not invent metrics.
- Do not invent achievements.
- Make the bullets concise and professional.
- Use strong technical action verbs.
- Focus on what was built and how it was implemented.
- Do not use Markdown.
- Return ONLY the 3 bullets, one per line.
"""

    response = generate_text(
        prompt=prompt,
        model="llama-3.3-70b-versatile",
        temperature=0.2,
        json_mode=False,
    )

    bullets = [
        line.strip()
        for line in response.splitlines()
        if line.strip()
    ]

    # Remove accidental numbering/bullets
    cleaned = []

    for bullet in bullets:
        bullet = bullet.lstrip("0123456789.-•) ")
        if bullet:
            cleaned.append(bullet)

    return cleaned[:3]