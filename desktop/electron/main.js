const { app, BrowserWindow, protocol, Tray, Menu, nativeImage, ipcMain, clipboard, dialog, session } = require("electron");
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

// Default file save path: stored in userData/settings.json; fallback = Downloads
const SETTINGS_FILE = path.join(app.getPath("userData"), "settings.json");
function getDefaultSavePath() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
      const data = JSON.parse(raw);
      if (typeof data.defaultSavePath === "string" && data.defaultSavePath.trim()) {
        return data.defaultSavePath.trim();
      }
    }
  } catch (_) {}
  return app.getPath("downloads");
}
function setDefaultSavePath(dirPath) {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    let data = {};
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
      } catch (_) {}
    }
    data.defaultSavePath = dirPath;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save default save path:", err);
  }
}
ipcMain.handle("get-default-save-path", () => getDefaultSavePath());
ipcMain.handle("set-default-save-path", (event, dirPath) => {
  if (typeof dirPath === "string" && dirPath.trim()) {
    setDefaultSavePath(dirPath.trim());
  }
});
ipcMain.handle("show-save-path-dialog", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win || null, {
    properties: ["openDirectory"],
    title: "Choose folder for saving files",
  });
  if (canceled || !filePaths || filePaths.length === 0) return null;
  return filePaths[0] || null;
});

// Cross-platform: never mkdir a filesystem/drive root (Windows E:\, Unix /).
function isPathRoot(dir) {
  const resolved = path.resolve(dir);
  const { root } = path.parse(resolved);
  return resolved === root || resolved === root.replace(/\/$/, "");
}

// Save resume PDF to default save folder (or Downloads) and (on Windows) put file on clipboard so Ctrl+V pastes the file.
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
    const dir = path.join(getDefaultSavePath(), ".");
    const filePath = path.join(dir, finalName);
    console.log("[ResumeCopy] main: saving to", filePath);
    if (!isPathRoot(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
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

// DeepSeek shared session: get/set cookies in partition persist:deepseek
const DEEPSEEK_PARTITION = "persist:deepseek";
const DEEPSEEK_URL = "https://chat.deepseek.com";

ipcMain.handle("get-deepseek-cookies", async () => {
  const ses = session.fromPartition(DEEPSEEK_PARTITION);
  const list = await ses.cookies.get({ url: DEEPSEEK_URL });
  return list;
});

ipcMain.handle("set-deepseek-cookies", async (_event, cookies) => {
  const ses = session.fromPartition(DEEPSEEK_PARTITION);
  const list = Array.isArray(cookies) ? cookies : [];
  const existing = await ses.cookies.get({ url: DEEPSEEK_URL });
  for (const c of existing) {
    await ses.cookies.remove(DEEPSEEK_URL, c.name);
  }
  for (const c of list) {
    const name = c && typeof c.name === "string" ? c.name : null;
    const value = c && typeof c.value === "string" ? c.value : "";
    if (!name) continue;
    await ses.cookies.set({
      url: DEEPSEEK_URL,
      name,
      value,
      path: typeof c.path === "string" ? c.path : "/",
      domain: typeof c.domain === "string" ? c.domain : undefined,
      secure: c.secure === true,
      httpOnly: c.httpOnly === true,
      expirationDate: typeof c.expirationDate === "number" ? c.expirationDate : undefined,
      sameSite: c.sameSite,
    });
  }
  return { ok: true };
});
