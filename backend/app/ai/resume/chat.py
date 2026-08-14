import json
import re
from typing import Any

from app.ai.llm import generate_text
from app.ai.github.analyzer import analyze_repository
from app.schemas.resume_ai import ResumeChatResponse


# =========================================================
# AI RESUME CHAT PROMPT
# =========================================================

RESUME_CHAT_PROMPT = """
You are the AI assistant inside a professional resume builder.

Your job is to understand the user's natural-language request
and convert it into safe, structured operations that modify
the user's existing resume.

IMPORTANT:

- Never invent facts.
- Only use information explicitly provided by the user,
  already present in the resume, or provided by the GitHub
  analyzer.
- If information is missing, ask for clarification.
- Use the conversation history to understand follow-up messages.
- A short message such as "skills", "projects", "yes",
  "Python", or "there" may be an answer to a previous
  clarification question.
- If the previous assistant asked a clarification question,
  interpret the user's next message as the answer whenever
  reasonable.
- Do NOT treat every message as a completely new request.
- Continue the previous task when the user's message is
  clearly answering the previous question.

=========================================================
GITHUB RULES
=========================================================

The chatbot can help the user analyze GitHub projects.

If the user says something such as:

"Analyze my GitHub project"
"Analyze my GitHub repository"
"Get my GitHub project description"
"Give me a resume description from GitHub"

the assistant should start the GitHub analysis conversation.

The GitHub flow is:

1. Ask for the GitHub username if it is not known.
2. Ask for the repository name if it is not known.
3. The backend will analyze the repository.
4. Show the resulting project information to the user.
5. Do NOT automatically add the project to the resume.
6. The user can ask to modify the description.
7. Show the modified description.
8. Only add the project to the resume after explicit user approval.

Examples of explicit approval:

"yes"
"yes add it"
"add it"
"add this project"
"add this to my resume"
"looks good, add it"
"approve"

Do NOT add the project merely because the user asked
to analyze it.

GITHUB BULLET MODIFICATION RULES:

- If the user asks to add, expand, continue, strengthen, rewrite,
  or modify a bullet from the GitHub analysis, do NOT ask what
  content they want if their request gives enough intent.
- Use the existing GitHub project description, technologies, and
  bullets as factual context.
- Generate a proposed bullet modification and show it to the user.
- Do NOT change the resume until the user explicitly approves it.
- If the user says "yes", "approve", "do it", "add it", or similar
  after a pending bullet proposal, apply the pending change.
- If the user says "add bullets" or "add bullets too", prepare all
  available GitHub resume bullets and ask for approval before applying.

=========================================================
RESUME OPERATION RULES
=========================================================

Return ONLY valid JSON.

Do NOT return Markdown.

Do NOT put JSON inside ```json code fences.

Supported sections:

personal
education
experience
projects
skills
certifications
achievements

Supported actions:

add
update
delete
replace
clear

=========================================================
CURRENT RESUME
=========================================================

{resume_json}

=========================================================
CONVERSATION HISTORY
=========================================================

{history_json}

=========================================================
CURRENT USER REQUEST
=========================================================

{user_message}

=========================================================
CONVERSATION RULES
=========================================================

Use the conversation history together with the current
resume and current user request.

For example:

User:
Add Java.

Assistant:
Where would you like to add Java?

User:
Skills.

Correct interpretation:

Add Java to the user's skills.

Do NOT ask again what "Skills" means.

Another example:

User:
Add a project.

Assistant:
What project would you like to add?

User:
Resume Builder using React.

Correct interpretation:

Add a project named Resume Builder using React.

Do NOT ask again what project the user means.

=========================================================
GITHUB APPROVAL RULE
=========================================================

If the conversation history contains a GitHub project
analysis and the user explicitly approves adding it,
create a projects/add operation.

Use the information from the GitHub analysis and subsequent
conversation.

Do not invent technologies, features, metrics, or achievements.

The project operation should look like:

{
  "action": "add",
  "section": "projects",
  "field": null,
  "index": null,
  "data": {
    "name": "Project Name",
    "description": "Resume-ready description",
    "technologies": "React, Python",
    "projectLink": "https://github.com/username/repository",
    "githubLink": "https://github.com/username/repository"
  }
}

If the user asks to modify the GitHub description before
approval, do NOT add the project.

Instead, return the modified description in "reply" and
keep operations empty.

=========================================================
OPERATION FORMAT
=========================================================

Every operation MUST look like this:

{
  "action": "add",
  "section": "skills",
  "field": null,
  "index": null,
  "data": {
    "name": "Python",
    "category": "Technical"
  }
}

For an update:

{
  "action": "update",
  "section": "personal",
  "field": "email",
  "index": null,
  "data": {
    "value": "new@email.com"
  }
}

For updating an array item:

{
  "action": "update",
  "section": "skills",
  "field": "name",
  "index": 0,
  "data": {
    "value": "C++"
  }
}

For deleting an array item:

{
  "action": "delete",
  "section": "skills",
  "field": null,
  "index": 0,
  "data": null
}

For clearing a section:

{
  "action": "clear",
  "section": "skills",
  "field": null,
  "index": null,
  "data": null
}

=========================================================
EXAMPLES
=========================================================

User:
Add Python to my skills.

Return:

{
  "reply": "Python has been added to your skills.",
  "operations": [
    {
      "action": "add",
      "section": "skills",
      "field": null,
      "index": null,
      "data": {
        "name": "Python",
        "category": "Technical"
      }
    }
  ],
  "needs_clarification": false,
  "clarifying_question": ""
}

---------------------------------------------------------

User:
Remove Python from my skills.

If Python exists in the current resume, identify its
index and return a delete operation.

---------------------------------------------------------

User:
Change my email to abc@gmail.com.

Return an update operation for personal.email.

---------------------------------------------------------

User:
Add a project called Resume Builder using React and FastAPI.

Return an add operation for projects using ONLY
the information supplied by the user.

=========================================================
MULTIPLE CHANGES
=========================================================

If the user requests multiple changes, return multiple
operations.

Example:

"Change my email to a@gmail.com and add Python."

Return:

{
  "reply": "I've updated your email and added Python.",
  "operations": [
    {
      "action": "update",
      "section": "personal",
      "field": "email",
      "index": null,
      "data": {
        "value": "a@gmail.com"
      }
    },
    {
      "action": "add",
      "section": "skills",
      "field": null,
      "index": null,
      "data": {
        "name": "Python",
        "category": "Technical"
      }
    }
  ],
  "needs_clarification": false,
  "clarifying_question": ""
}

=========================================================
CLARIFICATION
=========================================================

If the request is ambiguous or required information is
missing:

- set needs_clarification to true
- put the question in clarifying_question
- return an empty operations array

Example:

{
  "reply": "I need some more information.",
  "operations": [],
  "needs_clarification": true,
  "clarifying_question": "What project would you like to add?"
}

=========================================================
NORMAL CONVERSATION
=========================================================

If the user asks something that does not modify the resume,
return:

{
  "reply": "short helpful response",
  "operations": [],
  "needs_clarification": false,
  "clarifying_question": ""
}

=========================================================
FINAL RESPONSE FORMAT
=========================================================

Return EXACTLY one JSON object:

{
  "reply": "short helpful response",
  "operations": [],
  "needs_clarification": false,
  "clarifying_question": ""
}
"""


