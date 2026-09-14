# Hangly Architecture & Data Flow

This document details the system design, IPC communications, physics integration, and component relationships within the **Hangly** desktop application.

---

## 🏗️ System Overview

Hangly uses a decoupled Electron architecture where the Main Process controls window management, system tray menus, autostart registry settings, and native OS file dialogs, while the Renderer Process handles canvas rendering, Verlet physics simulation, Web Audio synthesis, and UI overlays.

```
+-----------------------------------------------------------------------+
|                         Electron Main Process                         |
|  (src/main/main.js, window.js, tray.js, autostart.js)                 |
+------------------------------------+----------------------------------+
                                     |
                               IPC Bridge
                         (src/main/preload.js)
                                     |
+------------------------------------+----------------------------------+
|                        Electron Renderer                              |
|  (src/renderer/renderer.js, style.css, index.html)                    |
|                                                                       |
|  +---------------------+   +---------------------+   +--------------+ |
|  | RopeSimulation      |   | HangingObject       |   | AudioService | |
|  | (Verlet Engine)     |   | (Rope/Bead/Charm)   |   | (Web Audio)  | |
|  +---------------------+   +---------------------+   +--------------+ |
|  | CharmLibrary / Store|   | CharmStudioUI / Lib |   | SettingsView | |
|  +---------------------+   +---------------------+   +--------------+ |
+-----------------------------------------------------------------------+
```

---

## 🔄 Data & Control Flow

### 1. Application Boot Sequence
1. **Main Process Entry (`src/main/main.js`)**:
   - Requests single-instance lock (`app.requestSingleInstanceLock()`). If another instance is running, focuses existing window and exits.
   - Instantiates `BrowserWindow` via `createMainWindow()` (`src/main/window.js`) with `transparent: true`, `frame: false`, `alwaysOnTop: true`.
   - Creates system tray menu via `createTray()` (`src/main/tray.js`).
   - Sets up IPC handler `'select-charm-file'` for native Windows file picker.

2. **Renderer Initialization (`src/renderer/renderer.js`)**:
   - Instantiates `SettingsStore`, `AudioService`, `RopeSimulation`, `HangingObject`, `CharmLibraryUI`, `CharmStudioUI`, `SettingsView`.
   - Loads saved settings and active charm from `localStorage`.
   - Displays first-launch welcome toast if `hasSeenWelcome` is `false`.
   - Launches `requestAnimationFrame(animate)` physics and rendering loop.

---

### 2. Verlet Physics Integration (`src/physics/RopeSimulation.js`)
The rope consists of 20 mass points (`RopePoint.js`). The physics loop executes as follows:

```
Verlet Integration Step:
1. position = position + (position - oldPosition) * damping + gravity * dt^2
2. Constraint Solver (10 Relaxation Passes):
   - Force distance between adjacent points = segmentLength (14px)
3. Pin Anchor Point (node 0 fixed at top-center)
4. Pin Dragged Point (node 19 fixed to mouse position during interaction)
5. Energy Sleep Check:
   - If sum of point kinetic energies < 0.005 px/frame for 30 consecutive frames,
     set isSleeping = true to stop unnecessary CPU calculations.
```

---

### 3. Mouse Interaction Pipeline (`src/physics/MouseInteractionHandler.js`)
- **Grab (`mousedown`)**: Calculates Euclidean distance from click position to charm node. If `distance <= radius`, enters `GRABBED` state and streams drag coordinates.
- **Drag (`mousemove`)**: Tracks last 8 mouse positions with timestamps in a 120ms ring buffer to calculate release velocity vector `(vx, vy)`.
- **Release/Throw (`mouseup`)**: Calculates average velocity `(vx, vy)` from ring buffer and transfers momentum to bottom rope node using `releaseCharmWithVelocity(vx, vy)`.

---

### 4. Charm Management & Storage (`src/charms/CharmLibrary.js` & `CustomCharmStore.js`)
- **Built-in Charms**: 10 pre-configured vector/canvas charm objects (`Charm.js`).
- **Custom Charms**: Imported via native file dialog as base64 Data URLs, processed to retain transparency and proper aspect ratio, and saved to `localStorage` under `hangly_custom_charms`.
- **Charm Studio**: Applies non-destructive adjustment profiles (`scale`, `rotation`, `offsetX`, `offsetY`, `opacity`, `imageFit`) onto target charm objects.

---

## 🛡️ Security Architecture

| Security Measure | Value | Purpose |
|---|---|---|
| `contextIsolation` | `true` | Prevents renderer script access to Node.js internal modules |
| `nodeIntegration` | `false` | Disables `require` and Node globals in browser window |
| `preload.js` Bridge | `contextBridge.exposeInMainWorld` | Exposes explicit, safe API methods (`window.hanglyAPI`) |
| IPC Input Filtering | Main process whitelist | Validates file extensions in `select-charm-file` dialog |
