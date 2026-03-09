# Job description feature

## Summary

Job descriptions are stored per job application. You can paste a description in the Apply/Add modal and view it later from the table via a doc icon.

## Changes made

### 1. Data and API

- **`lib/db.ts`**
  - `JobApplicationRow` now includes `job_description: string`.
  - `createJobApplication` accepts optional `job_description`; defaults to `""`.
  - `updateJobApplication` accepts optional `job_description`.
  - `readJobApplications()` normalizes existing rows so missing `job_description` becomes `""`.

- **`app/api/job-applications/route.ts`**
  - POST body may include `job_description` (string); stored on create.

- **`app/api/job-applications/[id]/route.ts`**
  - PATCH body may include `job_description` (string); stored on update.
  - GET response includes `job_description` (already part of row).

### 2. Apply/Add modal

- **`components/job-applications-view.tsx`**
  - **Job description text area**
    - Placed at the **top of the left column**, above the Summary/Experience/Skills editor.
    - Single-line style: `rows={1}`, compact height, with optional scroll for long paste.
    - Label: "Job description"; placeholder: "Paste job description here (saved per application)".
  - **Form state**
    - `form` includes `job_description`.
    - When opening the modal in **Apply** mode, `form` is filled from the application (including `job_description`).
    - On **Apply** (PATCH): `job_description` is sent and saved.
    - On **Add** (POST): `job_description` is sent and saved.
    - Form reset after success includes `job_description: ""`.
  - **Undo restore**
    - When restoring a row from undo history, the POST body includes `job_description` so restored rows keep their description.

### 3. Table: doc icon and view modal

- **Resume column (when row is already applied)**
  - If the application has a non-empty `job_description`, a **doc icon** button is shown to the **right of the Download** button.
  - Icon: `FileText`, **light blue** (`text-sky-500`), hover `bg-sky-100` / `dark:hover:bg-sky-900/40`.
  - Tooltip: "View job description".
- **View modal**
  - Clicking the doc icon opens a **modal** that shows the saved job description (read-only).
  - Title: "Job description".
  - Subtitle: company and title of the application.
  - Body: job description text in a scrollable area; "(No description saved)" if empty.
  - Close button to dismiss.

## Usage

1. **Saving a job description**
   - Open the application modal (Add new or Apply for an existing row).
   - Paste the job description into the "Job description" field at the top of the left column.
   - Click Add or Apply; the description is stored for that application.

2. **Viewing a job description**
   - In the table, for rows that have a resume (already applied) and a saved description, click the light blue doc icon next to the Download button.
   - The modal shows the saved description; close when done.

## Files touched

- `lib/db.ts`
- `app/api/job-applications/route.ts`
- `app/api/job-applications/[id]/route.ts`
- `components/job-applications-view.tsx`
- `doc/job-description-feature.md` (this file)