# =========================================================
# HELPERS
# =========================================================

def _clean_json_response(
    raw_response: str,
) -> str:
    """
    Clean common formatting mistakes made by an LLM.
    """

    text = raw_response.strip()

    if text.startswith("```"):
        lines = text.splitlines()

        if (
            lines
            and lines[0].startswith("```")
        ):
            lines = lines[1:]

        if (
            lines
            and lines[-1].strip() == "```"
        ):
            lines = lines[:-1]

        text = "\n".join(lines).strip()

    return text


def _normalize_operation(
    operation: Any,
) -> dict[str, Any]:
    """
    Normalize common LLM variations into the structure
    expected by ResumeUpdateOperation.
    """

    if not isinstance(
        operation,
        dict,
    ):
        raise ValueError(
            "Each resume operation must be a JSON object."
        )

    normalized = {
        "action": operation.get(
            "action"
        ),
        "section": operation.get(
            "section"
        ),
        "field": operation.get(
            "field"
        ),
        "index": operation.get(
            "index"
        ),
        "data": operation.get(
            "data"
        ),
    }

    if (
        normalized["data"] is None
        and "value" in operation
    ):
        normalized["data"] = {
            "value": operation["value"]
        }

    if isinstance(
        normalized["data"],
        list,
    ):
        normalized["data"] = {
            "items": normalized["data"]
        }

    if (
        normalized["section"]
        == "technical_skills"
    ):
        normalized["section"] = "skills"

    return normalized


