from app.core.security import limiter
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field

from app.ai.github.analyzer import (
    analyze_repository,
    improve_resume_bullets,
)

from app.schemas.github_ai import (
    ImproveBulletsRequest,
    ImproveBulletsResponse,
)


router = APIRouter()


# =========================================================
# GitHub Analyze
# =========================================================

class GitHubAnalyzeRequest(BaseModel):
    owner: str = Field(..., min_length=1)
    repo: str = Field(..., min_length=1)


class GitHubAnalyzeResponse(BaseModel):
    analysis: dict


@router.post(
    "/analyze",
    response_model=GitHubAnalyzeResponse,
)
@limiter.limit('10/minute')
def analyze_github_repository(
    request: Request,
    payload: GitHubAnalyzeRequest,
):
    try:
        analysis = analyze_repository(
            payload.owner,
            payload.repo,
        )

        # The analyzer returns a Pydantic model.
        # Convert it into a JSON-compatible dictionary.
        if hasattr(analysis, "model_dump"):
            analysis_data = analysis.model_dump()
        else:
            analysis_data = analysis.dict()

        return {
            "analysis": analysis_data,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"GitHub AI analysis failed: {str(exc)}",
        )


# =========================================================
# Improve Resume Bullets
# =========================================================

@router.post(
    "/improve-bullets",
    response_model=ImproveBulletsResponse,
)
@limiter.limit('10/minute')
def improve_github_resume_bullets(
    request: Request,
    payload: ImproveBulletsRequest,
):
    try:
        bullets = improve_resume_bullets(
            project_name=payload.project_name,
            description=payload.description,
            technologies=payload.technologies,
            current_bullets=payload.current_bullets,
        )

        if len(bullets) != len(payload.current_bullets):
            raise HTTPException(
                status_code=500,
                detail=(
                    "AI could not generate "
                    "the correct number of improved resume bullets."
                ),
            )

        return ImproveBulletsResponse(
            resume_bullets=bullets,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to improve resume bullets: "
                f"{str(exc)}"
            ),
        )