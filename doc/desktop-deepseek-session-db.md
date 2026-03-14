# Desktop: DeepSeek Session from DB (Shared for All Users)

## Overview

The DeepSeek chat webview session (cookies) is stored in the app SQLite DB so **all users** share one DeepSeek login. When any user opens the DeepSeek panel, the desktop app loads cookies from the API (DB) and injects them into the webview partition. Admins can save the current session to the DB so others get it on next load.

## Behavior

- **First time (per app session):** When the DeepSeek panel is first opened, the app fetches cookies from `GET /api/deepseek-cookies`, injects them into the partition `persist:deepseek`, then sets the webview `src` so the first load already has the shared session (no login flash).
- **Subsequent opens:** No re-fetch; the partition already has cookies (Electron persists them on disk).
- **If session invalid:** After the webview loads, a simple heuristic (e.g. page has "Log in" text or login form) detects "not logged in". The app clears the "loaded from DB" flag, re-fetches from the API, re-injects cookies, and reloads the webview. This is retried up to **3** times.
- **Replace strategy:** When loading from DB, existing cookies for `chat.deepseek.com` in the partition are cleared, then only the cookies from the DB are set.
- **Full cookies:** The DB stores full Electron cookie objects (as returned by `session.cookies.get()`).

## Admin: Save Session

- **Button:** "Save session" (Save icon) in the DeepSeek panel header, to the **left** of the Refresh button. Visible only when `user?.role === 'admin'` and the desktop Electron API is available.
- **Tooltip:** "Sync with manager's session".
- **On click:** Gets current cookies from the partition via `getDeepSeekCookies()`, then `POST /api/deepseek-cookies` with `{ cookies }`. Shows success/error toast.

## Implementation (files)

| Area | File | Change |
|------|------|--------|
| Backend | `lib/db.ts` | Settings key `deepseek_cookies`; `getDeepSeekCookies()`, `setDeepSeekCookies(cookies)` |
| Backend | `app/api/deepseek-cookies/route.ts` | GET (requireUser), POST (requireAdmin), body `{ cookies }` |
| Electron | `desktop/electron/main.js` | `session`; IPC `get-deepseek-cookies`, `set-deepseek-cookies` (replace: clear domain cookies then set each) |
| Electron | `desktop/electron/preload.js` | `getDeepSeekCookies`, `setDeepSeekCookies` |
| Desktop | `desktop/src/components/job-applications-view.tsx` | First-time fetch + inject; webview `src` set after cookies; detection + 3 retries; admin "Save session" button |

## Security

- Cookies are sensitive; stored only in backend DB. GET requires any logged-in user; POST requires admin.
- Optional: rate-limit POST to avoid abuse.
