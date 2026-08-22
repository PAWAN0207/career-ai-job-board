from pathlib import Path

from pypdf import PdfReader
from docx import Document


# ============================================================
# PDF TEXT EXTRACTION
# ============================================================

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from a PDF resume.
    """

    reader = PdfReader(file_path)

    pages_text = []

    for page in reader.pages:

        text = page.extract_text()

        if text:
            pages_text.append(text)

    return "\n\n".join(pages_text).strip()


# ============================================================
# DOCX TEXT EXTRACTION
# ============================================================

def extract_text_from_docx(file_path: str) -> str:
    """
    Extract text from a DOCX resume.
    """

    document = Document(file_path)

    paragraphs = []

    for paragraph in document.paragraphs:

        text = paragraph.text.strip()

        if text:
            paragraphs.append(text)

    return "\n".join(paragraphs).strip()


# ============================================================
# RESUME TEXT EXTRACTION
# ============================================================

def extract_resume_text(file_path: str) -> str:
    """
    Detect the resume file type and extract text.
    """

    path = Path(file_path)

    extension = path.suffix.lower()

    if extension == ".pdf":

        text = extract_text_from_pdf(
            str(path)
        )

    elif extension == ".docx":

        text = extract_text_from_docx(
            str(path)
        )

    else:

        raise ValueError(
            "Unsupported resume format. "
            "Only PDF and DOCX are supported."
        )

    if not text.strip():

        raise ValueError(
            "Could not extract text from the resume. "
            "The file may be scanned or image-based."
        )

    return text.strip()