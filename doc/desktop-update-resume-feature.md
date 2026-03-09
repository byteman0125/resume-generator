# Update resume feature (desktop)

## Summary

You can update an existing application’s resume PDF from the table:

1. **Right-click** the resume icon (doc with “R”) for a row that already has a resume.
2. A context menu opens with **“Update resume”**.
3. Click **“Update resume”** → the application modal opens with that row’s data (date, company, title, job URL, profile, job description).
4. Edit the resume content in the modal (summary, bullets, template/style, etc.).
5. Click **Apply** → the app is PATCHed and the **same application id** is used to **replace the PDF** via `POST /api/job-applications/{id}/pdf`. The row keeps the same id; only the PDF file is updated.

## Implementation

- **State:** `resumeContextMenu: { x, y, app: JobApplication } | null` and `resumeContextMenuRef` for click-outside close.
- **Resume icon (when `alreadyApplied`):** `onContextMenu` prevents default and table context menu, sets `resumeContextMenu` with client coordinates and the row’s `app`.
- **Resume context menu UI:** Fixed-position menu with one button “Update resume” that:
  - Fills the modal form from `app` (same as the existing “Apply” flow).
  - Sets `applyApplication` to `app` and opens the modal (`setAddOpen(true)`).
  - Closes the context menu.
- **Apply in modal:** Existing `handleAdd` already handles `applyApplication`: PATCHes the job application and POSTs the preview PDF to `/api/job-applications/{appId}/pdf`, so the PDF is overwritten for the same id. No API changes.

## Files touched

- `desktop/src/components/job-applications-view.tsx`: resume context menu state, effect for click-outside, `onContextMenu` on resume icon, resume context menu panel with “Update resume” button.
