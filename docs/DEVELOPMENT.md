# Hangly Development Guide

Instructions for setup, local development, syntax testing, debugging, and production compilation of the **Hangly** Windows application.

---

## 🛠️ Prerequisites

- **Operating System**: Windows 10 / 11 (64-bit)
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

## 🚀 Environment Setup

Clone or extract the repository and install npm dependencies:

```bash
# Navigate to project directory
cd "Hangly project"

# Install node dependencies
npm install
```

---

## 🖥️ Development Commands

All npm commands correspond directly to scripts in `package.json`:

### Start Development Server / Application
Launches Electron in development mode loading local renderer assets:

```bash
npm start
# OR
npm run dev
```

---

### Code Syntax Check
Run Node.js syntax verification across all source files:

```bash
node -c src/main/main.js src/main/window.js src/main/tray.js src/main/autostart.js src/main/preload.js src/physics/RopeSimulation.js src/physics/RopePoint.js src/physics/MouseInteractionHandler.js src/components/RopeRenderer.js src/components/BeadRenderer.js src/components/CharmLibraryUI.js src/components/CharmStudioUI.js src/charms/CharmLibrary.js src/charms/CustomCharmStore.js src/models/Charm.js src/renderers/CharmRenderer.js src/services/AudioService.js src/services/SettingsStore.js src/views/SettingsView.js src/renderer/renderer.js
```

---

## 📦 Production Build & Packaging

Build production Windows executables and portable bundles:

```bash
npm run build
# OR
npm run dist
```

### Generated Artifacts
Build outputs are generated in the `dist/` directory:
- `dist/Hangly 1.0.0.exe`: Standalone portable executable.
- `dist/Hangly-1.0.0-win.zip`: Compressed release archive.
- `dist/win-unpacked/Hangly.exe`: Unpacked binary folder.

---

## 🐛 Debugging & Diagnostics

### Keyboard Debug Shortcuts (In App Window)
- **`Shift + D`**: Toggle physics debug rendering overlay (displays node constraint vectors, velocity arrows, and drag radii).
- **`R`**: Apply manual swinging impulse (60px velocity kick).
- **`C`**: Toggle Charm Library.
- **`S`**: Toggle Charm Studio.
- **`N`**: Toggle Settings View.

### Chrome DevTools
To open DevTools during development, add `win.webContents.openDevTools({ mode: 'detach' });` in `src/main/window.js`.
