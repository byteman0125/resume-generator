const { app, BrowserWindow, protocol, Tray, Menu, nativeImage, ipcMain, clipboard } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFile } = require("child_process");

const DIST_DIR = path.join(__dirname, "..", "dist");
const PRELOAD_PATH = path.join(__dirname, "preload.js");

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
function getMime(p) {
  return MIME[path.extname(p).toLowerCase()] || "application/octet-stream";
}

// Must be called before app.ready so custom scheme works like a standard one
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);

/** Fallback 16x16 tray icon if resources/icon.png is missing - base64 PNG */
const TRAY_ICON_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACTSURBVHgBpZKBCYAgEEV/TeAIjuIIbdQIuUGt0CS1gW1iZ2jIVaTnhw+Cvs8/OYDJA4Y8kR3ZR2/kmazxJbpUEfQ/Dm/UG7wVwHkjlQdMFfDdJMFaACebnjJGyDWgcnZu1/lrCrl6NCoEHJBrDwEr5NrT6ko/UV8xdLAC2N49mlc5CylpYh8wCwqrvbBGLoKGvz8Bfq0QPWEUo/EAAAAASUVORK5CYII=";

let mainWindow = null;
let tray = null;

function getAppIcon() {
  const iconPath = path.join(__dirname, "resources", "icon.png");
  try {
    if (fs.existsSync(iconPath)) {
      return nativeImage.createFromPath(iconPath);
    }
  } catch (_) {}
  return nativeImage.createFromDataURL("data:image/png;base64," + TRAY_ICON_BASE64);
}

function createWindow() {
  const icon = getAppIcon();
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Tailor (Desktop)",
    icon: icon.isEmpty() ? undefined : icon,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      webviewTag: true,
      preload: PRELOAD_PATH,
    },
  });

  mainWindow = win;
  win.loadURL("app://./index.html");

  win.once("ready-to-show", () => {
    // In development, open DevTools so renderer logs (e.g. [ResumeCopy]) are visible.
    if (!app.isPackaged) {
      try {
        win.webContents.openDevTools();
      } catch (_) {}
    }
    // Always start in maximized (full) window mode.
    try {
      win.maximize();
    } catch (_) {}
    win.show();
    win.focus();
  });

  // Close = hide to tray (do not quit)
  win.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });

  win.on("closed", () => {
    mainWindow = null;
  });
}

function showMainWindow() {
  if (mainWindow) {
    try {
      if (!mainWindow.isMaximized()) {
        mainWindow.maximize();
      }
    } catch (_) {}
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }
}

function createTray() {
  const icon = getAppIcon();
  tray = new Tray(icon.isEmpty() ? nativeImage.createFromDataURL("data:image/png;base64," + TRAY_ICON_BASE64) : icon);
  tray.setToolTip("Tailor (Desktop)");
  tray.on("click", () => showMainWindow());
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show", click: () => showMainWindow() },
    { type: "separator" },
    { label: "Quit", click: () => { app.isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  console.log("[ResumeCopy] Main process ready. When you click Copy (resume cell), logs will appear here.");
  protocol.handle("app", (request) => {
    const requestUrl = request.url;
    let pathname = requestUrl.replace(/^app:\/\//, "").replace(/\?.*$/, "").replace(/#.*$/, "");
    if (pathname.startsWith("./")) pathname = pathname.slice(2);
    if (!pathname) pathname = "index.html";
    pathname = decodeURIComponent(pathname).replace(/^\/+/, "");
    if (!pathname) pathname = "index.html";
    const filePath = path.join(DIST_DIR, pathname);
    const absolutePath = path.resolve(filePath);
    if (!absolutePath.startsWith(path.resolve(DIST_DIR))) {
      return new Response("Forbidden", { status: 403 });
    }
    try {
      const data = fs.readFileSync(absolutePath);
      return new Response(data, {
        headers: { "Content-Type": getMime(pathname) },
      });
    } catch (err) {
      return new Response("Not Found", { status: 404 });
    }
  });

  createWindow();
  createTray();
});

// Keep app running when window is closed (hidden to tray)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    // Do not quit; window was hidden to tray
  }
});

