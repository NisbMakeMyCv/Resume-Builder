import json
import re
from typing import Any

from app.ai.llm import generate_text
from app.ai.github.analyzer import analyze_repository
from app.schemas.resume_ai import ResumeChatResponse

WELCOME_MESSAGE = (
    "Hi! I'm your Resume Copilot. I can understand natural-language requests "
    "to add, edit, delete, rewrite, analyze, organize, and improve your resume. "
    "You can also paste a job description or ask me to analyze a GitHub project."
)

MODEL = "llama-3.3-70b-versatile"

# The frontend currently uses this normalized shape. The helper functions below
# also tolerate common legacy variations such as technical_skills and arrays for
# education/experience.
SYSTEM_PROMPT = r"""
You are MakeMyCV Resume Copilot, an intelligent conversational resume agent.

You are NOT a keyword matcher. Understand the user's meaning, context, intent,
entities, references (it/that/this/first/latest), corrections, confirmations,
and incomplete follow-up answers. Treat the conversation as one continuous task.

CORE BEHAVIOR
1. Understand natural language. These should all map to the same intent when
   appropriate: "add Python", "put Python in my skills", "include Python",
   "I know Python", "Python is one of my skills".
2. Use conversation context. A short answer such as "skills", "projects", "yes",
   "there", "the first one", "React", or "change it" may complete the previous
   task. NEVER restart a task merely because the current message is short.
3. Maintain task continuity. If the assistant previously asked a question,
   interpret the user's next answer as the answer to that question unless the
   user clearly starts a new task.
4. Understand corrections: "actually", "I meant", "no, use...", "change that",
   and "instead" revise the pending task rather than starting a new unrelated one.
5. Resolve references such as "it", "that project", "my latest project",
   "first project", "second skill", "the description", "that bullet" using the
   current resume and recent conversation.
6. Handle multiple actions in one message. Example: "Remove Java, add Python and
   change my email to x@y.com" => multiple operations.
7. Do not ask a question if the user's intent is sufficiently clear.
8. Ask ONE focused clarification only when a required decision or fact is truly
   missing. Never ask for information that is already present in the resume or
   conversation.
9. If a request is informational/advisory, do not modify the resume.
10. Never invent resume facts UNLESS the user explicitly asks for dummy, sample,
    placeholder, or example data. When they do, generate realistic and
    professional-sounding content across all sections.
11. You may rewrite existing facts for clarity, ATS wording, grammar, concision,
    impact, or professionalism, but must preserve factual meaning.
12. Never duplicate an existing skill/project/certification. If it already exists,
    explain that it is already present unless the user asked to update/move it.
13. Never silently delete or replace large parts of the resume. Destructive bulk
    actions require confirmation in the reply and no operations on the first turn.
14. For "yes" or "no", use the immediately pending question/task from history.
15. If the user says "undo" or "undo that", do not invent an operation unless
    the conversation contains enough information to safely reverse the immediately
    previous AI change. If it cannot be reversed safely, explain that and ask which
    change they want reversed.
16. When the user asks to "fill", "populate", "add dummy data", "add sample data",
    "add placeholder", or "fill everything", generate realistic professional
    resume content for ALL empty sections. Use believable names, companies,
    universities, skills, and project descriptions. Make it look like a real
    software engineer's resume.

RESUME SHAPE (THIS IS THE EXACT FRONTEND SCHEMA — USE THESE FIELD NAMES)
{
  "personal": {"name":"", "phone":"", "email":"", "linkedin":"", "github":""},
  "education": [{"school":"", "degree":"", "location":"", "dates":"", "coursework":""}],
  "experience": [{"company":"", "title":"", "location":"", "dates":"", "bullets":[]}],
  "projects": [{"title":"", "technologies":"", "dates":"", "links":"", "bullets":[]}],
  "skills": [{"category":"", "items":""}],
  "certifications": [{"name":"", "organization":"", "issueDate":"", "credentialId":"", "credentialUrl":""}],
  "achievements": [{"title":"", "organization":"", "date":"", "description":""}]
}

CRITICAL FIELD NAME RULES
- Education uses "school" (NOT "institution"), "degree", "location", "dates", "coursework".
- Experience uses "company", "title" (NOT "role" or "job_title"), "location", "dates", "bullets".
- Projects uses "title" (NOT "name"), "technologies" (a string, NOT array), "dates", "links", "bullets".
- Skills uses "category" and "items" (a comma-separated string, NOT "name").
- ALWAYS use these exact field names. The frontend will silently ignore operations
  with wrong field names.

ALLOWED SECTIONS
personal, education, experience, projects, skills, certifications, achievements

ALLOWED ACTIONS
add, update, delete, replace, clear

OPERATION SCHEMA
{
  "action": "add|update|delete|replace|clear",
  "section": "personal|education|experience|projects|skills|certifications|achievements",
  "field": "field name or null",
  "index": "zero-based array index or null",
  "data": "new value/object/array or null"
}

OPERATION RULES
- update personal field: {"action":"update", "section":"personal", "field":"email", "data":"new@email.com"}
- add education: {"action":"add", "section":"education", "data":{"school":"MIT", "degree":"B.S. CS", "location":"Cambridge, MA", "dates":"Aug 2020 - May 2024", "coursework":"Algorithms, OS"}}
- add experience: {"action":"add", "section":"experience", "data":{"company":"Google", "title":"SDE Intern", "location":"Mountain View, CA", "dates":"May 2023 - Aug 2023", "bullets":["Built X", "Improved Y"]}}
- add project: {"action":"add", "section":"projects", "data":{"title":"ChatApp", "technologies":"React, Node.js, Socket.io", "dates":"Jan 2024", "links":"github.com/user/chatapp", "bullets":["Built real-time chat"]}}
- add skill: {"action":"add", "section":"skills", "data":{"category":"Languages", "items":"Python, JavaScript, TypeScript"}}
- delete array item: provide the current zero-based index.
- clear a field: action=clear with field.
- clear an array: action=clear with no index/field.
- Prefer the smallest safe operation.
- Never return technical_skills; map it to skills for this frontend.

SKILL INTELLIGENCE
- Skills are grouped by category with comma-separated items.
- Example: {"category": "Languages", "items": "Python, Java, C++"}
- Example: {"category": "Frameworks", "items": "React, Next.js, FastAPI"}
- When adding a single skill, check if a matching category already exists and
  update that category's items string instead of creating a new entry.

PROJECT INTELLIGENCE
- "first/second/last/latest project" resolves to the current array index.
- "make the project description better" updates only the bullets.
- "make the bullets stronger" rewrites existing bullets without adding facts.
- If the user asks to add a project but required factual information is missing,
  ask only for the missing essentials.

PERSONAL INFORMATION
Understand requests like:
"change my email", "update phone", "put my GitHub here", "remove LinkedIn",
"change my name", "set my location to Mysore".

IMPROVEMENT / ATS
- "make my resume professional", "improve my resume", "make it ATS friendly",
  "rewrite my project", etc. should use existing facts only.
- Improve wording, grammar, action verbs, concision and relevance.
- Never create fake metrics. Do not change a user's technology stack.

OUTPUT
Return EXACTLY one JSON object and nothing else:
{
  "reply": "helpful natural-language response",
  "operations": [],
  "needs_clarification": false,
  "clarifying_question": ""
}

If clarification is required:
{
  "reply": "brief explanation",
  "operations": [],
  "needs_clarification": true,
  "clarifying_question": "ONE focused question"
}

CURRENT RESUME:
{resume_json}

CONVERSATION HISTORY (oldest to newest):
{history_json}

CURRENT USER MESSAGE:
{user_message}
"""


