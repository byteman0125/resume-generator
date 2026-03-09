# Desktop application (Electron)

## Purpose

- **Standalone Windows .exe** that talks to the existing Next.js **backend only**. You can use it on another PC: run the backend on one machine, enter that machine’s IP in the desktop app, and use the full UI without running the Next.js frontend.
- User enters **backend IP** at the top of the UI; **port is fixed** (same as Next.js, default 3000).
- The desktop app is a **clone of the frontend**: same header (Resume Builder, Profile, Templates, AI, Job applications, theme toggle, Backend IP + Save + Test) and cloned pages (job applications table, profile list, AI prompts). All API calls go to `http://<saved-ip>:3000` via a fetch patch in the renderer.

## Location

- All desktop code lives under **`desktop/`** (separate `package.json`, build, and output).
- Backend stays in the repo root (Next.js); run it with `npm run dev` or `npm run start` on the machine that hosts the API (same or different PC).

## Behaviour

1. **Backend URL**
   - **IP**: User types the backend IP in the top bar (e.g. `127.0.0.1` for same machine, or another PC’s IP).
   - **Port**: Fixed to **3000** (same as Next.js). Not editable in the UI.
   - **Save**: IP is saved in `localStorage` and reused on next launch.
   - **Test**: “Test” button calls `GET /api/profiles` to verify connectivity.

2. **Features (cloned from web)**
   - **Job applications**: Full table (search, profile filter, selection, keyboard, right-click, Add/Apply modals, PDF actions) — same component as the web app, cloned into `desktop/src/components/job-applications-view.tsx`.
   - **Profile**: List profiles, set active, create new (minimal clone).
   - **AI**: View/edit API key and prompts (summary, bullets, skills) — same behavior as web.
   - **Templates**: Placeholder (template editing remains in the web app).
   - No Next.js frontend is loaded; the desktop is self-contained and only needs the backend API.

3. **Build and run**
   - **Development**: From `desktop/` run `npm run dev` (builds with Vite then runs Electron; no localhost dev server). Backend must be running (e.g. `npm run dev` in repo root).
   - **Production**: `npm run build` then `npm run start`, or `npm run dist` to produce the Windows installer/portable exe in `desktop/release/`.

## Build steps (Windows exe)

From the **`desktop/`** directory:

```bash
cd desktop
npm install
npm run build
npm run dist
```

- **`npm run build`**: Builds the renderer (Vite) into `dist/` and copies the Electron main process into `dist-electron/`.
- **`npm run dist`**: Runs the build and then `electron-builder --win` (code signing disabled). Output:
  - `release/Resume Builder Setup 1.0.0.exe` (NSIS installer)
  - `release/win-unpacked/Resume Builder.exe` (portable)

## Tech stack

- **Electron**: main process in `electron/main.js`; single window loads `dist/index.html` (no BrowserView).
- **Renderer**: React app (Vite build) with **cloned frontend**: same layout, header, and pages (job applications, profile, AI, template placeholder). `main.tsx` patches `window.fetch` so relative URLs (e.g. `/api/profiles`) are sent to `http://<saved-ip>:3000`. So the cloned code uses `fetch("/api/...")` unchanged and it hits the backend.
- **APIs**: All requests from the renderer go to the configured backend; no Next.js frontend is required.

## File layout (desktop/)

| Path | Role |
|------|------|
| `package.json` | Scripts, deps, electron-builder config |
| `electron/main.js` | Electron main process (entry for exe) |
| `scripts/copy-main.js` | Copies `electron/main.js` and `electron/preload.js` → `dist-electron/` |
| `src/main.tsx` | React entry; patches `window.fetch` so `/api/...` → backend URL |
| `src/App.tsx` | Layout: ResumeProvider, AppHeader, React Router Routes (/, /applications, /profile, /ai, /template/format1…) |
| `src/api.ts` | Base URL (IP + fixed port), getBaseUrl(), getBackendIp(), setBackendIp() |
| `src/lib/resume-context.tsx` | Cloned from web; provides profiles, switchProfile, createProfile, etc. (uses patched fetch) |
| `src/lib/resume-store.ts`, `template-format.ts` | Cloned from web (types, FORMAT_LIST, defaultResumeData) |
| `src/components/AppHeader.tsx` | Nav (Profile, Templates, AI, Job applications), theme toggle, Backend IP + Save + Test |
| `src/components/job-applications-view.tsx` | Cloned from web; full table and Apply/Add modals |
| `src/components/ui/*` | Cloned UI (button, input, label, dialog, card, table, textarea) |
| `src/pages/ProfilePage.tsx`, `AIPage.tsx`, `TemplatePage.tsx` | Profile list, AI prompts, template placeholder |
| `dist/` | Vite build output (after `npm run build:vite`) |
| `dist-electron/` | Main process used by pack (after `npm run build:electron`) |
| `release/` | electron-builder output (exe, installer) |

## Troubleshooting: "Cannot create symbolic link" when building

If `npm run dist` fails with **"Cannot create symbolic link : A required privilege is not held by the client"** (during winCodeSign extraction), try:

1. **Run terminal as Administrator**  
   Right‑click PowerShell or Command Prompt → "Run as administrator", then `cd desktop` and `npm run dist` again. Once the cache is extracted, future builds may work without admin.

2. **Enable Developer Mode (Windows)**  
   Settings → Privacy & security → For developers → **Developer Mode** = On. This allows creating symlinks without admin; then run `npm run dist` again.

3. **Build portable only**  
   Run `npm run dist:portable` to build only the portable exe (no NSIS installer). Output: `release/Resume Builder 1.0.0.exe`. This can sometimes avoid the signing-tool extraction step.

Code signing is already disabled (`CSC_IDENTITY_AUTO_DISCOVERY=false` and `signAndEditExecutable: false`), so the app builds as an **unsigned** exe.

## Notes

- The desktop app does **not** run a Vite dev server (no localhost:5173). Vite is only used to bundle the renderer (`npm run build:vite`); the window always loads the built `dist/index.html` from disk.
- For full parity with the web app (e.g. Apply flow, PDF generation, AI prompts), the desktop app can be extended to call the same APIs (`/api/pdf`, `/api/ai/prompts`, `/api/ai/generate`, etc.) using the same base URL from the IP bar.
