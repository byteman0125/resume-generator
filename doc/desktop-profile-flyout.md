### Desktop: Global Profile Flyout

#### Overview

The desktop app exposes a **global, always-on-top profile flyout** as a small draggable icon that lives outside the main window. When you hover over the icon, a compact flyout window appears showing the **profile currently used for the open application modal**, with per-field copy buttons.

#### Behavior

- **Global icon**
  - Small circular icon window, always on top of other apps.
  - Draggable anywhere on screen; its position is saved in the desktop settings file and restored on next launch.
  - Visible whenever the desktop app is running.

- **Flyout window**
  - Appears when the mouse hovers over the icon or the flyout itself.
  - Hides shortly after the mouse leaves both the icon and the flyout (small delay to avoid flicker).
  - Shows a short set of fields from the profile:
    - Profile name
    - Title
    - Email
    - Phone
    - Location
    - Company from the current application form (if present)
  - Each field has a **copy** icon; clicking copies that field to the system clipboard and briefly shows a check icon.

- **Which profile is shown**
  - When the application modal opens, the app loads resume data using:
    - The application’s `profile_id` if applying an existing row, or
    - The current profile from the resume context otherwise.
  - After loading, it writes a small summary payload to `localStorage` under the key `desktop-profile-flyout-current-profile`.
  - The flyout window reads this summary and updates automatically (via `storage` events and a light polling fallback).

#### Implementation

- **React UI**
  - `desktop/src/components/ProfileFlyout.tsx`
    - `ProfileFlyout` renders the small window with profile fields and per-field copy buttons.
    - `ProfileFlyoutIcon` renders the global icon; it is styled for dragging and uses Electron IPC to signal hover state.
    - Reads from `localStorage["desktop-profile-flyout-current-profile"]` and listens for `storage` events.
    - Copy uses `window.electron.writeClipboardText` when available, falling back to `navigator.clipboard` / `document.execCommand`.

- **Renderer entry**
  - `desktop/src/main.tsx`
    - Checks `window.location.search` for `flyout`:
      - `flyout=profile` → render `ProfileFlyout` (wrapped in `ErrorBoundary` and `AuthProvider`).
      - `flyout=profile-icon` → render `ProfileFlyoutIcon` (wrapped in `ErrorBoundary`).
      - otherwise → normal `BrowserRouter` + `AppWithProviders`.

- **Electron main**
  - `desktop/electron/main.js`
    - Adds `screen` import and new globals:
      - `profileIconWindow`, `profileFlyoutWindow`.
    - Persists icon position in the existing desktop settings file:
      - `getProfileFlyoutIconPosition()` / `setProfileFlyoutIconPosition(bounds)` stored under `profileFlyoutIcon`.
    - `createProfileFlyoutWindows()`:
      - Creates the icon window (frameless, transparent, always-on-top, skipTaskbar) and loads `app://./index.html?flyout=profile-icon`.
      - Positions it using saved bounds or defaults near the right edge, middle of the screen.
      - Creates the flyout window (frameless, small, always-on-top, skipTaskbar, hidden by default) and loads `app://./index.html?flyout=profile`.
    - Called once in `app.whenReady()` alongside `createWindow()` and `createTray()`.
    - Hover IPC:
      - Keeps a `profileFlyoutHoverCount` and `profileFlyoutHideTimeout`.
      - `ipcMain.handle("set-profile-flyout-hover", ...)`:
        - On `hovering = true`:
          - Increments hover count.
          - Clears any hide timeout.
          - Positions flyout to the left of the icon and shows it (`showInactive()`).
        - On `hovering = false`:
          - Decrements hover count and starts a short timeout (250ms); when count drops to 0 it hides the flyout.

- **Electron preload**
  - `desktop/electron/preload.js`
    - Extends the bridged API:
      - `setProfileFlyoutHover(hovering: boolean)` → `ipcRenderer.invoke("set-profile-flyout-hover", hovering)`.

- **Job applications view integration**
  - `desktop/src/components/job-applications-view.tsx`
    - In the effect that loads modal resume data when the application modal opens:
      - After building `withContentCleared` and setting `modalResumeData` / `modalResumeDataId`, it writes a summary:
        - `id`, `profileName`, `title`, `email`, `phone`, `location` (city/state/postalCode), `company` (from `form.company_name`), and `updatedAt`.
      - Stored in `localStorage["desktop-profile-flyout-current-profile"]`.

#### Notes

- The flyout icon and window are **desktop-only** and do not affect the web app.
- Position persistence shares the existing `settings.json` in the Electron `userData` directory.
- If no profile has been loaded into the application modal yet, the flyout shows a small helper message instead of fields.

