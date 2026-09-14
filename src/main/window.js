const { BrowserWindow, screen } = require('electron');
const path = require('path');

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();

  const winWidth = 380;
  const winHeight = 540;

  // Position centered horizontally near top of primary display
  const x = Math.round(primaryDisplay.bounds.x + (primaryDisplay.bounds.width - winWidth) / 2);
  const y = Math.round(primaryDisplay.bounds.y + 10);

  const win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    hasShadow: false,
    skipTaskbar: false,
    icon: path.join(__dirname, '../../assets/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.setAlwaysOnTop(true, 'floating');
  win.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Multi-monitor display resolution and topology change listener
  const adjustPosition = () => {
    try {
      if (win && !win.isDestroyed()) {
        const display = screen.getPrimaryDisplay();
        const targetX = Math.round(display.bounds.x + (display.bounds.width - winWidth) / 2);
        win.setPosition(targetX, display.bounds.y + 10);
      }
    } catch (err) {
      console.warn('Could not adjust window position on display metrics change:', err);
    }
  };

  screen.on('display-metrics-changed', adjustPosition);
  screen.on('display-added', adjustPosition);
  screen.on('display-removed', adjustPosition);

  return win;
}

module.exports = { createMainWindow };
