const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('theseusWindow', {
  minimize: () => ipcRenderer.invoke('theseus-window:minimize'),
  close: () => ipcRenderer.invoke('theseus-window:close'),
});
