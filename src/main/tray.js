const { Tray, Menu, nativeImage, app } = require('electron');
const { setAutoLaunch, getAutoLaunch } = require('./autostart');

let tray = null;
let isPhysicsPaused = false;

function createTray(mainWindow) {
  if (tray) return tray;

  const icon = nativeImage.createFromBitmap(createTrayBitmapBuffer(), {
    width: 16,
    height: 16
  });

  tray = new Tray(icon);
  tray.setToolTip('Hangly Desktop Overlay');

  const updateContextMenu = () => {
    const isVisible = mainWindow ? mainWindow.isVisible() : true;
    const isAutoStart = getAutoLaunch();

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Hangly Desktop',
        enabled: false
      },
      { type: 'separator' },
      {
        label: isVisible ? 'Hide Charm' : 'Show Charm',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isVisible()) {
              mainWindow.hide();
              mainWindow.webContents.send('toggle-overlay', false);
            } else {
              mainWindow.show();
              mainWindow.webContents.send('toggle-overlay', true);
            }
            updateContextMenu();
          }
        }
      },
      { type: 'separator' },
      {
        label: '💎 Charm Library',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.webContents.send('open-charm-library');
          }
        }
      },
      {
        label: '✨ Charm Studio',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.webContents.send('open-charm-studio');
          }
        }
      },
      {
        label: '⚙️ Settings',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.webContents.send('open-settings');
          }
        }
      },
      { type: 'separator' },
      {
        label: isPhysicsPaused ? '▶️ Resume Physics' : '⏸️ Pause Physics',
        click: () => {
          isPhysicsPaused = !isPhysicsPaused;
          if (mainWindow) {
            mainWindow.webContents.send('toggle-physics', isPhysicsPaused);
          }
          updateContextMenu();
        }
      },
      {
        label: '🔄 Reset Swing',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.send('reset-swing');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Launch at Startup',
        type: 'checkbox',
        checked: isAutoStart,
        click: (item) => {
          setAutoLaunch(item.checked);
          updateContextMenu();
        }
      },
      { type: 'separator' },
      {
        label: 'ℹ️ About Hangly',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.webContents.send('open-settings');
          }
        }
      },
      {
        label: '❌ Quit Hangly',
        click: () => {
          if (tray) {
            tray.destroy();
            tray = null;
          }
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
  };

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
      updateContextMenu();
    }
  });

  updateContextMenu();
  return tray;
}

/**
 * Generate 16x16 RGBA buffer for native Windows tray icon
 */
function createTrayBitmapBuffer() {
  const width = 16;
  const height = 16;
  const buffer = Buffer.alloc(width * height * 4);

  const cx = 8;
  const cy = 8;
  const r = 6;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);

      if (dist <= r) {
        if (dist <= 2) {
          buffer[idx] = 44;
          buffer[idx + 1] = 44;
          buffer[idx + 2] = 46;
          buffer[idx + 3] = 255;
        } else {
          buffer[idx] = 220;
          buffer[idx + 1] = 220;
          buffer[idx + 2] = 225;
          buffer[idx + 3] = 255;
        }
      } else {
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0;
      }
    }
  }

  return buffer;
}

module.exports = { createTray };