app.on("activate", () => {
  showMainWindow();
});

app.on("before-quit", () => {
  app.isQuitting = true;
});

// Drag resume PDF: save to temp dir in an id folder so the dropped file loads correctly
const RESUME_DRAG_TEMP_BASE = path.join(os.tmpdir(), "resume-builder-drag");

ipcMain.on("resume-drag", (event, { buffer, fileName, appId }) => {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  const safeName = (fileName || "Resume.pdf").replace(/[<>:"/\\|?*]/g, "_").slice(0, 200) || "Resume.pdf";
  const safeId = (appId || "default").replace(/[<>:"/\\|?*]/g, "_").slice(0, 100) || "default";
  const idDir = path.join(RESUME_DRAG_TEMP_BASE, safeId);
  const filePath = path.join(idDir, safeName);
  try {
    fs.mkdirSync(idDir, { recursive: true });
    fs.writeFileSync(filePath, buf);
    const iconPath = path.join(__dirname, "resources", "icon.png");
    win.webContents.startDrag(
      fs.existsSync(iconPath)
        ? { file: filePath, icon: iconPath }
        : { file: filePath }
    );
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        try {
          const remaining = fs.readdirSync(idDir);
          if (remaining.length === 0) fs.rmdirSync(idDir);
        } catch (_) {}
      } catch (_) {}
    }, 300000);
  } catch (err) {
    console.error("Resume drag failed:", err);
  }
});

// On Windows, use PowerShell + .NET to set clipboard with file so Ctrl+V pastes the file (like Explorer).
function setWindowsClipboardFile(absolutePath) {
  return new Promise((resolve, reject) => {
    // Escape single quotes for PowerShell single-quoted string (double them).
    const escaped = absolutePath.replace(/'/g, "''");
    const script = `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Collections.Specialized.StringCollection; $f.Add('${escaped}'); [System.Windows.Forms.Clipboard]::SetFileDropList($f)`;
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { windowsHide: true, timeout: 10000 },
      (err, stdout, stderr) => {
        if (err) {
          if (stderr && stderr.trim()) console.warn("[ResumeCopy] PowerShell stderr:", stderr.trim());
          reject(err);
          return;
        }
        resolve();
      }
    );
  });
}

// Save resume PDF to Downloads and (on Windows) put file on clipboard so Ctrl+V pastes the file.
ipcMain.handle("save-resume-temp", async (event, { buffer, fileName, profileName }) => {
  console.log("[ResumeCopy] main: save-resume-temp called", { fileName, profileName, bufferLength: buffer?.byteLength ?? buffer?.length });
  try {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const baseName =
      (profileName || "").toString().trim() ||
      (fileName || "").toString().trim() ||
      "Resume";
    const safeBase = baseName.replace(/[<>:"/\\|?*]/g, "_").slice(0, 150) || "Resume";
    const finalName =
      ((fileName || "").toString().trim() &&
        (fileName || "").toString().trim().replace(/[<>:"/\\|?*]/g, "_").slice(0, 200)) ||
      `${safeBase}.pdf`;
    const dir = path.join(app.getPath("downloads"), ".");
    const filePath = path.join(dir, finalName);
    console.log("[ResumeCopy] main: saving to", filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, buf);

    // Set clipboard: on Windows use PowerShell + .NET so Ctrl+V pastes the file (like File Explorer).
    let clipboardFileSet = false;
    if (process.platform === "win32") {
      try {
        await setWindowsClipboardFile(filePath);
        clipboardFileSet = true;
        console.log("[ResumeCopy] main: clipboard file set via PowerShell (SetFileDropList)");
      } catch (clipErr) {
        console.warn("[ResumeCopy] main: PowerShell clipboard failed, falling back to path as text:", clipErr);
        clipboard.writeText(filePath);
      }
    } else {
      clipboard.writeText(filePath);
    }

    console.log("[ResumeCopy] main: success", { filePath, clipboardFile: clipboardFileSet });
    return { filePath, clipboardFile: clipboardFileSet };
  } catch (err) {
    console.error("[ResumeCopy] main: Failed to save resume:", err);
    return null;
  }
});
