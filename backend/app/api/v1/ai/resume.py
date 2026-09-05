from fastapi import APIRouter, Response
from app.ai.resume.renderer import render_resume_latex
from app.ai.resume.pdf_generator import PDFGenerationError, generate_pdf
from app.schemas.resume_ai import ResumeData

router = APIRouter()


# =========================================================
# PDF RESUME GENERATION
# =========================================================

@router.post("/generate")
def generate_resume(resume: ResumeData):
    try:
        latex_content = render_resume_latex(resume)
        pdf_content = generate_pdf(latex_content)
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": 'attachment; filename="resume.pdf"'
            },
        )
    except PDFGenerationError as exc:
        return Response(
            content=str(exc),
            status_code=500,
            media_type="text/plain",
        )
