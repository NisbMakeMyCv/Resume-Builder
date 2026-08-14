from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined

from app.schemas.resume_ai import ResumeData
from app.ai.resume.latex_utils import escape_latex, escape_latex_url


TEMPLATE_DIR = Path(__file__).resolve().parent


class ResumeRenderer:
    """
    Converts structured ResumeData into the fixed LaTeX resume template.
    """

    def __init__(self) -> None:
        self.environment = Environment(
            loader=FileSystemLoader(TEMPLATE_DIR),
            undefined=StrictUndefined,
            autoescape=False,
            keep_trailing_newline=True,

            # Custom Jinja2 syntax used by template.tex
            variable_start_string="<<",
            variable_end_string=">>",
            block_start_string="<%",
            block_end_string="%>",
            comment_start_string="<#",
            comment_end_string="#>",
        )

    def _prepare_resume(self, resume: ResumeData) -> dict:
        """
        Convert ResumeData into a dictionary containing
        LaTeX-safe values.
        """

        return {
            # =====================================================
            # PERSONAL INFORMATION
            # =====================================================

            "personal": {
                "name": escape_latex(resume.personal.name),
                "phone": escape_latex(resume.personal.phone),

                "email": escape_latex_url(
                    resume.personal.email
                ),

                "linkedin": escape_latex_url(
                    resume.personal.linkedin
                ),

                "github": escape_latex_url(
                    resume.personal.github
                ),
            },

            # =====================================================
            # EDUCATION
            # =====================================================

            "education": [
                {
                    "institution": escape_latex(
                        item.institution
                    ),
                    "location": escape_latex(
                        item.location
                    ),
                    "degree": escape_latex(
                        item.degree
                    ),
                    "dates": escape_latex(
                        item.dates
                    ),
                }
                for item in resume.education
            ],

            # =====================================================
            # EXPERIENCE
            # =====================================================

            "experience": [
                {
                    "job_title": escape_latex(
                        item.job_title
                    ),

                    "company": escape_latex(
                        item.company
                    ),

                    "location": escape_latex(
                        item.location
                    ),

                    "dates": escape_latex(
                        item.dates
                    ),

                    "bullets": [
                        escape_latex(bullet)
                        for bullet in item.bullets
                    ],
                }
                for item in resume.experience
            ],

            # =====================================================
            # PROJECTS
            # =====================================================

            "projects": [
                {
                    "name": escape_latex(
                        item.name
                    ),

                    "technologies": [
                        escape_latex(technology)
                        for technology in item.technologies
                    ],

                    "dates": escape_latex(
                        item.dates
                    ),

                    "bullets": [
                        escape_latex(bullet)
                        for bullet in item.bullets
                    ],

                    "project_link": escape_latex_url(
                        item.project_link
                    ),

                    "github_link": escape_latex_url(
                        item.github_link
                    ),
                }
                for item in resume.projects
            ],

            # =====================================================
            # TECHNICAL SKILLS
            # =====================================================

            "technical_skills": {
                "languages": [
                    escape_latex(skill)
                    for skill in resume.technical_skills.languages
                ],

                "frameworks": [
                    escape_latex(skill)
                    for skill in resume.technical_skills.frameworks
                ],

                "developer_tools": [
                    escape_latex(skill)
                    for skill in resume.technical_skills.developer_tools
                ],

                "libraries": [
                    escape_latex(skill)
                    for skill in resume.technical_skills.libraries
                ],
            },

            # =====================================================
            # CERTIFICATIONS
            # =====================================================

            "certifications": [
                {
                    "name": escape_latex(
                        item.name
                    ),

                    "organization": escape_latex(
                        item.organization
                    ),

                    "issue_date": escape_latex(
                        item.issue_date
                    ),

                    "credential_id": escape_latex(
                        item.credential_id
                    ),

                    "credential_url": escape_latex_url(
                        item.credential_url
                    ),
                }
                for item in resume.certifications
            ],

            # =====================================================
            # ACHIEVEMENTS
            # =====================================================

            "achievements": [
                {
                    "title": escape_latex(
                        item.title
                    ),

                    "organization": escape_latex(
                        item.organization
                    ),

                    "date": escape_latex(
                        item.date
                    ),

                    "description": escape_latex(
                        item.description
                    ),
                }
                for item in resume.achievements
            ],
        }

    def render_latex(self, resume: ResumeData) -> str:
        """
        Render ResumeData using the fixed LaTeX resume template.

        Returns:
            A complete LaTeX document as a string.
        """

        template = self.environment.get_template(
            "template.tex"
        )

        data = self._prepare_resume(resume)

        return template.render(**data)


def render_resume_latex(resume: ResumeData) -> str:
    """
    Convenience function for rendering a resume.
    """

    renderer = ResumeRenderer()

    return renderer.render_latex(resume)