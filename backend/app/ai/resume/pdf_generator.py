import subprocess
import tempfile
from pathlib import Path


DOCKER_IMAGE = "makemycv-backend-latex:latest"


class PDFGenerationError(Exception):
    """Raised when PDF generation fails."""


def generate_pdf(latex_content: str) -> bytes:
    """
    Generate a PDF from LaTeX using the Docker LaTeX environment.

    The host machine does not need pdflatex installed.
    Docker provides the complete TeX Live environment.
    """

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        tex_file = temp_path / "resume.tex"
        pdf_file = temp_path / "resume.pdf"

        tex_file.write_text(
            latex_content,
            encoding="utf-8",
        )

        command = [
            "docker",
            "run",
            "--rm",
            "-v",
            f"{temp_path}:/resume",
            "-w",
            "/resume",
            DOCKER_IMAGE,
            "pdflatex",
            "-interaction=nonstopmode",
            "-halt-on-error",
            "resume.tex",
        ]

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=60,
        )

        if result.returncode != 0 or not pdf_file.exists():
            raise PDFGenerationError(
                "Failed to generate PDF.\n\n"
                f"Docker/LaTeX output:\n{result.stdout}\n\n"
                f"Docker/LaTeX errors:\n{result.stderr}"
            )

        return pdf_file.read_bytes()