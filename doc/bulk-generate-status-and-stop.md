# Desktop bulk generate status and stop button

## Overview

- **Feature:** Improve the desktop bulk resume generation UX by:
  - Showing a per-row \"Generating…\" status in the **Resume file** column while bulk is running.
  - Turning the bulk button into a **Stop** button during an active bulk run.

## Implementation summary

- **File:** `desktop/src/components/job-applications-view.tsx`

### State

- Added bulk tracking state:
  - `bulkInProgressIds: Set<string>` – ids of applications currently being processed by bulk GPT.
  - `bulkGptRunning: boolean` – whether a bulk run is active (already existed).
  - `bulkGptProgress: { done: number; total: number }` – progress counters (already existed, now updated per item).
  - `bulkCancelRequested: boolean` – user has clicked **Stop** and wants the loop to end after the current item.

### Resume file column UI

- In the resume file `TableCell`:
  - Compute `isBulkProcessing = bulkInProgressIds.has(app.id)`.
  - When `isBulkProcessing` is **true**:
    - Render a gray status:
      - `<Loader2>` spinner and text `\"Generating…\"` in muted colors.
    - Skip drag/open/copy behavior while the row is in progress.
  - When `isBulkProcessing` is **false** and `resume_file_name` is present:
    - Existing behavior (PDF icon with drag, open, copy, context menu) is preserved.

### Bulk button behavior

- Button in the header:
  - When **idle** (no active run):
    - `variant=\"outline\"`.
    - Enabled when `aiPrompts` are loaded and `bulkEligibleApps.length > 0`.
    - Label: `Bulk generate (N)` where `N = bulkEligibleApps.length`.
    - `onClick` starts the bulk run:
      - Resets `bulkCancelRequested` to `false`.
      - Sets `bulkGptRunning = true`.
      - Initializes `bulkGptProgress` and clears `bulkInProgressIds`.
  - When **running**:
    - `variant=\"destructive\"`.
    - Label: `Stop` with a small spinner.
    - `onClick` does **not** start a new run:
      - It simply sets `bulkCancelRequested = true`, which the loop checks between items.
  - Progress text next to the button:
    - `Generating X/Y` while `bulkGptRunning` is true.

### Bulk loop and cancellation

- `handleBulkGptGenerate` now:
  - If not running:
    - Starts a new bulk run (as above).
  - If already running:
    - Interprets the click as **Stop**, sets `bulkCancelRequested = true` and returns.
  - For each eligible application:
    - Adds `app.id` to `bulkInProgressIds`.
    - Runs the existing GPT webview pipeline + PDF generation + upload.
    - Refreshes the row from `/api/job-applications/{id}` on success.
    - Removes `app.id` from `bulkInProgressIds`.
    - Updates `bulkGptProgress.done`.
    - Checks `bulkCancelRequested` at the top of the loop and breaks if true.
  - At the end:
    - Clears `bulkGptRunning`, `bulkCancelRequested`, and `bulkInProgressIds`.

### Toasts and messaging

- After a run:
  - If `successCount === 0`:
    - `\"Bulk GPT generation failed for all rows\"`.
  - Else if `processedCount < total` (user stopped early):
    - `\"Bulk generation stopped after N of M resumes\"`.
  - Else if `successCount < total`:
    - `\"Generated N of M resumes\"`.
  - Else:
    - `\"Generated N resumes\"`.

This keeps the user informed about which rows are being processed, allows them to stop a long bulk run, and provides clear summary feedback when the operation finishes or is cancelled.

