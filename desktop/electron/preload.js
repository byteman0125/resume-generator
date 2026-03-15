const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  setContentUrl: (url) => ipcRenderer.send("set-content-url", url),
  startResumeDrag: (buffer, fileName, appId) =>
    ipcRenderer.sendSync("resume-drag", { buffer, fileName, appId }),
  saveResumeToTemp: (buffer, fileName, profileName) =>
    ipcRenderer.invoke("save-resume-temp", { buffer, fileName, profileName }),
  getDefaultSavePath: () => ipcRenderer.invoke("get-default-save-path"),
  setDefaultSavePath: (dirPath) => ipcRenderer.invoke("set-default-save-path", dirPath),
  showSavePathDialog: () => ipcRenderer.invoke("show-save-path-dialog"),
  getDeepSeekCookies: () => ipcRenderer.invoke("get-deepseek-cookies"),
  setDeepSeekCookies: (cookies) => ipcRenderer.invoke("set-deepseek-cookies", cookies),
  writeClipboardText: (text) => ipcRenderer.invoke("write-clipboard-text", text),
});
