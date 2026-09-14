# Hangly Troubleshooting Guide

Solutions and diagnostic steps for common issues encountered during development, installation, or daily usage of **Hangly**.

---

## 🔍 Common Issues & Solutions

### 1. Application Does Not Launch
- **Symptom**: Clicking `Hangly 1.0.0.exe` does nothing or another instance is already running.
- **Cause**: Single-instance lock prevents duplicate processes.
- **Solution**:
  1. Check your Windows System Tray (near the clock) for the Hangly icon.
  2. Open Windows Task Manager (`Ctrl + Shift + Esc`) and terminate any lingering `Hangly.exe` process before relaunching.

---

### 2. Charm Overlay Is Missing / Hidden
- **Symptom**: The tray icon exists, but no charm is visible on desktop screen.
- **Cause**: Overlay hidden via System Tray or Settings.
- **Solution**:
  1. Right-click the System Tray icon and select **Show Charm**.
  2. Press **`N`** or click **Settings** and ensure **Show Desktop Charm** is checked.

---

### 3. Sound Effects Are Muted
- **Symptom**: Dragging or releasing the charm produces no audio feedback.
- **Cause**: Web Audio muted or master volume slider set to 0.
- **Solution**:
  1. Open Settings (**`N`**).
  2. Ensure **Enable Interaction Sound Effects** is checked.
  3. Increase **Master Volume** slider above 0%.

---

### 4. Custom Image Import Fails
- **Symptom**: Selecting a custom image in file dialog displays an error or fails to render.
- **Cause**: Unsupported file format or corrupt image file.
- **Solution**:
  1. Ensure the image file format is `.png`, `.jpg`, `.jpeg`, or `.webp`.
  2. Verify the image file opens cleanly in Windows Photos app before importing.

---

### 5. High CPU Usage While Idle
- **Symptom**: Task Manager shows continuous CPU usage when the charm is static.
- **Cause**: Kinetic sleep optimization paused or interrupted.
- **Solution**:
  1. Ensure no external auto-clicker software is triggering mouse events over the charm.
  2. Press **`R`** to reset swing and allow the Verlet simulation to return to sleep state naturally.

---

### 6. Development Start Error (`npm start`)
- **Symptom**: Error `electron: command not found` or module resolution failure.
- **Cause**: Missing or incomplete `node_modules`.
- **Solution**:
  ```bash
  npm install
  npm start
  ```