def _clean_json_response(raw: str) -> str:
    text = (raw or "").strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].strip().startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def _normalize_operation(op: Any) -> dict[str, Any]:
    if not isinstance(op, dict):
        raise ValueError("Each operation must be an object")
    data = op.get("data")
    if isinstance(data, dict) and set(data.keys()) == {"value"}:
        data = data["value"]
    section = op.get("section")
    if section == "technical_skills":
        section = "skills"
    return {
        "action": op.get("action"),
        "section": section,
        "field": op.get("field"),
        "index": op.get("index"),
        "data": data,
    }


def _normalize_response(parsed: Any) -> dict[str, Any]:
    if not isinstance(parsed, dict):
        raise ValueError("AI response must be a JSON object")
    operations = parsed.get("operations") or []
    if not isinstance(operations, list):
        operations = [operations]
    return {
        "reply": str(parsed.get("reply") or ""),
        "operations": [_normalize_operation(x) for x in operations],
        "needs_clarification": bool(parsed.get("needs_clarification", False)),
        "clarifying_question": str(parsed.get("clarifying_question") or ""),
    }


def _history_dicts(history: list[dict[str, Any]]) -> list[dict[str, str]]:
    return [
        {"role": str(x.get("role") or ""), "content": str(x.get("content") or "")}
        for x in history[-40:]
        if x.get("role") in {"user", "assistant"}
    ]


def _last_assistant(history: list[dict[str, Any]]) -> str:
    for item in reversed(history):
        if item.get("role") == "assistant":
            return str(item.get("content") or "")
    return ""


def _last_user(history: list[dict[str, Any]]) -> str:
    for item in reversed(history):
        if item.get("role") == "user":
            return str(item.get("content") or "")
    return ""


def _previous_user_messages(history: list[dict[str, Any]]) -> list[str]:
    return [str(x.get("content") or "") for x in history if x.get("role") == "user"]


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def _compact(text: str, limit: int = 500) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    return text[:limit]


