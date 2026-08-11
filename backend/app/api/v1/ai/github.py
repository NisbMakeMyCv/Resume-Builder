from fastapi import APIRouter, HTTPException
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
def analyze_github_repository(
    request: GitHubAnalyzeRequest,
):
    try:
        analysis = analyze_repository(
            request.owner,
            request.repo,
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
def improve_github_resume_bullets(
    request: ImproveBulletsRequest,
):
    try:
        bullets = improve_resume_bullets(
            project_name=request.project_name,
            description=request.description,
            technologies=request.technologies,
            current_bullets=request.current_bullets,
        )

        if not bullets:
            raise HTTPException(
                status_code=500,
                detail=(
                    "AI could not generate "
                    "improved resume bullets."
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