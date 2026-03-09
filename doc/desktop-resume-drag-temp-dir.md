# Resume drag: temp dir and id folder

## Summary

When the user drags the resume PDF icon to another app, the main process now:

1. **Temp dir with id folder** – Saves the PDF under a temp directory in an **id folder** (per application):
   - Base: `{os.tmpdir()}/resume-builder-drag/`
   - Per app: `{base}/{appId}/` (appId sanitized for filesystem)
   - File: `{idDir}/{safeName}` (e.g. `Company_Name_Resume.pdf`)

2. **Load on drop** – The path passed to `webContents.startDrag({ file: filePath })` is this file. The OS uses it for the drag; when the user drops, the drop target receives a valid PDF that loads correctly.

3. **Cleanup** – The temp file is removed after 5 minutes; the id folder is removed if empty.

## Code changes

- **main.js** – `resume-drag` handler: `RESUME_DRAG_TEMP_BASE`, create `idDir` with `fs.mkdirSync(..., { recursive: true })`, write PDF to `filePath`, `startDrag({ file: filePath })`, delayed cleanup of file and empty folder.
- **preload.js** – `startResumeDrag(buffer, fileName, appId)` now takes `appId` and passes it in the IPC payload.
- **job-applications-view.tsx** – Calls `startResumeDrag(buffer, safeName, app.id)` so each application uses its own id folder.

## Rationale

- **Id folder**: Keeps temp files per application and avoids name collisions when dragging from multiple rows.
- **Stable path**: The file exists at a single path for the duration of the drag and for a while after, so drop targets that read or open the file can load it correctly.
- **Longer cleanup (5 min)**: Gives drop targets time to read the file after drop before we delete it.