def _is_short_followup(message: str) -> bool:
    words = _norm(message).split()
    return len(words) <= 8


def _looks_like_confirmation(message: str) -> bool:
    return _norm(message) in {
        "yes", "y", "yeah", "yep", "sure", "okay", "ok", "do it",
        "go ahead", "approved", "approve", "add it", "apply it", "that's fine",
        "no", "n", "nope", "don't", "cancel", "never mind",
    }


def _pending_target_from_assistant(text: str) -> str:
    t = _norm(text)
    if any(x in t for x in ["skill or project", "skill or a project", "skills or projects"]):
        return "skill_or_project"
    if "what skill" in t or "which skill" in t or "add, update or delete" in t:
        return "skill"
    if "repository name" in t or "repo name" in t:
        return "github_repo"
    if "github username" in t:
        return "github_username"
    if any(x in t for x in ["company", "organization"]):
        return "company"
    if "role" in t or "job title" in t:
        return "role"
    if "date" in t or "when" in t:
        return "date"
    if "project" in t and "which" in t:
        return "project"
    return ""


def _resolve_short_followup(message: str, history: list[dict[str, Any]]) -> str:
    """Turn common conversational fragments into a complete task before the LLM sees them."""
    if not history or not _is_short_followup(message):
        return message

    last_assistant = _last_assistant(history)
    previous_users = _previous_user_messages(history)
    pending = _pending_target_from_assistant(last_assistant)
    current = message.strip()
    n = _norm(current)

    # "skill" after "embedding" + assistant asking skill/project.
    if pending == "skill_or_project" and n in {"skill", "skills", "as a skill", "technical skill"}:
        previous = previous_users[-1] if previous_users else ""
        if previous and len(previous.split()) <= 8:
            return f"Complete the previous task by adding '{previous}' as a skill."

    if pending == "skill_or_project" and n in {"project", "projects", "as a project"}:
        previous = previous_users[-1] if previous_users else ""
        if previous and len(previous.split()) <= 8:
            return f"Complete the previous task by adding '{previous}' as a project."

    # "yes" after an assistant asks for approval.
    if n in {"yes", "y", "yeah", "yep", "sure", "okay", "ok", "do it", "go ahead", "approved", "approve", "apply it", "add it"}:
        if any(x in _norm(last_assistant) for x in ["shall i", "would you like", "do you want", "should i", "want me to", "say 'yes", "approve"]):
            return "Approve the immediately preceding proposal/action."

    # Direct answer to common clarification questions.
    if pending and current:
        previous = previous_users[-1] if previous_users else ""
        if pending in {"company", "role", "date", "github_username", "github_repo"}:
            return (
                f"Continue the previous task. The assistant asked for {pending}. "
                f"The user's answer is: {current}."
            )

    # Pronoun follow-up: "make it shorter", "remove it", etc. The model can
    # resolve the actual referent from the supplied history/resume.
    if n in {"change it", "edit it", "improve it", "rewrite it", "make it better", "remove it", "delete it", "keep it", "add it"}:
        return f"Continue the previous task. The user says: {current}. Resolve 'it' from the immediately preceding context."

    return message


def _clean_resume(resume: dict[str, Any]) -> dict[str, Any]:
    r = dict(resume or {})
    r.setdefault("personal", {})
    r.setdefault("education", {})
    r.setdefault("experience", {})
    r.setdefault("projects", [])
    r.setdefault("skills", [])
    r.setdefault("certifications", [])
    r.setdefault("achievements", [])

    # Legacy backend shape -> current frontend shape.
    if not r.get("skills") and isinstance(r.get("technical_skills"), dict):
        skills = []
        ts = r.get("technical_skills") or {}
        for category_key, values in ts.items():
            category = {
                "languages": "Programming Language",
                "frameworks": "Framework",
                "developer_tools": "Developer Tool",
                "libraries": "Library",
            }.get(category_key, category_key.replace("_", " ").title())
            for value in values or []:
                skills.append({"name": str(value), "category": category})
        r["skills"] = skills

    # Keep education/experience as arrays — the frontend uses arrays and the
    # system prompt now documents the correct array schema.

    return r


def _skill_index(resume: dict[str, Any], name: str) -> int | None:
    wanted = _norm(name)
    for i, item in enumerate(resume.get("skills") or []):
        if isinstance(item, dict) and _norm(str(item.get("name") or "")) == wanted:
            return i
    return None


def _project_index(resume: dict[str, Any], name: str) -> int | None:
    wanted = _norm(name)
    for i, item in enumerate(resume.get("projects") or []):
        if isinstance(item, dict) and _norm(str(item.get("name") or "")) == wanted:
            return i
    return None