def _normalize_response(
    parsed: Any,
) -> dict[str, Any]:
    """
    Normalize the complete AI response before
    Pydantic validation.
    """

    if not isinstance(
        parsed,
        dict,
    ):
        raise ValueError(
            "AI response must be a JSON object."
        )

    normalized = {
        "reply": str(
            parsed.get(
                "reply",
                "",
            )
        ),
        "operations": parsed.get(
            "operations",
            [],
        ),
        "needs_clarification": bool(
            parsed.get(
                "needs_clarification",
                False,
            )
        ),
        "clarifying_question": str(
            parsed.get(
                "clarifying_question",
                "",
            )
        ),
    }

    operations = normalized[
        "operations"
    ]

    if operations is None:
        operations = []

    if not isinstance(
        operations,
        list,
    ):
        operations = [
            operations
        ]

    normalized[
        "operations"
    ] = [
        _normalize_operation(
            operation
        )
        for operation in operations
    ]

    return normalized


def _get_last_assistant_message(
    history: list[dict[str, Any]],
) -> str:
    """
    Return the most recent assistant message.
    """

    for item in reversed(history):

        if (
            item.get("role")
            == "assistant"
        ):
            return str(
                item.get(
                    "content",
                    "",
                )
            )

    return ""


def _get_user_messages(
    history: list[dict[str, Any]],
) -> list[str]:
    """
    Return previous user messages.
    """

    return [
        str(
            item.get(
                "content",
                "",
            )
        )
        for item in history
        if item.get("role")
        == "user"
    ]


def _looks_like_github_analysis_request(
    message: str,
) -> bool:
    """
    Detect an initial GitHub analysis request.
    """

    text = message.lower()

    github_words = (
        "github",
        "repository",
        "repo",
    )

    analysis_words = (
        "analyze",
        "analyse",
        "analysis",
        "description",
        "project",
    )

    has_github_word = any(
        word in text
        for word in github_words
    )

    has_analysis_word = any(
        word in text
        for word in analysis_words
    )

    return (
        has_github_word
        and has_analysis_word
    )


def _is_github_username_question(
    assistant_message: str,
) -> bool:
    """
    Check whether the previous assistant message
    asked for a GitHub username.
    """

    text = assistant_message.lower()

    return (
        "github username" in text
        or "username" in text
        and "github" in text
    )


def _is_github_repository_question(
    assistant_message: str,
) -> bool:
    """
    Check whether the previous assistant message
    asked for a repository name.
    """

    text = assistant_message.lower()

    return (
        "repository" in text
        or "repo" in text
    ) and (
        "name" in text
        or "which" in text
        or "what" in text
    )


def _looks_like_approval(
    message: str,
) -> bool:
    """
    Detect explicit approval to add a GitHub project.
    """

    text = (
        message
        .strip()
        .lower()
    )

    approvals = {
        "yes",
        "yes add it",
        "add it",
        "add this",
        "add this project",
        "add it to my resume",
        "add this to my resume",
        "yes, add it",
        "yes add this",
        "looks good, add it",
        "approve",
        "approved",
    }

    return (
        text in approvals
        or (
            text.startswith("yes")
            and "add" in text
        )
    )


