const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hanglyAPI', {
  onOpenCharmLibrary: (callback) => ipcRenderer.on('open-charm-library', callback),
  onOpenCharmStudio: (callback) => ipcRenderer.on('open-charm-studio', callback),
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
  onResetSwing: (callback) => ipcRenderer.on('reset-swing', callback),
  onTogglePhysics: (callback) => ipcRenderer.on('toggle-physics', callback),
  onToggleOverlay: (callback) => ipcRenderer.on('toggle-overlay', callback),
  setAutoLaunch: (enable) => ipcRenderer.send('set-autostart', enable),
  selectCharmFile: () => ipcRenderer.invoke('select-charm-file')
});