def _parse_index_reference(text: str, size: int) -> int | None:
    n = _norm(text)
    if size <= 0:
        return None
    if "first" in n:
        return 0
    if "second" in n and size >= 2:
        return 1
    if "third" in n and size >= 3:
        return 2
    if "last" in n or "latest" in n:
        return size - 1
    m = re.search(r"\b(\d+)(?:st|nd|rd|th)?\b", n)
    if m:
        idx = int(m.group(1)) - 1
        return idx if 0 <= idx < size else None
    return None


def _looks_like_jd(message: str) -> bool:
    t = _norm(message)
    return (
        "job description" in t
        or re.search(r"\bjd\b", t) is not None
        or ("job" in t and any(x in t for x in ["match", "skills", "requirements", "analy", "fit"]))
    )


def _is_github_request(message: str) -> bool:
    """Detect GitHub-backed resume tasks, including natural requests such as
    'add my Amazon-Clone project, you can see it in my GitHub'.

    The old detector required the literal word 'analyze', which meant the LLM
    handled GitHub-add requests itself and could hallucinate that a project had
    already been added. GitHub requests are now intercepted before the generic
    LLM path whenever the user explicitly asks us to use/see/check GitHub.
    """
    t = _norm(message)
    has_github = any(x in t for x in [
        "github", "git hub", "repository", "repo", "github.com"
    ])
    if not has_github:
        return False

    action_words = [
        "add", "include", "import", "use", "see", "check", "look",
        "fetch", "get", "pull", "analy", "analyze", "analyse",
        "review", "scan", "find", "from my github", "in my github",
    ]
    return any(x in t for x in action_words)


def _github_owner_from_resume(resume: dict[str, Any]) -> str:
    """Extract the GitHub username from the user's saved GitHub URL."""
    personal = resume.get("personal") or {}
    candidates = [
        personal.get("github"),
        personal.get("githubUrl"),
        personal.get("github_url"),
    ]
    for value in candidates:
        text = str(value or "").strip()
        if not text:
            continue
        match = re.search(r"github\.com/([^/\s?#]+)", text, re.I)
        if match:
            return match.group(1)
    return ""


def _github_repo_from_message(message: str) -> str:
    """Extract a repository name from common natural-language requests."""
    text = message.strip()

    # Explicit repo/repository syntax.
    match = re.search(
        r"(?:repository|repo)(?:\s+name)?\s*(?:is|:|-)?\s*([A-Za-z0-9_.-]+)",
        text, re.I,
    )
    if match:
        return match.group(1).strip()

    # GitHub URL: https://github.com/owner/repository
    match = re.search(
        r"github\.com/[A-Za-z0-9_.-]+/([A-Za-z0-9_.-]+)",
        text, re.I,
    )
    if match:
        return match.group(1).strip()

    # 'add my Amazon-Clone project ... github' / 'project Amazon-Clone ...'
    match = re.search(
        r"(?:project|repository|repo)\s+([A-Za-z0-9][A-Za-z0-9_.-]{1,100})",
        text, re.I,
    )
    if match:
        candidate = match.group(1).strip().rstrip(".,!?;:")
        if candidate.lower() not in {"in", "on", "from", "to", "using", "on"}:
            return candidate

    # 'Amazon-Clone project'
    match = re.search(
        r"\b([A-Za-z0-9][A-Za-z0-9_.-]{1,100})\s+project\b",
        text, re.I,
    )
    if match:
        return match.group(1).strip()

    return ""


def _is_github_username_question(message: str) -> bool:
    t = _norm(message)
    return "github username" in t or ("username" in t and "github" in t)


def _is_github_repo_question(message: str) -> bool:
    t = _norm(message)
    return ("repository" in t or "repo" in t) and any(x in t for x in ["name", "which", "what"])


def _extract_username(message: str) -> str:
    text = message.strip()
    match = re.search(r"(?:github\s+)?username\s*[:\-]?\s*([A-Za-z0-9-]+)", text, re.I)
    if match:
        return match.group(1)
    return text if re.fullmatch(r"[A-Za-z0-9-]+", text) else ""


def _extract_repo(message: str) -> str:
    text = message.strip()
    match = re.search(r"(?:repository|repo)(?:\s+name)?\s*[:\-]?\s*(.+)", text, re.I)
    return match.group(1).strip() if match else text


def _github_analysis_from_history(history: list[dict[str, Any]]) -> dict[str, Any] | None:
    for item in reversed(history):
        if item.get("role") != "assistant":
            continue
        content = str(item.get("content") or "")
        if "GitHub project analysis completed." not in content:
            continue

        def one(pattern: str) -> str:
            m = re.search(pattern, content, re.I | re.S)
            return m.group(1).strip() if m else ""

        bullets_text = one(r"Resume Bullets:\s*(.*?)(?:\n\nGitHub:|\Z)")
        bullets = [
            re.sub(r"^[-•\d.)\s]+", "", line).strip()
            for line in bullets_text.splitlines()
            if line.strip()
        ]
        return {
            "project_name": one(r"Project:\s*(.+)"),
            "technologies": [x.strip() for x in one(r"Technologies:\s*(.+)").split(",") if x.strip()],
            "description": one(r"Resume Description:\s*(.*?)(?:\n\nResume Bullets:|\n\nGitHub:|\Z)"),
            "resume_bullets": bullets,
            "github_url": one(r"GitHub:\s*(https://github\.com/\S+)"),
        }
    return None


