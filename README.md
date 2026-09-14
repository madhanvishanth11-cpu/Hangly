# Hangly

A tiny piece of motion for your desktop.

## About

**Hangly** is a lightweight, transparent Windows desktop utility that brings an interactive, hanging charm to the top of your screen. Utilizing a 20-segment Verlet physics engine with multi-pass constraint solving, gravity, and velocity damping, Hangly behaves like a physical desktop pendulum that responds to mouse interactions and window movements.

### Key Highlights
- **Physics-Based Rope**: Realistic pendulum movement driven by numerical integration rather than pre-rendered GIF loops.
- **Interactive Mechanics**: Left-click to grab and drag the charm; release while moving to throw with momentum.
- **Decorative Beads**: 6 3D-shaded metallic beads along the rope that sway naturally with motion.
- **Built-In Charm Catalog**: 10 distinct charms across Metallic, Gems, Celestial, and Nature categories.
- **Custom Charm Import**: Import any PNG, JPG/JPEG, or WebP image from your computer.
- **Charm Studio**: Live interactive editor to scale, rotate, offset, change opacity, and fit charms.
- **Web Audio Sound Effects**: Subtle synthesized grab clicks, release whooshes, and sway chimes.
- **Persistent Settings**: Remembers volume, sound toggles, motion intensity, charm scale, and selected charm.
- **Windows System Tray**: Tray menu for Show/Hide, Pause/Resume, Swing Reset, Settings, and Autostart.
- **Launch at Windows Startup**: Native integration via Windows registry login items.

---

## Features

| Feature | Description |
|---|---|
| **Verlet Simulation** | 20-segment mass-point rope physics with constraint distance enforcement |
| **Interactive Physics** | Mouse drag pinning, 120ms ring-buffer velocity tracking, and momentum throw |
| **Charm Catalog** | 10 built-in vector & canvas rendered charms with active selection persistence |
| **Image Importer** | Native Windows file dialog (`PNG`, `JPG`, `WebP`) with auto-resizing & transparency support |
| **Charm Studio** | Studio modal preview with live sliders for Scale, Rotation, X/Y Offset, Opacity, and Image Fit |
| **Audio Service** | Web Audio API synthesizer for clean sound effects without external audio assets |
| **System Tray Integration** | Windows system tray icon and menu for instant show/hide and state management |
| **Energy Optimization** | Kinetic sleep monitoring (< 0.005 px/frame threshold) reducing idle CPU usage to < 0.1% |

---

## Screenshots

*(Screenshots placeholder — Add application previews and GIF demos here)*

---

## How It Works

The application architecture follows a unidirectional rendering pipeline:

```
Desktop Screen
     ↓
Transparent Overlay Window (BrowserWindow)
     ↓
HTML5 Canvas Overlay
     ↓
Verlet Physics Rope (RopeSimulation)
     ↓
Decorative Beads (BeadRenderer)
     ↓
Hanging Charm (Charm / CharmRenderer)
```

The rope is dynamically simulated in real time using a 2D Verlet numerical integrator rather than simple keyframe animations. Every frame, gravity and damping vectors are applied to 20 mass-points, enforcing fixed segment lengths to create realistic sway and momentum.

---

## Requirements

### Supported Operating Systems
- **Windows 10** (64-bit x64)
- **Windows 11** (64-bit x64)

### Dependencies
- None required for running the pre-built portable binary (`Hangly 1.0.0.exe`).
- Node.js (v18+) and npm (v9+) required only for local development.

### Hardware Requirements
- **Processor**: Any x86_64 Dual-Core CPU (1.5 GHz or higher)
- **RAM**: 2 GB RAM (Application uses ~45–65 MB RSS)
- **Display**: Any display resolution (Supports multi-monitor setups)

---

## Installation

### Running Portable Binary
1. Download `Hangly 1.0.0.exe` from the `dist/` directory or release page.
2. Double-click `Hangly 1.0.0.exe` to launch immediately. No elevated admin rights required.
3. Hangly will launch in the background and display the charm overlay near the top center of your screen.
4. Locate the **Hangly** icon in your Windows System Tray (near the clock).

---

## First Launch

On initial launch, Hangly displays a minimal welcome toast banner:

- **Drag & Throw**: Left-click and drag the charm, then release to swing.
- **Charm Library**: Right-click the charm or press **`C`** to open the Charm Library.
- **System Tray**: Right-click the tray icon for quick controls and Settings.
- Click **Got it!** to dismiss the welcome banner (this setting is saved automatically).

---

## Using Hangly

| Action | Shortcut / Trigger | Description |
|---|---|---|
| **Grab & Drag** | Left-Click + Drag | Pick up and pull the charm across the screen |
| **Throw** | Drag + Release while moving | Release with mouse velocity to throw the charm |
| **Open Library** | Press **`C`** or Right-Click Charm | Browse built-in and custom charms |
| **Open Studio** | Press **`S`** or click Pencil icon | Customize scale, rotation, offset, and opacity |
| **Open Settings** | Press **`N`** or click Tray -> Settings | Adjust volume, sound, motion intensity, and startup |
| **Reset Swing** | Press **`R`** | Apply an initial swinging impulse to the rope |
| **Toggle Debug** | Press **Shift + D** | Render velocity vectors and node constraint points |

---

## Settings

Organized into five clear categories:

1. **General**: Launch at Windows Startup, Show Desktop Charm, Remember Selected Charm.
2. **Sound & Audio**: Enable interaction sound effects, Master Volume slider (0%–100%).
3. **Physics Simulation**: Motion Intensity selection (`Low`, `Normal`, `High`).
4. **Appearance & Visuals**: Charm Scale adjustment (0.6x–1.6x), Show Decorative Beads toggle.
5. **About**: Displays version `1.0.0` and application slogan.

