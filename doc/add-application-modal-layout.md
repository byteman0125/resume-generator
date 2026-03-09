# Add Application Modal – Single Modal Layout

**Date:** 2025-02-25

## Summary

The Add job application flow uses a **single modal** with company info at the top, resume edit in the middle (visible without any extra button), and preview/export at the bottom. There is no separate "Apply" or "Edit resume & export" step.

## Layout (top → bottom)

1. **Top – Company info**
   - Date, Profile (resume), Company name, Job title, Job URL.
   - Compact form with `id="add-application-form"` for submit.

2. **Middle – Resume edit**
   - Scrollable area with `ResumePreview` and `editableExperienceBullets`.
   - User can edit bullets as soon as the modal opens; no button to "apply" or open edit.

3. **Bottom – Preview and actions**
   - **Left:** "Preview / Export PDF" – generates and downloads the resume PDF.
   - **Right:** "Cancel" and "Add" – Cancel closes the modal; Add submits the form and saves the application.

## Changes made

- **Merged** the former Add application dialog and the separate "Edit resume & export" (attachment) modal into one dialog.
- **Removed** the "Edit resume & export" button and the second `Dialog` (`attachmentModalOpen`).
- **Removed** `Paperclip` icon import (no longer used).
- Dialog uses `max-w-4xl max-h-[90vh]` and flex layout so the resume section scrolls and the footer stays visible.

## File

- `components/job-applications-view.tsx` – Add application dialog content and layout; single modal only.