def _approval(message: str) -> bool:
    return _norm(message) in {
        "yes", "yes add it", "add it", "add this", "add this project",
        "add it to my resume", "add this to my resume", "approve", "approved",
        "looks good, add it", "yes, add it", "do it", "go ahead",
    } or (_norm(message).startswith("yes") and "add" in _norm(message))


def _github_add_operation(analysis: dict[str, Any], resume: dict[str, Any]) -> dict[str, Any]:
    name = analysis.get("project_name") or "GitHub Project"
    idx = _project_index(resume, name)
    data = {
        "name": name,
        "description": analysis.get("description", ""),
        "technologies": ", ".join(analysis.get("technologies") or []),
        "bullets": analysis.get("resume_bullets") or [],
        "projectLink": analysis.get("github_url", ""),
        "githubLink": analysis.get("github_url", ""),
    }
    if idx is None:
        return {"action": "add", "section": "projects", "field": None, "index": None, "data": data}
    return {"action": "update", "section": "projects", "field": None, "index": idx, "data": data}


def _handle_github(message: str, history: list[dict[str, Any]], resume: dict[str, Any]) -> ResumeChatResponse | None:
    """Handle GitHub workflows before the generic LLM.

    This prevents the model from claiming a project was added when GitHub data
    has not actually been fetched. It supports both:
      - explicit username -> repository follow-up
      - a saved GitHub URL in the resume -> immediate repository analysis
    """
    last = _last_assistant(history)
    users = _previous_user_messages(history)

    # Approval of a previously displayed GitHub analysis.
    analysis = _github_analysis_from_history(history)
    if analysis and _approval(message):
        return ResumeChatResponse(
            reply=f"Done. I added {analysis['project_name']} to your projects.",
            operations=[_github_add_operation(analysis, resume)],
        )

    # If the assistant previously asked for a GitHub username, consume the answer.
    if _is_github_username_question(last):
        username = _extract_username(message)
        if not username:
            return ResumeChatResponse(
                reply="Please provide your GitHub username.",
                operations=[],
                needs_clarification=True,
                clarifying_question="What is your GitHub username?",
            )
        return ResumeChatResponse(
            reply=f"Thanks. Which repository should I analyze for @{username}?",
            operations=[],
            needs_clarification=True,
            clarifying_question="What is the repository name?",
        )

    # If the assistant previously asked for a repository, consume the answer and analyze.
    if _is_github_repo_question(last):
        repo = _extract_repo(message)
        owner = ""
        for candidate in reversed(users[:-1]):
            owner = _extract_username(candidate)
            if owner:
                break
        if not owner:
            owner = _github_owner_from_resume(resume)
        if not owner:
            return ResumeChatResponse(
                reply="I need your GitHub username first so I can access the repository.",
                operations=[],
                needs_clarification=True,
                clarifying_question="What is your GitHub username?",
            )
        if not repo:
            return ResumeChatResponse(
                reply="Please provide the repository name.",
                operations=[],
                needs_clarification=True,
                clarifying_question="What is the repository name?",
            )
        return _analyze_github_repo(owner, repo)

    # New natural-language GitHub request.
    if _is_github_request(message) and not analysis:
        repo = _github_repo_from_message(message)
        owner = _github_owner_from_resume(resume)

        if not owner:
            return ResumeChatResponse(
                reply=(
                    "Absolutely. I can inspect the GitHub repository and turn the "
                    "actual code/project details into resume-ready content. "
                    "I just need your GitHub username first."
                ),
                operations=[],
                needs_clarification=True,
                clarifying_question="What is your GitHub username?",
            )

        if not repo:
            return ResumeChatResponse(
                reply=f"I found your GitHub account @{owner}. Which repository should I inspect?",
                operations=[],
                needs_clarification=True,
                clarifying_question="What is the repository name?",
            )

        return _analyze_github_repo(owner, repo)

    return None


