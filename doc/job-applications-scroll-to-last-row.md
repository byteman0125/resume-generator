# Job Applications: Scroll to Last Row on First Load

## Summary

When the job applications page first loads (or when the user changes profile), the table scrolls to show the **last row** (most recent data) instead of staying at the top with empty cells.

## Behavior

- **No saved scroll:** If there is no saved scroll position in sessionStorage, and there is at least one application row, the table body scrolls to the bottom so the last row is visible.
- **Saved scroll:** If the user previously scrolled and we have a saved position, we restore that position and selection as before.
- **Profile change:** When the user changes the selected profile, we clear the saved scroll and reset the “restore” flag so that after the new data loads we scroll to the bottom (no saved position for the new profile).

## Implementation

### Web: `components/job-applications-view.tsx`

1. **Restore effect**
   - If `raw` (saved scroll) exists: parse and restore `scrollTop`/`scrollLeft` and optional selection (unchanged).
   - Else, if the scroll container exists and `applicationsLengthRef.current > 0`: set  
     `el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight)`  
     so the last row is in view.

2. **Profile-change effect** (already present)
   - On `profileFilterId` change: set `hasRestoredScrollAndSelectionRef.current = false` and remove `SCROLL_STORAGE_KEY` from sessionStorage so the next load has no saved scroll and will scroll to bottom.

### Desktop: `desktop/src/components/job-applications-view.tsx`

1. **Restore effect**
   - Same logic as web: restore from sessionStorage when `raw` exists; otherwise scroll to bottom when there is data.

2. **Profile-change effect** (added)
   - Same as web: on `profileFilterId` change, reset `hasRestoredScrollAndSelectionRef` and clear `SCROLL_STORAGE_KEY` so the next load scrolls to the last row.

## Data loading

All data for the selected profile is still loaded as before. Only the initial view is changed (scroll to last row when there is no saved position). “Load only showable area data” (e.g. virtualized or paginated loading) was not implemented.
