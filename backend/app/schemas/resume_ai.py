from typing import Any, Literal

from pydantic import BaseModel, Field


class PersonalInfo(BaseModel):
    name: str = ""
    phone: str = ""
    email: str = ""
    linkedin: str = ""
    github: str = ""


class EducationEntry(BaseModel):
    institution: str = ""
    location: str = ""
    degree: str = ""
    dates: str = ""


class ExperienceEntry(BaseModel):
    job_title: str = ""
    company: str = ""
    location: str = ""
    dates: str = ""
    bullets: list[str] = Field(default_factory=list)


class ProjectEntry(BaseModel):
    name: str = ""
    technologies: list[str] = Field(default_factory=list)
    dates: str = ""
    bullets: list[str] = Field(default_factory=list)
    project_link: str = ""
    github_link: str = ""


class TechnicalSkills(BaseModel):
    languages: list[str] = Field(default_factory=list)
    frameworks: list[str] = Field(default_factory=list)
    developer_tools: list[str] = Field(default_factory=list)
    libraries: list[str] = Field(default_factory=list)


class CertificationEntry(BaseModel):
    name: str = ""
    organization: str = ""
    issue_date: str = ""
    credential_id: str = ""
    credential_url: str = ""


class AchievementEntry(BaseModel):
    title: str = ""
    organization: str = ""
    date: str = ""
    description: str = ""


class ResumeData(BaseModel):
    personal: PersonalInfo = Field(default_factory=PersonalInfo)
    education: list[EducationEntry] = Field(default_factory=list)
    experience: list[ExperienceEntry] = Field(default_factory=list)
    projects: list[ProjectEntry] = Field(default_factory=list)
    technical_skills: TechnicalSkills = Field(default_factory=TechnicalSkills)
    certifications: list[CertificationEntry] = Field(default_factory=list)
    achievements: list[AchievementEntry] = Field(default_factory=list)