def _analyze_github_repo(owner: str, repo: str) -> ResumeChatResponse:
    """Fetch and analyze a GitHub repository without modifying the resume yet."""
    owner = owner.strip()
    repo = repo.strip().rstrip("/")
    try:
        analysis = analyze_repository(owner, repo)
        data = analysis.model_dump() if hasattr(analysis, "model_dump") else analysis.dict()
        technologies = data.get("technologies") or []
        bullets = data.get("resume_bullets") or []
        project_name = data.get("project_name") or repo
        github_url = f"https://github.com/{owner}/{repo}"

        reply = (
            "I found and analyzed the GitHub repository. I have NOT changed your resume yet.\n\n"
            f"Project: {project_name}\n"
            f"Type: {data.get('project_type') or 'Software Project'}\n"
            f"Technologies: {', '.join(map(str, technologies)) or 'Not detected'}\n\n"
            f"Resume Description:\n{data.get('description') or 'No reliable description was generated.'}\n\n"
            "Resume Bullets:\n" + "\n".join(f"- {b}" for b in bullets) +
            f"\n\nGitHub: {github_url}\n\n"
            "If this looks correct, say 'yes, add it' and I will add it to your projects."
        )
        return ResumeChatResponse(reply=reply, operations=[])
    except Exception as exc:
        return ResumeChatResponse(
            reply=(
                f"I couldn't analyze the GitHub repository {owner}/{repo}. "
                f"Please check that the repository exists and is accessible. Details: {exc}"
            ),
            operations=[],
        )


def _analyze_job_description(message: str, resume: dict[str, Any]) -> ResumeChatResponse:
    prompt = f"""
You are a strict resume and ATS analyst.

CURRENT RESUME:
{json.dumps(resume, indent=2, ensure_ascii=False)}

JOB DESCRIPTION:
{message}

Give a practical analysis using exactly these headings:
MATCHED SKILLS:
MISSING OR UNDERREPRESENTED SKILLS:
RELEVANT RESUME STRENGTHS:
RECOMMENDED CHANGES:

Rules:
- A skill is matched only if present or clearly equivalent in the resume.
- Missing means requested by the JD but absent from the resume.
- Never tell the user to falsely claim a skill.
- Recommendations may include learning a missing skill or highlighting an existing one.
- Do not modify the resume in this analysis.
- Be concise and specific.
"""
    reply = generate_text(prompt, model=MODEL, temperature=0.1, json_mode=False).strip()
    return ResumeChatResponse(reply=reply or "I couldn't analyze that job description.", operations=[])


def _validate_and_repair_operations(response: dict[str, Any], resume: dict[str, Any]) -> dict[str, Any]:
    """Deterministic safety/quality layer after the LLM.

    It prevents duplicate additions, fixes stale indices for named items, removes
    impossible operations, and makes common add/delete requests reliable.
    """
    out: list[dict[str, Any]] = []
    current = _clean_resume(resume)

    for raw in response.get("operations", []):
        try:
            op = _normalize_operation(raw)
        except Exception:
            continue
        action, section, field, index, data = op["action"], op["section"], op["field"], op["index"], op["data"]
        if section not in {"personal", "education", "experience", "projects", "skills", "certifications", "achievements"}:
            continue
        if action not in {"add", "update", "delete", "replace", "clear"}:
            continue

        if section == "skills" and action == "add" and isinstance(data, dict):
            name = str(data.get("name") or "").strip()
            if not name:
                continue
            existing = _skill_index(current, name)
            if existing is not None:
                # Convert duplicate add into a useful update only if the AI supplied
                # meaningful new category information.
                category = str(data.get("category") or "").strip()
                old_category = str((current.get("skills") or [])[existing].get("category") or "").strip()
                if category and category.lower() != old_category.lower():
                    out.append({"action": "update", "section": "skills", "field": "category", "index": existing, "data": category})
                continue
            data = {"name": name, "category": str(data.get("category") or "Technical").strip() or "Technical"}
            op["data"] = data
            out.append(op)
            current.setdefault("skills", []).append(data)
            continue

        if section == "skills" and action == "delete":
            if index is None and isinstance(data, dict):
                index = _skill_index(current, str(data.get("name") or ""))
                op["index"] = index
            elif index is None and isinstance(data, str):
                index = _skill_index(current, data)
                op["index"] = index
            if index is None or not (0 <= int(index) < len(current.get("skills") or [])):
                continue
            out.append(op)
            current["skills"].pop(int(index))
            continue

        if section == "projects" and action in {"update", "delete"} and index is None and isinstance(data, dict):
            name = str(data.get("name") or "").strip()
            if name:
                op["index"] = _project_index(current, name)
                index = op["index"]
        if section == "projects" and action in {"update", "delete"}:
            if index is None or not (0 <= int(index) < len(current.get("projects") or [])):
                continue

        if section in {"projects", "certifications", "achievements"} and action == "add" and isinstance(data, dict):
            # Duplicate protection by the primary name/title field.
            key = "name" if section != "achievements" else "title"
            wanted = _norm(str(data.get(key) or ""))
            if wanted:
                existing = None
                for i, item in enumerate(current.get(section) or []):
                    if _norm(str(item.get(key) or "")) == wanted:
                        existing = i
                        break
                if existing is not None:
                    continue
            out.append(op)
            current.setdefault(section, []).append(data)
            continue

        if section == "personal" and action in {"update", "clear"} and field:
            out.append(op)
            continue
        if section == "education" and action in {"update", "replace", "clear", "add"}:
            out.append(op)
            continue
        if section == "experience" and action in {"update", "replace", "clear", "add"}:
            out.append(op)
            continue
        if section in {"projects", "certifications", "achievements"} and action in {"update", "delete", "replace", "clear"}:
            out.append(op)
            continue
        if section == "skills" and action in {"update", "replace", "clear"}:
            out.append(op)
            continue

    response["operations"] = out
    return response


