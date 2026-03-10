# Desktop bulk resume generation

## Overview

- **Feature:** Bulk GPT-based resume generation for the desktop job applications table.
- **Scope:** Desktop app only (`desktop/src/components/job-applications-view.tsx`), using the existing DeepSeek webview workflow and shared Next.js APIs.

## Behavior

- **Bulk button:**
  - New `Bulk generate (N)` button in the job applications header on desktop.
  - Enabled only when there are **eligible applications**:
    - `applied_manually` is false (or not set).
    - `job_description` is non-empty.
  - Disabled while bulk generation is running or when AI prompts are not loaded.

- **Pipeline per application:**
  - For each eligible application:
    - Loads the base profile data from `/api/profiles/{profile_id}` (or falls back to `defaultResumeData`).
    - Clears summary, skills, and experience descriptions.
    - Extracts **core role context** from the job description using the GPT webview (`buildExtractionPromptForGpt` + `runGptStepInWebview`).
    - Runs the 4 GPT steps via the DeepSeek webview (`buildFullPromptForGptStep` + `runGptStepInWebview`):
      1. Current company bullets.
      2. Last company bullets (if present).
      3. Summary.
      4. Skills (parsed with `parseSkillsText`, capped per category).
    - Captures the current DeepSeek chat URL and associates it with the application.

- **PDF generation and persistence:**
  - Normalizes skills for PDF (splits comma-separated names, assigns categories).
  - Loads the template style for the current application modal format from `/api/templates/{formatId}/style` (or falls back to `APPLICATION_RESUME_STYLE`).
  - Calls `/api/pdf` with the assembled `StoredProfileData` and `templateId` to generate a PDF blob.
  - Uploads the PDF to `/api/job-applications/{id}/pdf`.
  - Reloads the application row from `/api/job-applications/{id}` so `resume_file_name` and `gpt_chat_url` are reflected in the desktop table.
  - **Does not** change `applied_manually` or `date`; users still explicitly mark jobs as applied via the checkbox.

- **Progress and UX:**
  - While running, the header shows `Generating X/Y` and the button label changes to `Bulk generating…` with a spinner.
  - The button is disabled during the run to prevent overlapping bulk operations.
  - At the end:
    - Shows a toast with a summary:
      - All failed → `"Bulk GPT generation failed for all rows"`.
      - Partial success → `"Generated N of M resumes"`.
      - All success → `"Generated N resumes"`.

## Notes and trade-offs

- **Sequential processing:** Jobs are processed one by one to keep the DeepSeek webview interaction predictable and avoid rate-limit spikes.
- **Failure handling:** If GPT, PDF generation, or upload fails for a particular row, that row is skipped and processing continues for the remaining applications.
- **Applied state:** Keeping `applied_manually` untouched preserves the meaning of “applied manually” (user-driven action). After bulk generation, rows have PDFs and GPT chat URLs, and the **Applied** checkbox can be enabled and toggled manually.

