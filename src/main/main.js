const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const { createMainWindow } = require('./window');
const { createTray } = require('./tray');
const { setAutoLaunch } = require('./autostart');

let mainWindow = null;
let tray = null;

// Single Instance Lock: Prevent duplicate running instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Restore and focus existing running overlay instance when user opens app again
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    mainWindow = createMainWindow();
    tray = createTray(mainWindow);

    ipcMain.on('set-autostart', (event, enable) => {
      setAutoLaunch(enable);
    });

    // Native Windows File Picker IPC Handler
    ipcMain.handle('select-charm-file', async () => {
      try {
        const result = await dialog.showOpenDialog(mainWindow, {
          title: 'Select Custom Charm Image',
          properties: ['openFile'],
          filters: [
            { name: 'Images (*.png, *.jpg, *.jpeg, *.webp)', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
          ]
        });

        if (result.canceled || result.filePaths.length === 0) {
          return null;
        }

        const filePath = result.filePaths[0];
        const ext = path.extname(filePath).toLowerCase().replace('.', '');
        const name = path.basename(filePath, path.extname(filePath));
        const data = await fs.readFile(filePath);

        let mimeType = 'image/png';
        if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
        else if (ext === 'webp') mimeType = 'image/webp';

        const base64 = data.toString('base64');
        const dataUrl = `data:${mimeType};base64,${base64}`;

        return { name, dataUrl, filePath };
      } catch (err) {
        console.error('Error selecting custom charm file:', err);
        return null;
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow();
        tray = createTray(mainWindow);
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