def _fallback_short_skill_task(message: str, history: list[dict[str, Any]], resume: dict[str, Any]) -> ResumeChatResponse | None:
    """A deterministic rescue path for the exact conversational failure the old
    chatbot had: user gives an entity, then answers the assistant's category
    question with only 'skill'."""
    last = _last_assistant(history)
    users = _previous_user_messages(history)
    if not users:
        return None
    if _norm(message) not in {"skill", "skills", "as a skill", "technical skill"}:
        return None
    if not any(x in _norm(last) for x in ["skill or project", "skill or a project", "skills or projects"]):
        return None
    candidate = users[-1].strip()
    if not candidate or len(candidate.split()) > 8:
        return None
    # If candidate was itself a question, don't treat it as a skill.
    if "?" in candidate:
        return None
    if _skill_index(resume, candidate) is not None:
        return ResumeChatResponse(reply=f"{candidate} is already in your skills.", operations=[])
    data = {"name": candidate, "category": "Technical"}
    return ResumeChatResponse(
        reply=f"Done. I added {candidate} to your skills.",
        operations=[{"action": "add", "section": "skills", "field": None, "index": None, "data": data}],
    )


def _is_dummy_data_request(message: str) -> bool:
    """Detect requests for dummy/sample/placeholder data."""
    t = _norm(message)
    dummy_phrases = [
        "dummy data", "sample data", "placeholder data", "example data",
        "fill with dummy", "fill with sample", "fill everything",
        "populate my resume", "fill my resume", "add dummy",
        "add sample", "fill it up", "generate dummy", "generate sample",
        "fill all sections", "add placeholder", "fill in dummy",
    ]
    return any(phrase in t for phrase in dummy_phrases)


