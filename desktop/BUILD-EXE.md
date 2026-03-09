# Building Tailor desktop app as .exe

## Quick build

From the **desktop** folder:

```bash
npm run dist
```

This will:

1. Build the Vite app (`dist/`)
2. Copy Electron main/preload (`dist-electron/`)
3. Package for Windows and create the executables in **`release/`**

## Output (in `desktop/release/`)

| File | Description |
|------|-------------|
| **Tailor 1.0.0.exe** | Portable single exe — no installer, run directly |
| **Tailor Setup 1.0.0.exe** | NSIS installer — user can choose install directory |
| **win-unpacked/** | Unpacked app folder (for testing or custom packaging) |

## Other commands

- **Portable only** (no installer):  
  `npm run dist:portable`  
  → produces only `Tailor 1.0.0.exe`

- **Unpacked directory** (no exe, for debugging):  
  `npm run pack`  
  → produces `release/win-unpacked/` with the app

## Requirements

- Node.js and npm
- Windows (for building the Windows exe); or use a Windows VM/CI if you're on Mac/Linux
- `CSC_IDENTITY_AUTO_DISCOVERY=false` is set so the build works without a code-signing certificate (exe will be unsigned; Windows may show a SmartScreen warning the first time)

## Version

The version in the exe filename comes from `package.json` → `"version"` (e.g. `1.0.0`). Update it before building if you want a new version number.
