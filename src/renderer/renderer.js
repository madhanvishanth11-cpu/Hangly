import { HangingObject } from '../components/hangingObject.js';
import { RopeSimulation } from '../physics/RopeSimulation.js';
import { RopeConfiguration } from '../physics/RopeConfiguration.js';
import { MouseInteractionHandler, InteractionState } from '../physics/MouseInteractionHandler.js';
import { AudioService } from '../services/AudioService.js';
import { SettingsStore } from '../services/SettingsStore.js';
import { SettingsView } from '../views/SettingsView.js';
import { CharmLibraryUI } from '../components/CharmLibraryUI.js';
import { CharmStudioUI } from '../components/CharmStudioUI.js';
import { WebUI } from '../web/WebUI.js';

const canvas = document.getElementById('overlay-canvas');
const ctx = canvas.getContext('2d');

const hangingObject = new HangingObject();
const mouseHandler = new MouseInteractionHandler();
const audioService = new AudioService();
const settingsStore = new SettingsStore();
const settingsView = new SettingsView(settingsStore);

let isPhysicsPaused = false;
let isOverlayVisible = true;

// Detect Web deployment vs Windows Electron environment
if (!window.hanglyAPI) {
  document.body.classList.add('web-mode');
}

// Initialize simulation with anchor point centered near top
const initialAnchorX = (window.innerWidth || 360) / 2;
const initialAnchorY = 35;
const ropeSimulation = new RopeSimulation(initialAnchorX, initialAnchorY, RopeConfiguration);

// Apply initial settings state
function applySettings(s) {
  audioService.setMuted(!s.soundsEnabled);
  audioService.setVolume(s.volume);

  ropeSimulation.applyMotionIntensity(s.motionIntensity);

  hangingObject.showBeads = s.showBeads;
  hangingObject.charmScale = s.charmScale;
}

settingsStore.onChange((s) => applySettings(s));
applySettings(settingsStore.settings);

// Built-in & Custom Charm Studio UI Instance
const charmStudioUI = new CharmStudioUI(
  hangingObject.charmLibrary,
  (savedCharm) => {
    audioService.playGrab();
    ropeSimulation.wakeUp();
  }
);

// Built-in Charm Library UI Instance
const charmLibraryUI = new CharmLibraryUI(
  hangingObject.charmLibrary,
  (selectedCharm) => {
    audioService.playGrab();
    ropeSimulation.wakeUp();
  },
  (charmToEdit) => {
    charmStudioUI.openWithCharm(charmToEdit);
  }
);

// Web Application UI Instance (for browser / Vercel deployment)
const webUI = new WebUI(
  hangingObject,
  ropeSimulation,
  audioService,
  settingsStore,
  charmStudioUI,
  charmLibraryUI,
  settingsView
);
webUI.init();

// Startup initial impulse
ropeSimulation.applyImpulse(40, 0);

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.scale(dpr, dpr);

  const anchorX = rect.width / 2;
  const anchorY = 35;
  ropeSimulation.setAnchorPoint(anchorX, anchorY);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function updateCursor() {
  const state = mouseHandler.state;
  if (state === InteractionState.DRAGGING || state === InteractionState.GRABBED) {
    document.body.style.cursor = 'grabbing';
  } else if (state === InteractionState.HOVER) {
    document.body.style.cursor = 'grab';
  } else {
    document.body.style.cursor = 'default';
  }
}

// Mouse Event Listeners
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 2) return; // Ignore right-click

  const charmPoint = ropeSimulation.getBottomPoint();
  const grabbed = mouseHandler.onMouseDown(e, charmPoint.x, charmPoint.y, hangingObject.charmRadius);

  if (grabbed) {
    ropeSimulation.setCharmDragPosition(charmPoint.x, charmPoint.y);
    audioService.playGrab();
  }
  updateCursor();
});

// Right-click charm to open Charm Library
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const charmPoint = ropeSimulation.getBottomPoint();
  if (mouseHandler.isOverCharm(e.clientX, e.clientY, charmPoint.x, charmPoint.y, hangingObject.charmRadius)) {
    charmLibraryUI.show();
  }
});

window.addEventListener('mousemove', (e) => {
  const charmPoint = ropeSimulation.getBottomPoint();
  const rect = canvas.getBoundingClientRect();

  const { isDragging, targetX, targetY } = mouseHandler.onMouseMove(
    e,
    charmPoint.x,
    charmPoint.y,
    hangingObject.charmRadius,
    rect.width,
    rect.height
  );

  if (isDragging && targetX !== undefined && targetY !== undefined) {
    ropeSimulation.setCharmDragPosition(targetX, targetY);
  }
  updateCursor();
});

window.addEventListener('mouseup', () => {
  const { wasDragging, vx, vy } = mouseHandler.onMouseUp();
  if (wasDragging) {
    ropeSimulation.releaseCharmWithVelocity(vx, vy);
    const speed = Math.hypot(vx, vy);
    audioService.playRelease(speed);
  }
  updateCursor();
});

// Mobile Touch Event Listeners (touchstart, touchmove, touchend)
function getTouchPos(e) {
  if (e.touches && e.touches.length > 0) {
    const rect = canvas.getBoundingClientRect();
    return {
      clientX: e.touches[0].clientX - rect.left,
      clientY: e.touches[0].clientY - rect.top
    };
  }
  return null;
}

