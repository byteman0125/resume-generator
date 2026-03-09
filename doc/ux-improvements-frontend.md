# Frontend UX improvements

Summary of improvements and further ideas for the job-applications view and app.

---

## Implemented (this pass)

### 1. Loading state
- **Before:** Plain text "Loading…".
- **After:** Centered spinner (`Loader2` with `animate-spin`) + "Loading applications…" so users see that data is loading and where to look.

### 2. Empty state
- When a profile is selected but has **no applications**, a short message appears above the table:
  - "No applications for this profile yet. Double-click any cell in the empty rows below to add one, or paste from clipboard."
- Reduces confusion and explains the next step.

### 3. Toasts for key actions (Sonner)
- **Dependency:** `sonner` added; `<Toaster richColors position="bottom-right" />` in root `app/layout.tsx`.
- **Save (cell edit):** "Saved" on success; "Failed to save" on API error or throw.
- **Paste:** "Pasted N row(s)" after a successful paste (N = number of rows).
- **Delete (single row):** "Row deleted" on success; "Delete failed" on error.
- **Delete (selected rows):** "Deleted N row(s)" on success; "Delete failed" if any request fails or on throw.

Applied in both **web** (`components/job-applications-view.tsx`) and **desktop** (desktop uses the same Next.js app in a BrowserView, so the same layout and toasts apply).

---

## Further ideas (not implemented)

1. **Profile switch loading**  
   Show a small spinner or disabled state on the profile dropdown while `loading` is true (e.g. after changing profile), so it’s clear that a new set of applications is loading.

2. **Skeleton table**  
   Instead of hiding the whole table until load completes, show the table structure with row placeholders (skeleton shimmer) and replace with real rows when data arrives. Keeps layout stable and feels faster.

3. **Optimistic updates with rollback**  
   For paste/delete, update the UI immediately and show a toast; on failure, revert and toast an error. Requires tracking “pending” state and rollback logic.

4. **Keyboard shortcuts hint**  
   A small “?” or “Shortcuts” control that opens a popover listing Ctrl+C, Ctrl+V, F3, Undo/Redo, etc.

5. **Search result count and “no results”**  
   When the user has typed a search term and there are 0 matches, show a short “No matches for ‘…’” message instead of only the disabled prev/next buttons.

6. **Duplicate row warning before save**  
   When the user edits company name and it would create a duplicate (same profile + company), show a warning toast or inline message before or right after save, and keep the red row highlight.

7. **Confirmation for bulk delete**  
   Before calling delete for multiple selected rows, show a small confirm dialog: “Delete N rows?” with Cancel/Delete. Reduces accidental bulk deletes.

8. **Focus management**  
   After adding a row (e.g. double-click empty cell or paste), ensure focus moves to the new cell or first editable cell so the user can continue with keyboard only.

9. **Accessibility**  
   - Ensure table has correct `aria-rowcount` / `aria-colcount` and that selection/focus are announced.
   - Add `aria-live` for toasts so screen readers announce “Saved”, “Delete failed”, etc.

10. **Empty state CTA**  
    In the “no applications for this profile” block, add a primary button: “Add first application” that focuses the first empty row or creates one row and starts edit.

Implementing these can be done incrementally; the items above are ordered by impact vs effort as a rough guide.
