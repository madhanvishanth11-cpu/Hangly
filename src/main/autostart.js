const { app } = require('electron');

/**
 * Configure Windows startup launch setting using Electron LoginItemSettings
 * @param {boolean} enable 
 */
function setAutoLaunch(enable) {
  if (process.platform === 'win32' || process.platform === 'darwin') {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: app.getPath('exe')
    });
  }
}

/**
 * Query current Windows startup launch setting
 * @returns {boolean}
 */
function getAutoLaunch() {
  if (process.platform === 'win32' || process.platform === 'darwin') {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  }
  return false;
}

module.exports = { setAutoLaunch, getAutoLaunch };
