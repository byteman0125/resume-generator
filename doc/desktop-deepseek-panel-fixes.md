# Desktop: DeepSeek Panel – No Refresh on Toggle, Refresh Button

## Summary
Two changes to the DeepSeek chat panel in the desktop app (job applications view):

1. **No page refresh when closing/opening the panel** – The webview stays mounted; only visibility is toggled.
2. **Refresh button instead of "Open in browser"** – In-panel refresh for the DeepSeek chat.

## 1. No refresh when toggling panel

**Problem:** The panel was conditionally rendered: when closed the webview was unmounted, so reopening caused a full reload of https://chat.deepseek.com/.

**Solution:** Use a single `<aside>` that is always rendered. The **webview is always in the DOM**; when the panel is "closed" we:
- Shrink the aside to a narrow strip (`w-10`) and show only the "open" (ChevronLeft) button.
- Hide the webview with CSS (`hidden` class) so it stays mounted and does not reload.

**File:** `desktop/src/components/job-applications-view.tsx`

- One `<aside>` with `className` that switches between `w-[20%] min-w-[200px]` (open) and `w-10` (closed).
- Header (title, Refresh, Close) is shown only when `deepSeekPanelOpen` is true.
- `<webview>` is always rendered; `className` includes `hidden` when the panel is closed, and `flex-1 flex min-h-0` when open.
- When closed, a div with the ChevronLeft button is shown to reopen the panel.

## 2. Refresh button instead of "Open in browser"

**Change:** Removed the "Open in browser" link. Added a **Refresh** button (Lucide `RefreshCw` icon) that calls the webview’s `reload()` method so the user can refresh the chat inside the app.

**Implementation:** The webview ref is used in the button’s `onClick`: `deepSeekWebViewRef.current.reload()` (with a type-safe cast because the JSX typings don’t declare Electron’s webview methods).

## Result
- Closing and reopening the DeepSeek panel no longer reloads the chat; cookies/session stay.
- Users can refresh the chat via the new Refresh button instead of opening the site in the browser.
