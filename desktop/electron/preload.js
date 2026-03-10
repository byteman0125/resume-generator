const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  setContentUrl: (url) => ipcRenderer.send("set-content-url", url),
  startResumeDrag: (buffer, fileName, appId) =>
    ipcRenderer.sendSync("resume-drag", { buffer, fileName, appId }),
  saveResumeToTemp: (buffer, fileName, profileName) =>
    ipcRenderer.invoke("save-resume-temp", { buffer, fileName, profileName }),
});