---

## System Tray

Right-clicking the System Tray icon reveals quick controls:

- **Show Charm / Hide Charm**: Toggle visibility of the transparent overlay window.
- **💎 Charm Library**: Open the charm selection modal.
- **✨ Charm Studio**: Open the live charm editor modal.
- **⚙️ Settings**: Open application configuration panel.
- **▶️ Resume Physics / ⏸️ Pause Physics**: Freeze or unfreeze physics processing.
- **🔄 Reset Swing**: Trigger a swinging motion.
- **Launch at Startup**: Toggle Windows autostart setting.
- **ℹ️ About Hangly**: View version information.
- **❌ Quit Hangly**: Safely destroy tray icon and exit process.

---

## Custom Charms

Users can import custom graphics to hang from the rope:

- **Supported Formats**: `PNG`, `JPG` / `JPEG`, `WebP`.
- **Storage**: Custom charms are processed into high-quality base64 Data URLs and stored locally in browser `localStorage` under `hangly_custom_charms`.
- **Image Processing**: Automatic aspect-ratio preservation and max resolution capping (512x512) to ensure fast rendering.

---

## Development

To run and modify Hangly locally:

```bash
# Install dependencies
npm install

# Start Windows desktop development mode
npm run dev

# Start local web server (Vercel web preview)
npm run serve
```

---

## Production Build

To compile standalone binaries and portable executables:

```bash
# Build production Windows binaries
npm run build
```

This runs `electron-builder --win portable zip` and generates outputs in `dist/`:
- `dist/Hangly 1.0.0.exe` (Standalone Portable)
- `dist/Hangly-1.0.0-win.zip` (ZIP Archive)
- `dist/win-unpacked/Hangly.exe` (Unpacked Directory)

---

## Project Structure

```
Hangly/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── pull_request_template.md
├── assets/
│   ├── icon.ico
│   └── icon.png
├── dist/ (Ignored in Git)
│   └── Hangly 1.0.0.exe
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT.md
│   └── TROUBLESHOOTING.md
├── src/
│   ├── main/
│   │   ├── main.js
│   │   ├── window.js
│   │   ├── tray.js
│   │   ├── autostart.js
│   │   └── preload.js
│   ├── physics/
│   │   ├── RopeSimulation.js
│   │   ├── RopePoint.js
│   │   ├── MouseInteractionHandler.js
│   │   └── RopeConfiguration.js
│   ├── charms/
│   │   ├── CharmLibrary.js
│   │   └── CustomCharmStore.js
│   ├── models/
│   │   └── Charm.js
│   ├── components/
│   │   ├── hangingObject.js
│   │   ├── RopeRenderer.js
│   │   ├── BeadRenderer.js
│   │   ├── CharmLibraryUI.js
│   │   └── CharmStudioUI.js
│   ├── renderers/
│   │   └── CharmRenderer.js
│   ├── services/
│   │   ├── AudioService.js
│   │   └── SettingsStore.js
│   ├── views/
│   │   └── SettingsView.js
│   └── renderer/
│       ├── index.html
│       ├── renderer.js
│       └── style.css
├── .gitignore
├── package.json
└── README.md
```

---

## Architecture

1. **Electron Main Process** (`src/main/main.js`): Manages app lifecycle, single instance lock, tray creation, native file dialogs, and autostart registry configuration.
2. **BrowserWindow Overlay** (`src/main/window.js`): Creates a frameless, transparent, always-on-top window positioned near top center of primary screen.
3. **IPC Preload Bridge** (`src/main/preload.js`): Exposes secure `hanglyAPI` methods to renderer with `contextIsolation: true`.
4. **Verlet Physics Engine** (`src/physics/RopeSimulation.js`): Calculates mass-point integration, distance constraints, mouse drag pinning, and kinetic sleep optimization.
5. **Charm Manager & Store** (`src/charms/CharmLibrary.js`): Manages 10 built-in charms and persistent custom charms in `localStorage`.
6. **Audio Synthesizer** (`src/services/AudioService.js`): Web Audio API synth generating subtle audio feedback without external audio files.

---

## Security

- **Context Isolation**: Enabled (`contextIsolation: true`) to prevent renderer from accessing Node.js runtime globals directly.
- **Node Integration Disabled**: `nodeIntegration: false` enforced in window creation.
- **IPC Validation**: `select-charm-file` validates file extensions (`png`, `jpg`, `jpeg`, `webp`) in main process before loading data.

---

## Troubleshooting

### Desktop Charm Not Visible
- Check if "Hide Charm" is active in the System Tray menu.
- Ensure "Show Desktop Charm" is enabled in Settings (**`N`**).

### Sound Not Playing
- Check Master Volume in Settings (**`N`**).
- Ensure "Enable Interaction Sound Effects" is checked.

### Custom Charm Image Not Loading
- Ensure selected file is a valid PNG, JPG, or WebP image.
- Avoid corrupt or encrypted files.

---

## Uninstall

To remove Hangly:
1. Quit Hangly via System Tray (**`❌ Quit Hangly`**).
2. Delete the `Hangly 1.0.0.exe` executable file.
3. Local settings can be cleared by deleting browser storage if desired.

---

## Known Limitations

- Multi-monitor setups: On display topology changes, Hangly centers over the primary screen.
- Hardware Acceleration: Requires standard HTML5 Canvas GPU acceleration for optimal 60 FPS performance.

---

## Git Workflow Guide

To initialize a Git repository and publish Hangly to GitHub:

```bash
git init
git add .
git commit -m "Initial Hangly release"
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY>
git push -u origin main
```

---

## License

License: Not yet specified.
