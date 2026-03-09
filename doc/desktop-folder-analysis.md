# Desktop Folder App — Analysis

**Date:** 2025-03-04  
**Scope:** `desktop/` — Electron desktop client for Resume Builder.

---

## 1. Overview

The **desktop** app is a **Windows Electron client** that wraps the existing **Next.js** Resume Builder backend. It does not reimplement the app; it provides a native window with a **fixed header bar** (nav + backend IP + theme) and loads the **full Next.js UI** in an Electron **BrowserView** below that bar.

| Aspect | Detail |
|--------|--------|
| **Purpose** | Standalone .exe that connects to the Next.js backend (same port; IP configurable). |
| **Stack** | Electron 28, React 18, Vite 5, TypeScript, Tailwind CSS. |
| **Entry** | `main` → `dist-electron/main.js`; renderer → Vite build in `dist/`. |

---

## 2. Architecture

### 2.1 Process model

- **Main process** (`electron/main.js`): Creates one `BrowserWindow` that loads `dist/index.html` (the React shell). Registers IPC handler `set-content-url` to load a URL into a **BrowserView**.
- **Preload** (`electron/preload.js`): Exposes `window.electron.setContentUrl(url)` via `contextBridge` (context isolation, no Node in renderer).
- **Renderer**: Small React app that only renders the **top bar** (56px). It calls `setContentUrl(getContentViewUrl(path))` so the **content area** is the Next.js app at `http://<backend-ip>:3000?...&embedded=1`.

### 2.2 Two-layer UI

1. **Shell (Electron renderer)**  
   - Single React root: `App` → `AppHeader`.  
   - Header: brand, nav (Profile, Templates, AI, Job applications), theme toggle, Backend IP input, Save, Test.  
   - No main content in React — the rest of the window is the BrowserView.

2. **Content (BrowserView)**  
   - Loads `getContentViewUrl(path)` = `http://<ip>:3000<path>?embedded=1`.  
   - Next.js serves the same app as the web; `embedded=1` is used to hide its own header so the desktop bar is the only header.

### 2.3 Backend configuration

- **Port:** Fixed `3000` (same as Next.js), defined in `src/api.ts` as `BACKEND_PORT`.
- **IP:** User-editable in the header; stored in `localStorage` under `resume-builder-desktop-backend-ip` (default `127.0.0.1`).
- **Test:** Button calls `GET /api/profiles` to verify connectivity; shows OK/Fail in the header.

---

## 3. Folder structure (source)

```
desktop/
├── package.json          # Scripts, deps, electron-builder config
├── tsconfig.json         # TypeScript (ES2020, React JSX, strict)
├── vite.config.ts       # Vite + React, base: "./", outDir: dist
├── tailwind.config.js   # Tailwind + CSS variables (theme)
├── index.html           # Entry HTML; script /src/main.tsx
├── electron/
│   ├── main.js          # Main process: window + BrowserView + IPC
│   └── preload.js       # contextBridge: setContentUrl
├── scripts/
│   └── copy-main.js     # Copies electron/*.js → dist-electron/
└── src/
    ├── main.tsx         # React root
    ├── App.tsx          # Shell: AppHeader + setContentUrl on mount/save
    ├── index.css        # Tailwind + base + CSS variables (light/dark)
    ├── api.ts           # getBackendIp, setBackendIp, getBaseUrl, getContentViewUrl, apiFetch, apiJson
    ├── types.ts         # JobApplication, ProfileMeta
    ├── lib/
    │   └── utils.ts     # cn() (clsx + tailwind-merge)
    └── components/
        ├── AppHeader.tsx      # Nav, theme, Backend IP, Save, Test (used)
        ├── BackendBar.tsx     # Standalone IP bar (not used in current App)
        └── JobApplicationsView.tsx  # Table + CRUD via API (not used in current App)
```

**Build outputs:**  
- `dist/` — Vite build (index.html + assets).  
- `dist-electron/` — main.js, preload.js (for Electron and pack).  
- `release/` — electron-builder output (e.g. `Resume Builder Setup 1.0.0.exe`, portable).

---

## 4. Data flow

- **Shell:** Reads backend IP from `localStorage`; on Save, writes it and calls `onSave()` so `App` reloads the BrowserView with `getContentViewUrl("/")`.
- **Navigation:** Header nav buttons call `window.electron.setContentUrl(getContentViewUrl(path))` (e.g. `/profile`, `/template/format1`, `/ai`, `/applications`). No React state for “page” beyond what the header needs for active style.
- **Content:** All API calls (profiles, job applications, PDF, AI, etc.) are made by the **Next.js app** inside the BrowserView. The desktop shell only uses `getBaseUrl()` for the Test button and for building content URLs.

---

## 5. Components

| Component | Role | Used in App? |
|-----------|------|--------------|
| **App** | Renders AppHeader; on mount and onSave calls `setContentUrl(getContentViewUrl("/"))`. | Yes (root) |
| **AppHeader** | Nav links, theme toggle, Backend IP input, Save, Test. Replicates web header behavior. | Yes |
| **BackendBar** | Standalone backend IP bar (slate theme). | No |
| **JobApplicationsView** | Full job-applications table with search, profile filter, add/delete, uses `apiJson`/`apiFetch`. | No |

So the **only** UI rendered by the desktop React app is **AppHeader**. `BackendBar` and `JobApplicationsView` are unused and could be removed or kept for reference.

---

## 6. Scripts and build

| Script | Action |
|--------|--------|
| `npm run dev` | `npm run build` then `electron .` (no Vite dev server). |
| `npm run build` | `build:vite` + `build:electron` (Vite → dist/; copy main/preload → dist-electron/). |
| `npm run build:vite` | `vite build` → `dist/`. |
| `npm run build:electron` | `node scripts/copy-main.js` → dist-electron/. |
| `npm run start` | `electron .` (expects existing dist/ and dist-electron/). |
| `npm run dist` | Build + `electron-builder --win` (NSIS + portable; code signing off). |
| `npm run dist:portable` | Build + portable only. |

The app always runs from **built** assets (no hot reload). Backend must be running separately (e.g. root `npm run dev` on port 3000).

---

## 7. Security and config

- **Context isolation:** true; **nodeIntegration:** false in both window and BrowserView.
- **Preload:** Only exposes `setContentUrl`; no file system or shell access.
- **Builder:** `appId: com.resumebuilder.desktop`, `signAndEditExecutable: false`, `CSC_IDENTITY_AUTO_DISCOVERY=false` for unsigned Windows build.

---

## 8. Summary

- **Desktop app** = thin Electron shell (header bar + BrowserView) + full Next.js app as content.
- **Single source of truth for features:** Next.js; desktop only adds window chrome and configurable backend IP.
- **Unused modules:** `BackendBar`, `JobApplicationsView` (and their imports) are dead code in the current flow; consider deleting or documenting as “optional native views” if you plan to use them later.

---

*Generated as part of desktop folder analysis.*
