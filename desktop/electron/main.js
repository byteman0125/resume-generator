const { app, BrowserWindow, protocol, Tray, Menu, nativeImage, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

const DIST_DIR = path.join(__dirname, "..", "dist");

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

// Save resume PDF to a stable temp location so the user can access it from the filesystem.
// We keep one file per profile name (overwritten on each copy) to avoid clutter.
const RESUME_COPY_TEMP_BASE = path.join(os.tmpdir(), "resume-builder-copy");

ipcMain.handle("save-resume-temp", async (event, { buffer, fileName, profileName }) => {
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
    const dir = RESUME_COPY_TEMP_BASE;
    const filePath = path.join(dir, finalName);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, buf);
    return filePath;
  } catch (err) {
    console.error("Failed to save resume to temp:", err);
    return null;
  }
});