canvas.addEventListener('touchstart', (e) => {
  const pos = getTouchPos(e);
  if (!pos) return;
  const charmPoint = ropeSimulation.getBottomPoint();
  const grabbed = mouseHandler.onMouseDown(pos, charmPoint.x, charmPoint.y, hangingObject.charmRadius);
  if (grabbed) {
    if (e.cancelable) e.preventDefault();
    ropeSimulation.setCharmDragPosition(charmPoint.x, charmPoint.y);
    audioService.playGrab();
  }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
  if (mouseHandler.state !== InteractionState.GRABBED && mouseHandler.state !== InteractionState.DRAGGING) return;
  const pos = getTouchPos(e);
  if (!pos) return;
  const charmPoint = ropeSimulation.getBottomPoint();
  const rect = canvas.getBoundingClientRect();

  const { isDragging, targetX, targetY } = mouseHandler.onMouseMove(
    pos,
    charmPoint.x,
    charmPoint.y,
    hangingObject.charmRadius,
    rect.width,
    rect.height
  );

  if (isDragging && targetX !== undefined && targetY !== undefined) {
    if (e.cancelable) e.preventDefault();
    ropeSimulation.setCharmDragPosition(targetX, targetY);
  }
}, { passive: false });

window.addEventListener('touchend', () => {
  const { wasDragging, vx, vy } = mouseHandler.onMouseUp();
  if (wasDragging) {
    ropeSimulation.releaseCharmWithVelocity(vx, vy);
    const speed = Math.hypot(vx, vy);
    audioService.playRelease(speed);
  }
});

window.addEventListener('mouseleave', () => {
  const { wasDragging, vx, vy } = mouseHandler.onMouseLeave();
  if (wasDragging) {
    ropeSimulation.releaseCharmWithVelocity(vx, vy);
  }
  updateCursor();
});

// Keyboard Shortcuts: C (Library), S (Studio), N (Settings), Shift+D (Debug), R (Reset Swing)
window.addEventListener('keydown', (e) => {
  if (e.key === 'C' || e.key === 'c') {
    charmLibraryUI.toggle();
  } else if (e.key === 'S' || e.key === 's') {
    charmStudioUI.toggle();
  } else if (e.key === 'N' || e.key === 'n') {
    settingsView.toggle();
  } else if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
    RopeConfiguration.debug = !RopeConfiguration.debug;
    ropeSimulation.wakeUp();
  } else if (e.key === 'R' || e.key === 'r') {
    ropeSimulation.applyImpulse(60, 0);
    audioService.playGrab();
  }
});

// IPC listeners from Tray menu
if (window.hanglyAPI) {
  window.hanglyAPI.onOpenCharmLibrary(() => {
    charmLibraryUI.show();
  });
  window.hanglyAPI.onOpenCharmStudio(() => {
    charmStudioUI.openWithCharm(hangingObject.charmLibrary.getActiveCharm());
  });
  window.hanglyAPI.onOpenSettings(() => {
    settingsView.show();
  });
  window.hanglyAPI.onResetSwing(() => {
    ropeSimulation.applyImpulse(75, 0);
    audioService.playGrab();
  });
  window.hanglyAPI.onTogglePhysics((_, paused) => {
    isPhysicsPaused = Boolean(paused);
    if (!isPhysicsPaused) {
      ropeSimulation.wakeUp();
    }
  });
  window.hanglyAPI.onToggleOverlay((_, visible) => {
    isOverlayVisible = Boolean(visible);
  });
}

// First-Launch Welcome Banner
function checkFirstLaunchWelcome() {
  try {
    if (!settingsStore.get('hasSeenWelcome')) {
      const banner = document.createElement('div');
      banner.className = 'welcome-toast';
      banner.innerHTML = `
        <div class="welcome-content">
          <h4>✨ Welcome to Hangly!</h4>
          <p>A tiny piece of motion for your desktop.</p>
          <ul>
            <li>🖱️ <b>Drag & Throw</b> the hanging charm</li>
            <li>💎 <b>Right-click charm</b> or press <b>'C'</b> for Library</li>
            <li>⚙️ <b>System Tray Icon</b> for settings & menu</li>
          </ul>
          <button id="welcome-dismiss-btn">Got it!</button>
        </div>
      `;
      document.body.appendChild(banner);

      const dismissBtn = banner.querySelector('#welcome-dismiss-btn');
      dismissBtn.addEventListener('click', () => {
        banner.classList.add('welcome-hidden');
        setTimeout(() => banner.remove(), 300);
        settingsStore.set('hasSeenWelcome', true);
      });
    }
  } catch (err) {
    console.warn('Could not display welcome banner:', err);
  }
}

checkFirstLaunchWelcome();

let lastTimestamp = performance.now();

function animate(now) {
  try {
    const dt = (now - lastTimestamp) / 1000;
    lastTimestamp = now;

    // Step physics simulation (unless paused via tray)
    if (!isPhysicsPaused) {
      const wasSleeping = ropeSimulation.isSleeping;
      ropeSimulation.update(dt);

      if (!wasSleeping && !ropeSimulation.isSleeping && !ropeSimulation.isDraggingCharm) {
        const charmPoint = ropeSimulation.getBottomPoint();
        const speed = Math.hypot(charmPoint.x - charmPoint.oldX, charmPoint.y - charmPoint.oldY);
        if (speed > 1.8) {
          audioService.playSwayChime(speed);
        }
      }
    }

    // Render frame
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (isOverlayVisible && settingsStore.get('showDesktopCharm')) {
      hangingObject.render(ctx, rect.width, rect.height, ropeSimulation, mouseHandler.state);
    }
  } catch (err) {
    console.error('Error during render loop iteration:', err);
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
