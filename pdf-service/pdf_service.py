from io import BytesIO
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    ListFlowable,
    ListItem,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def build_contact_line(profile: Dict[str, Any]) -> str:
  """
  Build a single contact line:
  City, State • email • (123) 456-7890
  """
  parts: List[str] = []

  loc = ", ".join(p for p in [profile.get("city"), profile.get("state")] if p)
  if loc:
    parts.append(loc)

  if profile.get("email"):
    parts.append(profile["email"])

  if profile.get("phone"):
    raw = profile["phone"].strip()
    digits = "".join(ch for ch in raw if ch.isdigit())
    formatted = raw
    if len(digits) == 10:
      formatted = f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    elif len(digits) == 11 and digits.startswith("1"):
      formatted = f"({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
    parts.append(formatted)

  return " • ".join(parts)


def build_experience_block(exp: Dict[str, Any], body_style: ParagraphStyle) -> List[Any]:
  story: List[Any] = []

  # Company — Location
  company = exp.get("company") or ""
  header = company
  if exp.get("location"):
    header += f" — {exp['location']}"
  if header:
    story.append(Paragraph(header, body_style))

  # Role — Dates
  role = (exp.get("role") or "").strip() or "Senior Software Engineer"
  dates = f"{exp.get('startDate', '')} - {'Present' if exp.get('current') else exp.get('endDate', '')}"
  story.append(Paragraph(f"{role} — {dates}", body_style))

  # Bullets from description lines
  bullets = [
    line.strip()
    for line in (exp.get("description") or "").splitlines()
    if line.strip()
  ]
  if bullets:
    items = [ListItem(Paragraph(b, body_style)) for b in bullets]
    story.append(ListFlowable(items, bulletType="bullet", leftIndent=10))

  story.append(Spacer(1, 0.15 * inch))
  return story


def build_education_block(edu: Dict[str, Any], body_style: ParagraphStyle) -> List[Any]:
  story: List[Any] = []

  school = edu.get("school") or ""
  if school:
    story.append(Paragraph(school, body_style))

  line = edu.get("degree") or ""
  if edu.get("field"):
    line += f", {edu['field']}"
  if line:
    story.append(Paragraph(line, body_style))

  dates = f"{edu.get('startDate', '')} - {edu.get('endDate', '')}"
  story.append(Paragraph(dates, body_style))

  story.append(Spacer(1, 0.1 * inch))
  return story


def build_skills_block(skills: List[Dict[str, Any]], body_style: ParagraphStyle) -> List[Any]:
  """
  Match current behavior:
  - Each skill line is usually "Category: content".
  - Render as bullets with category bold, content normal.
  """
  story: List[Any] = []

  lines: List[str] = []
  for s in skills:
    cat = (s.get("category") or "").strip()
    name = (s.get("name") or "").strip()
    if cat and name:
      lines.append(f"<b>{cat}:</b> {name}")
    elif name:
      lines.append(name)

  if not lines:
    return story

  items = [ListItem(Paragraph(line, body_style)) for line in lines]
  story.append(ListFlowable(items, bulletType="bullet", leftIndent=10))
  return story


def build_resume_pdf(resume: Dict[str, Any]) -> bytes:
  """
  Build a resume PDF that closely matches the on-screen preview:
  - US Letter
  - Margins: top 0.7in, left/right/bottom 0.5in
  - Name 20pt, title 13pt, contact 11pt, body 10pt, line-height 1.2
  """
  buffer = BytesIO()
  doc = SimpleDocTemplate(
    buffer,
    pagesize=letter,
    topMargin=0.7 * inch,
    bottomMargin=0.5 * inch,
    leftMargin=0.5 * inch,
    rightMargin=0.5 * inch,
  )

  styles = getSampleStyleSheet()

  name_style = ParagraphStyle(
    "Name",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=20,
    leading=20 * 1.1,
  )
  title_style = ParagraphStyle(
    "Title",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=13,
    leading=13 * 1.1,
  )
  contact_style = ParagraphStyle(
    "Contact",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=11,
    leading=11 * 1.1,
  )
  section_style = ParagraphStyle(
    "Section",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=10,
    leading=10 * 1.1,
    spaceAfter=4,
  )
  body_style = ParagraphStyle(
    "Body",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=10,
    leading=10 * 1.2,  # line-height 1.2
  )

  profile = resume["profile"]
  experience: List[Dict[str, Any]] = resume.get("experience", [])
  education: List[Dict[str, Any]] = resume.get("education", [])
  skills: List[Dict[str, Any]] = resume.get("skills", [])
  style = resume.get("style") or {}
  show_summary = style.get("showSummary", True)

  story: List[Any] = []

  # Header
  story.append(Paragraph(profile.get("name") or "Your Name", name_style))
  if profile.get("title"):
    story.append(Paragraph(profile["title"], title_style))

  contact_line = build_contact_line(profile)
  if contact_line:
    story.append(Paragraph(contact_line, contact_style))
  story.append(Spacer(1, 0.15 * inch))

  # Summary
  if show_summary and (profile.get("summary") or "").strip():
    story.append(Paragraph("Summary", section_style))
    story.append(Paragraph(profile["summary"], body_style))
    story.append(Spacer(1, 0.2 * inch))

  # Experience
  if experience:
    story.append(Paragraph("Professional Experience", section_style))
    for exp in experience:
      story.extend(build_experience_block(exp, body_style))

  # Education
  if education:
    story.append(Paragraph("Education", section_style))
    for edu in education:
      story.extend(build_education_block(edu, body_style))

  # Skills
  if skills:
    story.append(Paragraph("Skills", section_style))
    story.extend(build_skills_block(skills, body_style))

  doc.build(story)
  pdf_bytes = buffer.getvalue()
  buffer.close()
  return pdf_bytes

