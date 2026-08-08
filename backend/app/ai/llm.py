import os
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq


# backend/ directory
BASE_DIR = Path(__file__).resolve().parents[2]

# Load local secrets
load_dotenv(BASE_DIR / ".env.local")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is not configured. "
        "Add it to backend/.env.local"
    )

client = Groq(api_key=GROQ_API_KEY)


def generate_text(
    prompt: str,
    model: str = "llama-3.3-70b-versatile",
    temperature: float = 0.2,
) -> str:
    """Generate text using the configured LLM."""

    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=temperature,
    )

    return response.choices[0].message.content or ""