def _handle_dummy_data(resume: dict[str, Any]) -> ResumeChatResponse:
    """Return a deterministic set of operations that fills all empty sections
    with realistic, professional sample data."""
    ops: list[dict[str, Any]] = []

    personal = resume.get("personal") or {}
    if not personal.get("name"):
        ops.append({"action": "update", "section": "personal", "field": "name", "index": None, "data": "Alex Morgan"})
    if not personal.get("phone"):
        ops.append({"action": "update", "section": "personal", "field": "phone", "index": None, "data": "9876543210"})
    if not personal.get("email"):
        ops.append({"action": "update", "section": "personal", "field": "email", "index": None, "data": "alex.morgan@email.com"})
    if not personal.get("linkedin"):
        ops.append({"action": "update", "section": "personal", "field": "linkedin", "index": None, "data": "linkedin.com/in/alexmorgan"})
    if not personal.get("github"):
        ops.append({"action": "update", "section": "personal", "field": "github", "index": None, "data": "github.com/alexmorgan"})

    edu = resume.get("education")
    if not edu or (isinstance(edu, list) and len(edu) == 0) or (isinstance(edu, dict) and not edu.get("school") and not edu.get("institution")):
        ops.append({"action": "add", "section": "education", "field": None, "index": None, "data": {
            "school": "Indian Institute of Technology, Bangalore",
            "degree": "B.Tech in Computer Science and Engineering",
            "location": "Bangalore, India",
            "dates": "Aug 2020 - May 2024",
            "coursework": "Data Structures, Algorithms, Operating Systems, Database Systems, Computer Networks, Machine Learning",
        }})

    exp = resume.get("experience")
    if not exp or (isinstance(exp, list) and len(exp) == 0) or (isinstance(exp, dict) and not exp.get("company")):
        ops.append({"action": "add", "section": "experience", "field": None, "index": None, "data": {
            "company": "TechNova Solutions",
            "title": "Software Development Engineer Intern",
            "location": "Bangalore, India",
            "dates": "May 2023 - Aug 2023",
            "bullets": [
                "Developed and deployed 3 RESTful microservices using FastAPI and PostgreSQL, reducing API response time by 40%",
                "Built an automated CI/CD pipeline with GitHub Actions and Docker, cutting deployment time from 45 minutes to 8 minutes",
                "Collaborated with a cross-functional team of 6 to implement real-time notification system using WebSockets, serving 10K+ daily active users",
            ],
        }})

    proj = resume.get("projects")
    if not proj or (isinstance(proj, list) and len(proj) == 0):
        ops.append({"action": "add", "section": "projects", "field": None, "index": None, "data": {
            "title": "CloudDrive — Distributed File Storage System",
            "technologies": "React, Node.js, AWS S3, PostgreSQL, Docker",
            "dates": "Jan 2024 - Mar 2024",
            "links": "github.com/alexmorgan/clouddrive",
            "bullets": [
                "Architected a scalable cloud storage platform supporting file upload, versioning, and sharing for 500+ concurrent users",
                "Implemented chunked file uploads with resumable transfer protocol, handling files up to 5GB with 99.9% success rate",
                "Designed role-based access control system with JWT authentication and refresh token rotation for enhanced security",
            ],
        }})
        ops.append({"action": "add", "section": "projects", "field": None, "index": None, "data": {
            "title": "SmartBudget — AI-Powered Expense Tracker",
            "technologies": "Next.js, TypeScript, Tailwind CSS, Supabase, OpenAI API",
            "dates": "Sep 2023 - Nov 2023",
            "links": "github.com/alexmorgan/smartbudget",
            "bullets": [
                "Built a full-stack expense tracking application with AI-powered categorization achieving 92% classification accuracy",
                "Implemented interactive data visualizations using Chart.js, enabling users to analyze spending patterns across 15+ categories",
                "Optimized database queries with proper indexing and connection pooling, reducing page load time by 60%",
            ],
        }})

    skills = resume.get("skills")
    if not skills or (isinstance(skills, list) and len(skills) == 0):
        ops.extend([
            {"action": "add", "section": "skills", "field": None, "index": None, "data": {
                "category": "Languages", "items": "Python, JavaScript, TypeScript, Java, C++, SQL",
            }},
            {"action": "add", "section": "skills", "field": None, "index": None, "data": {
                "category": "Frameworks", "items": "React, Next.js, FastAPI, Node.js, Express, Tailwind CSS",
            }},
            {"action": "add", "section": "skills", "field": None, "index": None, "data": {
                "category": "Developer Tools", "items": "Git, GitHub, Docker, AWS, VS Code, Postman, Linux",
            }},
            {"action": "add", "section": "skills", "field": None, "index": None, "data": {
                "category": "Databases", "items": "PostgreSQL, MongoDB, Redis, Supabase",
            }},
        ])

    if not ops:
        return ResumeChatResponse(
            reply="Your resume already has content in all sections! Would you like me to improve or add to any specific section?",
            operations=[],
        )

    return ResumeChatResponse(
        reply=(
            "Done! I've filled your resume with professional sample data including education, "
            "experience, projects, skills, and personal information. Hit **Recompile** to see "
            "the changes in the live preview. You can now edit any section to replace the "
            "sample data with your real information!"
        ),
        operations=ops,
    )


def process_resume_chat(message: str, resume: dict[str, Any], history: list[dict[str, Any]] | None = None) -> ResumeChatResponse:
    history = _history_dicts(history or [])[-40:]
    message = message.strip()
    resume = _clean_resume(resume)

    # Deterministic dummy data handler — bypasses LLM for reliability.
    if _is_dummy_data_request(message):
        return _handle_dummy_data(resume)

    # Fast deterministic continuation for short, high-confidence replies.
    fallback = _fallback_short_skill_task(message, history, resume)
    if fallback is not None:
        return fallback

    github_result = _handle_github(message, history, resume)
    if github_result is not None:
        return github_result

    # Long pasted JDs are analyzed separately so the model is not forced into
    # the operation JSON schema for an analysis-only task.
    if _looks_like_jd(message) and len(message) > 150:
        return _analyze_job_description(message, resume)

    resolved_message = _resolve_short_followup(message, history)

    prompt = (
        SYSTEM_PROMPT
        .replace(
            "{resume_json}",
            json.dumps(resume, indent=2, ensure_ascii=False),
        )
        .replace(
            "{history_json}",
            json.dumps(history, indent=2, ensure_ascii=False),
        )
        .replace(
            "{user_message}",
            resolved_message,
        )
    )

    raw = generate_text(prompt=prompt, model=MODEL, temperature=0.0, json_mode=True)
    if not raw:
        raise RuntimeError("AI returned an empty response.")

    try:
        parsed = json.loads(_clean_json_response(raw))
        normalized = _normalize_response(parsed)
        normalized = _validate_and_repair_operations(normalized, resume)
        result = ResumeChatResponse.model_validate(normalized)
        if result.needs_clarification and not result.clarifying_question:
            result.needs_clarification = False
        return result
    except Exception as exc:
        raise RuntimeError(f"AI returned an invalid resume-chat response: {exc}") from exc
