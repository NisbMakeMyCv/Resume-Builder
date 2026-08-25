from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from uuid import UUID
import enum

class ProficiencyEnum(str, enum.Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    EXPERT = "Expert"

# PROFILE
class ProfileBase(BaseModel):
    headline: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    dob: Optional[date] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    linkedin_text: Optional[str] = None
    github_url: Optional[str] = None
    github_text: Optional[str] = None
    portfolio_url: Optional[str] = None
    portfolio_text: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# EDUCATION
class EducationBase(BaseModel):
    institution: str
    degree: str
    branch: str
    start_date: date
    end_date: Optional[date] = None
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    display_order: Optional[int] = 0

class EducationCreate(EducationBase):
    pass

class EducationUpdate(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    display_order: Optional[int] = None

class EducationResponse(EducationBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# EXPERIENCE
class ExperienceBase(BaseModel):
    company: str
    designation: str
    description: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    display_order: Optional[int] = 0

class ExperienceCreate(ExperienceBase):
    pass

class ExperienceUpdate(BaseModel):
    company: Optional[str] = None
    designation: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    display_order: Optional[int] = None

class ExperienceResponse(ExperienceBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# SKILL
class SkillBase(BaseModel):
    skill_name: str
    proficiency: ProficiencyEnum
    display_order: Optional[int] = 0

class SkillCreate(SkillBase):
    pass

class SkillUpdate(BaseModel):
    skill_name: Optional[str] = None
    proficiency: Optional[ProficiencyEnum] = None
    display_order: Optional[int] = None

class SkillResponse(SkillBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# PROJECT
class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    github_link: Optional[str] = None
    github_link_text: Optional[str] = None
    display_order: Optional[int] = 0

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    github_link: Optional[str] = None
    display_order: Optional[int] = None

class ProjectResponse(ProjectBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# RESUME DOCUMENT
class ResumeDocumentBase(BaseModel):
    title: str
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    drive_file_id: Optional[str] = None

class ResumeDocumentCreate(BaseModel):
    title: str

class ResumeDocumentUpdate(BaseModel):
    title: Optional[str] = None

class ResumeDocumentResponse(ResumeDocumentBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# CERTIFICATION
class CertificationBase(BaseModel):
    name: str
    organization: Optional[str] = None
    issue_date: Optional[date] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    display_order: Optional[int] = 0

class CertificationCreate(CertificationBase):
    pass

class CertificationUpdate(BaseModel):
    name: Optional[str] = None
    organization: Optional[str] = None
    issue_date: Optional[date] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    display_order: Optional[int] = None

class CertificationResponse(CertificationBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ACHIEVEMENT
class AchievementBase(BaseModel):
    title: str
    organization: Optional[str] = None
    date: Optional[date] = None
    description: Optional[str] = None
    display_order: Optional[int] = 0

class AchievementCreate(AchievementBase):
    pass

class AchievementUpdate(BaseModel):
    title: Optional[str] = None
    organization: Optional[str] = None
    date: Optional[date] = None
    description: Optional[str] = None
    display_order: Optional[int] = None

class AchievementResponse(AchievementBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