def _extract_github_username(
    message: str,
) -> str:
    """
    Extract a GitHub username from a direct answer.

    For example:
        panchami
        username: panchami
    """

    text = message.strip()

    patterns = [
        r"^username\s*[:\-]?\s*([A-Za-z0-9-]+)$",
        r"^github\s+username\s*[:\-]?\s*([A-Za-z0-9-]+)$",
    ]

    for pattern in patterns:

        match = re.match(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            return match.group(1)

    # If the user simply replies with a username.
    if (
        re.fullmatch(
            r"[A-Za-z0-9-]+",
            text,
        )
        and " " not in text
    ):
        return text

    return text


def _extract_repository_name(
    message: str,
) -> str:
    """
    Extract a repository name from a direct answer.
    """

    text = message.strip()

    patterns = [
        r"^repo\s*[:\-]?\s*(.+)$",
        r"^repository\s*[:\-]?\s*(.+)$",
        r"^repository\s+name\s*[:\-]?\s*(.+)$",
    ]

    for pattern in patterns:

        match = re.match(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            return match.group(1).strip()

    return text


def _format_github_analysis(
    analysis: Any,
    owner: str,
    repo: str,
) -> str:
    """
    Convert GitHubProjectAnalysis into a useful
    chatbot response.
    """

    if hasattr(
        analysis,
        "model_dump",
    ):
        data = analysis.model_dump()

    elif hasattr(
        analysis,
        "dict",
    ):
        data = analysis.dict()

    elif isinstance(
        analysis,
        dict,
    ):
        data = analysis

    else:
        data = {}

    project_name = (
        data.get(
            "project_name"
        )
        or repo
    )

    description = (
        data.get(
            "description"
        )
        or ""
    )

    project_type = (
        data.get(
            "project_type"
        )
        or "Software Project"
    )

    technologies = (
        data.get(
            "technologies"
        )
        or []
    )

    bullets = (
        data.get(
            "resume_bullets"
        )
        or []
    )

    github_url = (
        f"https://github.com/"
        f"{owner}/{repo}"
    )

    technology_text = (
        ", ".join(
            str(item)
            for item in technologies
        )
        if technologies
        else "Not detected"
    )

    lines = [
        "GitHub project analysis completed.",
        "",
        f"Project: {project_name}",
        f"Type: {project_type}",
        f"Technologies: {technology_text}",
        "",
        "Resume Description:",
        description,
    ]

    if bullets:
        lines.extend(
            [
                "",
                "Resume Bullets:",
            ]
        )

        for bullet in bullets:

            lines.append(
                f"- {bullet}"
            )

    lines.extend(
        [
            "",
            f"GitHub: {github_url}",
            "",
            "You can ask me to modify the description "
            "or bullets. I will only add the project "
            "to your resume after you approve it.",
        ]
    )

    return "\n".join(lines)


def _extract_github_analysis_from_history(
    history: list[dict[str, Any]],
) -> dict[str, Any] | None:
    """
    Recover the most recent GitHub analysis from
    the assistant conversation history.

    This lets the chatbot remain stateless between
    requests while the frontend sends conversation history.
    """

    for item in reversed(history):

        if (
            item.get("role")
            != "assistant"
        ):
            continue

        content = str(
            item.get(
                "content",
                "",
            )
        )

        if (
            "GitHub project analysis completed."
            not in content
        ):
            continue

        project_match = re.search(
            r"Project:\s*(.+)",
            content,
        )

        type_match = re.search(
            r"Type:\s*(.+)",
            content,
        )

        technologies_match = re.search(
            r"Technologies:\s*(.+)",
            content,
        )

        description_match = re.search(
            r"Resume Description:\s*(.*?)(?:\n\nResume Bullets:|\n\nGitHub:|\Z)",
            content,
            flags=re.DOTALL,
        )

        github_match = re.search(
            r"GitHub:\s*(https://github\.com/\S+)",
            content,
        )

        bullets = []

        bullets_match = re.search(
            r"Resume Bullets:\s*(.*?)(?:\n\nGitHub:|\Z)",
            content,
            flags=re.DOTALL,
        )

        if bullets_match:

            bullet_text = (
                bullets_match
                .group(1)
                .strip()
            )

            bullets = [
                line.lstrip(
                    "- "
                ).strip()
                for line
                in bullet_text.splitlines()
                if line.strip()
            ]

        return {
            "project_name": (
                project_match.group(1).strip()
                if project_match
                else ""
            ),
            "project_type": (
                type_match.group(1).strip()
                if type_match
                else ""
            ),
            "technologies": (
                [
                    item.strip()
                    for item
                    in technologies_match
                    .group(1)
                    .split(",")
                    if item.strip()
                ]
                if technologies_match
                else []
            ),
            "description": (
                description_match
                .group(1)
                .strip()
                if description_match
                else ""
            ),
            "resume_bullets": bullets,
            "github_url": (
                github_match.group(1).strip()
                if github_match
                else ""
            ),
        }

    return None



def _last_assistant_content(history: list[dict[str, Any]]) -> str:
    for item in reversed(history):
        if item.get("role") == "assistant":
            return str(item.get("content", ""))
    return ""


def _looks_like_bullet_request(message: str) -> bool:
    text = message.lower()
    keywords = (
        "bullet",
        "bullets",
        "first point",
        "second point",
        "third point",
        "one more line",
        "one more point",
        "continuation",
        "continue the point",
        "expand the point",
        "add to the point",
        "add more to",
        "strengthen the point",
        "rewrite the point",
        "modify the point",
    )
    return any(keyword in text for keyword in keywords)


def _looks_like_add_bullets(message: str) -> bool:
    text = message.lower()
    return (
        "add bullets" in text
        or "add the bullets" in text
        or "bullets too" in text
        or "include the bullets" in text
    )


def _extract_pending_bullet(history: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Recover the latest pending bullet proposal from chat history."""
    for item in reversed(history):
        if item.get("role") != "assistant":
            continue
        content = str(item.get("content", ""))
        if "PENDING_BULLET_CHANGE" not in content:
            continue

        project_match = re.search(r"Project:\s*(.+)", content)
        index_match = re.search(r"Bullet Index:\s*(\d+)", content)
        bullet_match = re.search(
            r"Proposed Bullet:\s*(.*?)(?:\n\n|\nPlease approve|\Z)",
            content,
            flags=re.DOTALL,
        )

        if not bullet_match:
            continue

        return {
            "project_name": project_match.group(1).strip() if project_match else "",
            "index": int(index_match.group(1)) if index_match else 0,
            "bullet": bullet_match.group(1).strip(),
        }
    return None


def _extract_pending_bullets(history: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Recover a pending full-bullets proposal."""
    for item in reversed(history):
        if item.get("role") != "assistant":
            continue
        content = str(item.get("content", ""))
        if "PENDING_BULLETS_CHANGE" not in content:
            continue

        project_match = re.search(r"Project:\s*(.+)", content)
        bullets_match = re.search(
            r"Proposed Bullets:\s*(.*?)(?:\n\n|\nPlease approve|\Z)",
            content,
            flags=re.DOTALL,
        )
        if not bullets_match:
            continue

        bullets = [
            line.lstrip("-• ").strip()
            for line in bullets_match.group(1).splitlines()
            if line.strip()
        ]
        return {
            "project_name": project_match.group(1).strip() if project_match else "",
            "bullets": bullets,
        }
    return None


def _generate_bullet_revision(
    project: dict[str, Any],
    user_request: str,
    bullet_index: int,
) -> str:
    bullets = project.get("resume_bullets", []) or []
    if not bullets or bullet_index >= len(bullets):
        raise ValueError("The requested bullet does not exist in the GitHub analysis.")

    current = bullets[bullet_index]
    prompt = f"""
You are an expert technical resume writer.

PROJECT: {project.get('project_name', '')}
DESCRIPTION: {project.get('description', '')}
TECHNOLOGIES: {', '.join(project.get('technologies', []))}

CURRENT BULLET:
{current}

USER REQUEST:
{user_request}

Write ONE revised resume bullet.
Rules:
- Preserve facts from the project context.
- Do not invent metrics, technologies, features, or achievements.
- If the user asks to continue/add a line to the point, integrate a concise continuation into the same bullet.
- Keep it professional and resume-ready.
- Return only the revised bullet text, with no numbering or quotation marks.
"""

    result = generate_text(
        prompt=prompt,
        model="llama-3.3-70b-versatile",
        temperature=0.2,
        json_mode=False,
    )

    cleaned = " ".join(
        line.strip().lstrip("0123456789.-•) ")
        for line in result.splitlines()
        if line.strip()
    ).strip()

    if not cleaned:
        raise RuntimeError("AI could not generate the requested bullet modification.")
    return cleaned


def _find_resume_project_index(
    resume: dict[str, Any],
    project_name: str,
) -> int | None:
    projects = resume.get("projects", []) or []
    target = project_name.strip().lower()
    for index, project in enumerate(projects):
        if str(project.get("name", "")).strip().lower() == target:
            return index
    return None


def _build_project_operation(
    analysis: dict[str, Any],
    resume: dict[str, Any],
    bullets: list[str] | None = None,
) -> dict[str, Any]:
    project_name = str(analysis.get("project_name", "")).strip()
    description = str(analysis.get("description", "")).strip()
    technologies = analysis.get("technologies", []) or []
    github_url = str(analysis.get("github_url", "")).strip()
    final_bullets = bullets if bullets is not None else list(analysis.get("resume_bullets", []) or [])

    existing_index = _find_resume_project_index(resume, project_name)

    if existing_index is not None:
        return {
            "action": "update",
            "section": "projects",
            "field": "bullets",
            "index": existing_index,
            "data": final_bullets,
        }

    return {
        "action": "add",
        "section": "projects",
        "field": None,
        "index": None,
        "data": {
            "name": project_name,
            "description": description,
            "technologies": ", ".join(str(item) for item in technologies),
            "bullets": final_bullets,
            "projectLink": github_url,
            "githubLink": github_url,
        },
    }

# =========================================================
# GITHUB CONVERSATION HANDLER
# =========================================================

def _handle_github_conversation(
    message: str,
    history: list[dict[str, Any]],
    resume: dict[str, Any],
) -> ResumeChatResponse | None:
    """
    Handle GitHub analysis conversations before
    sending the request to the general resume AI prompt.

    Returns:
        ResumeChatResponse when this is a GitHub flow.
        None when normal resume AI handling should continue.
    """

    last_assistant = (
        _get_last_assistant_message(
            history
        )
    )

    previous_users = (
        _get_user_messages(
            history
        )
    )

    # -----------------------------------------------------
    # 1. Initial GitHub analysis request
    # -----------------------------------------------------

    if _looks_like_github_analysis_request(
        message
    ):

        return ResumeChatResponse(
            reply=(
                "Sure! I can analyze your GitHub "
                "project and create resume-ready content. "
                "What is your GitHub username?"
            ),
            operations=[],
            needs_clarification=True,
            clarifying_question=(
                "What is your GitHub username?"
            ),
        )

    # -----------------------------------------------------
    # 2. Username
    # -----------------------------------------------------

    if _is_github_username_question(
        last_assistant
    ):

        username = (
            _extract_github_username(
                message
            )
        )

        if not username:

            return ResumeChatResponse(
                reply=(
                    "Please provide your GitHub username."
                ),
                operations=[],
                needs_clarification=True,
                clarifying_question=(
                    "What is your GitHub username?"
                ),
            )

        return ResumeChatResponse(
            reply=(
                f"Thanks! GitHub username "
                f"`{username}` received. "
                "What is the repository/project name?"
            ),
            operations=[],
            needs_clarification=True,
            clarifying_question=(
                "What is the repository/project name?"
            ),
        )

    # -----------------------------------------------------
    # 3. Repository name
    # -----------------------------------------------------

    if _is_github_repository_question(
        last_assistant
    ):

        repo = (
            _extract_repository_name(
                message
            )
        )

        if not repo:

            return ResumeChatResponse(
                reply=(
                    "Please provide the GitHub "
                    "repository name."
                ),
                operations=[],
                needs_clarification=True,
                clarifying_question=(
                    "What is the repository/project name?"
                ),
            )

        # The previous user message should be the
        # GitHub username.
        owner = ""

        if previous_users:

            # Find the most recent username-like
            # answer before the repository answer.
            for candidate in reversed(
                previous_users[:-1]
            ):

                candidate_clean = (
                    candidate.strip()
                )

                if candidate_clean:

                    owner = (
                        _extract_github_username(
                            candidate_clean
                        )
                    )

                    break

        if not owner:

            return ResumeChatResponse(
                reply=(
                    "I need your GitHub username "
                    "before I can analyze the repository."
                ),
                operations=[],
                needs_clarification=True,
                clarifying_question=(
                    "What is your GitHub username?"
                ),
            )

        # -------------------------------------------------
        # Analyze repository using existing analyzer
        # -------------------------------------------------

        try:

            analysis = analyze_repository(
                owner,
                repo,
            )

            reply = _format_github_analysis(
                analysis,
                owner,
                repo,
            )

            return ResumeChatResponse(
                reply=reply,
                operations=[],
                needs_clarification=False,
                clarifying_question="",
            )

        except ValueError as exc:

            return ResumeChatResponse(
                reply=(
                    f"I couldn't analyze "
                    f"{owner}/{repo}. "
                    f"{str(exc)}"
                ),
                operations=[],
                needs_clarification=False,
                clarifying_question="",
            )

        except Exception as exc:

            return ResumeChatResponse(
                reply=(
                    "I couldn't analyze that GitHub "
                    f"repository: {str(exc)}"
                ),
                operations=[],
                needs_clarification=False,
                clarifying_question="",
            )

    # -----------------------------------------------------
    # 4. GitHub analysis already exists
    # -----------------------------------------------------

    github_analysis = (
        _extract_github_analysis_from_history(
            history
        )
    )

    if github_analysis:

        # -------------------------------------------------
        # Approve a pending bullet change
        # -------------------------------------------------

        pending_bullet = _extract_pending_bullet(history)
        pending_bullets = _extract_pending_bullets(history)

        if _looks_like_approval(message) and pending_bullet:
            bullets = list(github_analysis.get("resume_bullets", []) or [])
            index = pending_bullet["index"]
            if index < len(bullets):
                bullets[index] = pending_bullet["bullet"]
            operation = _build_project_operation(
                github_analysis,
                resume={},
                bullets=bullets,
            )
            # The caller will replace the add/update decision using the
            # current resume in the general operation path below.
            operation = _build_project_operation(
                github_analysis,
                resume=resume,
                bullets=bullets,
            )
            return ResumeChatResponse(
                reply=f"Done. I applied the revised first bullet to {github_analysis.get('project_name', 'the project')}.",
                operations=[operation],
                needs_clarification=False,
                clarifying_question="",
            )

        if _looks_like_approval(message) and pending_bullets:
            operation = _build_project_operation(
                github_analysis,
                resume=resume,
                bullets=pending_bullets["bullets"],
            )
            return ResumeChatResponse(
                reply=f"Done. The GitHub bullets have been added to {github_analysis.get('project_name', 'the project')}.",
                operations=[operation],
                needs_clarification=False,
                clarifying_question="",
            )

        # -------------------------------------------------
        # Request to add GitHub bullets
        # -------------------------------------------------

        if _looks_like_add_bullets(message):
            bullets = list(github_analysis.get("resume_bullets", []) or [])
            bullet_text = "\n".join(f"- {bullet}" for bullet in bullets)
            return ResumeChatResponse(
                reply=(
                    "PENDING_BULLETS_CHANGE\n"
                    f"Project: {github_analysis.get('project_name', '')}\n\n"
                    "Proposed Bullets:\n"
                    f"{bullet_text}\n\n"
                    "Please approve these bullets by replying yes."
                ),
                operations=[],
                needs_clarification=False,
                clarifying_question="",
            )

        # -------------------------------------------------
        # Natural-language bullet modification
        # -------------------------------------------------

        if _looks_like_bullet_request(message):
            text = message.lower()
            bullet_index = 0
            if "second" in text or "2nd" in text:
                bullet_index = 1
            elif "third" in text or "3rd" in text:
                bullet_index = 2

            revised = _generate_bullet_revision(
                github_analysis,
                message,
                bullet_index,
            )

            return ResumeChatResponse(
                reply=(
                    "PENDING_BULLET_CHANGE\n"
                    f"Project: {github_analysis.get('project_name', '')}\n"
                    f"Bullet Index: {bullet_index}\n\n"
                    f"Proposed Bullet: {revised}\n\n"
                    "Please approve this change by replying yes."
                ),
                operations=[],
                needs_clarification=False,
                clarifying_question="",
            )

        # -------------------------------------------------
        # Explicit approval
        # -------------------------------------------------

        if _looks_like_approval(
            message
        ):

            project_name = (
                github_analysis.get(
                    "project_name",
                    "",
                )
            )

            description = (
                github_analysis.get(
                    "description",
                    "",
                )
            )

            technologies = (
                github_analysis.get(
                    "technologies",
                    [],
                )
            )

            github_url = (
                github_analysis.get(
                    "github_url",
                    "",
                )
            )

            if not project_name:

                return ResumeChatResponse(
                    reply=(
                        "I couldn't determine the "
                        "project name from the GitHub analysis."
                    ),
                    operations=[],
                    needs_clarification=False,
                    clarifying_question="",
                )

            operation = _build_project_operation(
                github_analysis,
                resume=resume,
                bullets=list(
                    github_analysis.get("resume_bullets", []) or []
                ),
            )

            return ResumeChatResponse(
                reply=(
                    f"{project_name} has been "
                    "approved and added to your resume."
                ),
                operations=[
                    operation
                ],
                needs_clarification=False,
                clarifying_question="",
            )

        # -------------------------------------------------
        # Otherwise let the general AI handle modification
        # -------------------------------------------------

        return None

    return None


# =========================================================
# CHAT FUNCTION
# =========================================================

def process_resume_chat(
    message: str,
    resume: dict[str, Any],
    history: list[dict[str, Any]] | None = None,
) -> ResumeChatResponse:
    """
    Send the user's resume request to the AI and convert
    the response into validated ResumeChatResponse data.

    The AI receives:
    - current resume
    - current user message
    - previous conversation history

    GitHub analysis conversations are handled through
    the existing GitHub analyzer.
    """

    conversation_history = (
        history or []
    )

    # Keep the most recent messages.
    conversation_history = (
        conversation_history[-40:]
    )

    # -----------------------------------------------------
    # GitHub conversation handling
    # -----------------------------------------------------

    github_result = (
        _handle_github_conversation(
            message=message,
            history=conversation_history,
            resume=resume,
        )
    )

    if github_result is not None:

        return github_result

    # -----------------------------------------------------
    # Resume JSON
    # -----------------------------------------------------

    resume_json = json.dumps(
        resume,
        indent=2,
        ensure_ascii=False,
    )

    history_json = json.dumps(
        conversation_history,
        indent=2,
        ensure_ascii=False,
    )

    # -----------------------------------------------------
    # Build prompt
    #
    # IMPORTANT:
    # Do NOT use .format().
    #
    # The prompt contains many JSON examples with { }.
    # .format() would interpret those braces as Python
    # formatting placeholders.
    # -----------------------------------------------------

    prompt = (
        RESUME_CHAT_PROMPT
        .replace(
            "{resume_json}",
            resume_json,
        )
        .replace(
            "{history_json}",
            history_json,
        )
        .replace(
            "{user_message}",
            message,
        )
    )

    # -----------------------------------------------------
    # Call AI
    # -----------------------------------------------------

    raw_response = generate_text(
        prompt=prompt,
        model="llama-3.3-70b-versatile",
        temperature=0.0,
        json_mode=True,
    )

    if not raw_response:

        raise RuntimeError(
            "AI returned an empty response."
        )

    # -----------------------------------------------------
    # Clean response
    # -----------------------------------------------------

    cleaned_response = (
        _clean_json_response(
            raw_response
        )
    )

    # -----------------------------------------------------
    # Parse JSON
    # -----------------------------------------------------

    try:

        parsed = json.loads(
            cleaned_response
        )

    except json.JSONDecodeError as exc:

        raise RuntimeError(
            "AI returned invalid JSON."
        ) from exc

    # -----------------------------------------------------
    # Normalize + validate
    # -----------------------------------------------------

    try:

        normalized = (
            _normalize_response(
                parsed
            )
        )

        return (
            ResumeChatResponse
            .model_validate(
                normalized
            )
        )

    except Exception as exc:

        raise RuntimeError(
            "AI response did not match the expected "
            "resume chatbot structure. "
            f"AI response: {cleaned_response}"
        ) from exc