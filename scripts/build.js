const builder = require('electron-builder');
const Platform = builder.Platform;

builder.build({
  targets: Platform.WINDOWS.createTarget(['nsis', 'portable']),
  config: {
    appId: "com.hangly.desktop",
    productName: "Hangly",
    copyright: "Copyright © 2026 Hangly Team",
    directories: {
      output: "dist"
    },
    files: [
      "src/**/*",
      "package.json",
      "assets/**/*"
    ],
    win: {
      target: ["nsis", "portable"],
      icon: "assets/icon.ico",
      sign: async () => {
        // Skip code signing for local unsigned developer builds
        return true;
      }
    },
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      shortcutName: "Hangly"
    }
  }
}).then((res) => {
  console.log('====================================');
  console.log('Build completed successfully!');
  console.log('Generated outputs:', res);
  console.log('====================================');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
