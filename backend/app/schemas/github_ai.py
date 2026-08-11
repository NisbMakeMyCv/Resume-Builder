from pydantic import BaseModel, Field


class GitHubProjectAnalysis(BaseModel):
    project_name: str
    description: str
    project_type: str

    technologies: list[str] = Field(
        default_factory=list
    )

    features: list[str] = Field(
        default_factory=list
    )

    implementation: list[str] = Field(
        default_factory=list
    )

    resume_bullets: list[str] = Field(
        default_factory=list
    )


class ImproveBulletsRequest(BaseModel):
    project_name: str
    description: str

    technologies: list[str] = Field(
        default_factory=list
    )

    current_bullets: list[str] = Field(
        default_factory=list
    )


class ImproveBulletsResponse(BaseModel):
    resume_bullets: list[str] = Field(
        default_factory=list
    )