# Desktop: Undo/Redo Logic Fixes

## Summary

Fixed two issues in the job applications table undo/redo implementation in `desktop/src/components/job-applications-view.tsx`.

## 1. Redo did not restore deleted rows

**Problem:** After undoing an "add row" action, the row was removed from the table and deleted via the API. Redo then set the table to the "next" state (which included that row), but that row no longer existed in the backend, so the UI showed a row with an id that was invalid and could cause errors or inconsistent state.

**Fix:** In `handleRedo`, we now mirror the same sync logic as undo:

- **toRemove:** rows in current state that are not in the target "next" state → DELETE via API.
- **toRestore:** rows in "next" that are not in current state (e.g. they were removed when we undid) → POST to re-create them, then use the API response (with new ids) in the final state.

So redo now re-POSTs any rows that were removed by a previous undo, then sets the table to the resulting state (with correct server ids).

## 2. History snapshots could be mutated

**Problem:** `pushHistory(prev)` stored the same array reference as the current applications state. If any code later mutated that array or its items, the stored undo snapshot would change, so undo could restore the wrong (mutated) state.

**Fix:** `pushHistory` now stores a shallow copy of the snapshot:

- Placeholders are kept as-is (no copy).
- Real applications are stored as `{ ...a }` so the snapshot is independent of the live state.

Undo/redo now always restores from an immutable snapshot.

## 3. Undo/redo did not persist in-place edits to the DB

**Problem:** When undoing (or redoing) only in-place edits (same row ids, different field values), the code updated the UI with the previous/next snapshot but did not call the API. After a reload, data was refetched from the backend, so the undo/redo was lost.

**Fix:**

- **Undo (in-place only):** When `toRestore.length === 0 && toRemove.length === 0`, we now find rows that exist in both current and restored but have different PATCHable fields, PATCH each to the restored values, then update UI and history/future. On PATCH failure we pop history and refetch.
- **Redo (in-place only):** When `toRestore.length === 0` after handling `toRemove`, we find rows that differ between current and next and PATCH each to the next (redone) values, then set state and history/future. On PATCH failure we return without changing state.

Shared helpers (modular):

- `jobAppFieldsDiffer(a, b)` – true if any PATCHable field differs.
- `jobAppPatchBody(app)` – object used as JSON body for PATCH (date, company_name, title, job_url, profile_id, resume_file_name, job_description, applied_manually, gpt_chat_url).

## Files changed

- `desktop/src/components/job-applications-view.tsx`
  - `pushHistory`: copy snapshot before pushing to history.
  - `handleRedo`: compute `toRestore`, POST missing rows, build `newNext` with API responses; when only in-place diff, PATCH differing rows to next then set state; on failure return without changing state.
  - `handleUndo`: when only in-place diff, PATCH differing rows to restored values then set state; on failure pop history and refetch.
  - Helpers: `jobAppFieldsDiffer`, `jobAppPatchBody`.
