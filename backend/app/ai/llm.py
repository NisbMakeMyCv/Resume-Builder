import os
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq


# backend/ directory
BASE_DIR = Path(__file__).resolve().parents[2]

# Load local secrets (no-op if file doesn't exist)
load_dotenv(BASE_DIR / ".env.local")


def _get_client() -> Groq:
    """
    Lazily create and return the Groq client.

    Raising here (instead of at import time) means unit tests that
    mock ``generate_text`` can import this module without a real key.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not configured. "
            "Add it to backend/.env.local (local dev) "
            "or set it as a GitHub Secret (CI/CD)."
        )
    return Groq(api_key=api_key)


def generate_text(
    prompt: str,
    model: str = "openai/gpt-oss-120b",
    temperature: float = 0.2,
    json_mode: bool = False,
) -> str:
    """Generate text using the configured Groq LLM."""

    client = _get_client()

    request = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "temperature": temperature,
    }

    # Ask Groq to return valid JSON when required.
    if json_mode:
        request["response_format"] = {
            "type": "json_object"
        }

    response = client.chat.completions.create(**request)

    return response.choices[0].message.content or ""
