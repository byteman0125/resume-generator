# Search feature for job applications table

## Summary

Add a keyboard-driven search bar to the job applications table so users can quickly jump between matching cells using Ctrl+F and next/previous controls, without reloading the entire table.

## Requirements

### 1. Search bar placement and focus

- **Search input location**: Add a search input at the **top of the job applications table** (above the header row).
- **Ctrl+F behavior**:
  - When the user presses **Ctrl+F**, prevent the browser’s default find behavior.
  - Move focus to the **custom search input** instead.

### 2. Live search (no button)

- Search is **live / bounding**:
  - As the user types in the search input, matching cells are recalculated immediately.
  - No separate “Search” button; the input itself drives search.
- Matching scope:
  - Match against all relevant text cells in the table row (e.g. date, company, title, job URL, profile, etc.).
  - Matching should be **case-insensitive**.

### 3. Match count, profile filter, and navigation UI

- **Match count**:
  - Show the **total number of matches** for the current search term to the **left of the search bar** (e.g. `0 results`, `5 results`).
- **Profile filter**:
  - To the **right of the search bar**, add a **profile filter control** (e.g. a dropdown).
  - The filter options should include at least:
    - **All profiles** (default).
    - Each available **profile** name.
  - When a specific profile is selected:
    - Restrict both the **table contents** and the **search matches** to **rows belonging to that profile**.
    - Match count reflects only matches in the filtered set.
- **Navigation buttons**:
  - To the **right of the profile filter**, add two **icon buttons**:
    - **Up**: go to the **previous** match.
    - **Down**: go to the **next** match.
- **On term change**:
  - When the search term changes:
    - Recompute all matches.
    - Update the match count.
    - Automatically jump to the **first match** (if any):
      - Scroll the table so the matched cell is visible, ideally **near the vertical middle** of the viewport.
      - **Update the selected cell** so that the current match is the active selection.

### 4. Selection and scrolling behavior

- **Initial match**:
  - When a non-empty search term is entered and matches exist:
    - The **selected cell** moves to the first matching cell.
    - The table scrolls so that this cell is brought into view (preferably centered vertically when possible).
- **Next/previous navigation**:
  - Clicking the **down arrow**:
    - Moves selection to the **next matching cell**.
    - Scrolls the table so that the new match is visible (again targeting the middle of the viewport when feasible).
  - Clicking the **up arrow**:
    - Moves selection to the **previous matching cell** with the same scrolling behavior.
  - Optional (nice-to-have): when at the last match and the user clicks **down**, wrap to the first match; similarly, wrap from first to last on **up**.

### 5. Incremental loading / virtualized behavior

- The table should **not reload from the beginning** when navigating via search.
- When jumping to a match at row index `r`:
  - Ensure that rows **around** `r` are loaded:
    - Load starting from about **20 rows before** the matched row (i.e. `r - 20`, clamped to 0).
    - Through about **20 rows after** the matched row (i.e. `r + 20`, clamped to the total length).
  - This preserves existing lazy-loading behavior but guarantees that the matched row is present and can be scrolled into view.
- Existing scroll/load-more logic should remain intact; search should **cooperate** with it rather than resetting the table.

### 6. Keyboard interaction

- **Ctrl+F**:
  - Focuses the search input.
  - Does not trigger the browser’s default find UI.
- Optional future enhancement:
  - Keyboard shortcuts for navigating matches (e.g. Enter / Shift+Enter or custom chords) in addition to the up/down buttons.

## Acceptance criteria

- Pressing **Ctrl+F** focuses the custom search bar above the job applications table.
- Typing in the search bar:
  - Updates the **match count** in real time.
  - Moves the **selected cell** and scroll position to the **first** matching cell (when matches exist).
- The **currently selected cell** always corresponds to the **current match**.
- Clicking the **down arrow** moves selection and scroll to the **next** matching cell; clicking the **up arrow** moves to the **previous** matching cell.
- Navigating between matches does **not reset** the table to the beginning; it only loads a window of rows (about 20 before and 20 after the target row) as needed so the match can be rendered and scrolled into view.

