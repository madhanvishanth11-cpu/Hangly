/**
 * SettingsView - Renders the clean glassmorphism settings modal panel
 * with General, Sound, Physics, Appearance, and Reset controls.
 */
export class SettingsView {
  /**
   * @param {import('../services/SettingsStore.js').SettingsStore} settingsStore 
   */
  constructor(settingsStore) {
    this.store = settingsStore;
    this.container = null;
    this.isVisible = false;
  }

  init() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'settings-modal';
    this.container.className = 'studio-hidden';
    this.container.innerHTML = `
      <div class="studio-backdrop"></div>
      <div class="studio-panel settings-panel">
        <div class="studio-header">
          <h3>⚙️ Application Settings</h3>
          <button id="settings-close-btn" title="Close Settings">&times;</button>
        </div>

        <div class="settings-scroll">
          <!-- General Section -->
          <div class="settings-section">
            <span class="studio-label">General</span>
            <label class="checkbox-label">
              <input type="checkbox" id="set-launch-startup">
              🚀 Launch at Windows Startup
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="set-show-charm" checked>
              🖥️ Show Desktop Charm Overlay
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="set-remember-charm" checked>
              💾 Remember Selected Charm
            </label>
          </div>

          <!-- Sound Section -->
          <div class="settings-section">
            <span class="studio-label">Sound & Audio</span>
            <label class="checkbox-label">
              <input type="checkbox" id="set-sounds-enable" checked>
              🔊 Enable Interaction Sound Effects
            </label>
            <div class="slider-group" style="margin-top:6px;">
              <label>Master Volume: <span id="set-val-volume">50</span>%</label>
              <input type="range" id="set-volume-slider" min="0" max="1" step="0.05" value="0.5">
            </div>
          </div>

          <!-- Physics Section -->
          <div class="settings-section">
            <span class="studio-label">Physics Simulation</span>
            <div class="slider-group studio-select-group">
              <label for="set-motion-intensity">Motion Intensity</label>
              <select id="set-motion-intensity">
                <option value="low">Low (Gentle Sways)</option>
                <option value="normal">Normal (Realistic Balance)</option>
                <option value="high">High (Energetic Momentum)</option>
              </select>
            </div>
          </div>

          <!-- Appearance Section -->
          <div class="settings-section">
            <span class="studio-label">Appearance & Visuals</span>
            <div class="slider-group">
              <label>Charm Scale: <span id="set-val-scale">1.0</span>x</label>
              <input type="range" id="set-scale-slider" min="0.6" max="1.6" step="0.05" value="1.0">
            </div>
            <label class="checkbox-label" style="margin-top:6px;">
              <input type="checkbox" id="set-show-beads" checked>
              📿 Show Decorative Beads
            </label>
          </div>

          <!-- About Section -->
          <div class="settings-section about-section">
            <span class="studio-label">About</span>
            <div class="about-card">
              <div class="about-title">Hangly</div>
              <div class="about-ver">Version 1.0.0</div>
              <div class="about-slogan">"A tiny piece of motion for your desktop."</div>
            </div>
          </div>
        </div>

        <div class="settings-actions">
          <button id="set-reset-btn" class="studio-btn-sec">Reset Defaults</button>
          <button id="set-done-btn" class="studio-btn-prim">Done</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = this.container.querySelector('#settings-close-btn');
    const doneBtn = this.container.querySelector('#settings-done-btn');
    const resetBtn = this.container.querySelector('#set-reset-btn');
    const backdrop = this.container.querySelector('.studio-backdrop');

    const hideHandler = () => this.hide();
    closeBtn.addEventListener('click', hideHandler);
    doneBtn.addEventListener('click', hideHandler);
    backdrop.addEventListener('click', hideHandler);

    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all settings to default values? (Your custom charms will NOT be deleted)')) {
        this.store.resetToDefaults();
        this.updateInputsFromStore();
      }
    });

    // Inputs
    const startupChk = this.container.querySelector('#set-launch-startup');
    const showCharmChk = this.container.querySelector('#set-show-charm');
    const rememberChk = this.container.querySelector('#set-remember-charm');
    const soundsChk = this.container.querySelector('#set-sounds-enable');
    const volSlider = this.container.querySelector('#set-volume-slider');
    const motionSel = this.container.querySelector('#set-motion-intensity');
    const scaleSlider = this.container.querySelector('#set-scale-slider');
    const beadsChk = this.container.querySelector('#set-show-beads');

    startupChk.addEventListener('change', (e) => {
      this.store.set('launchAtStartup', e.target.checked);
      if (window.hanglyAPI && window.hanglyAPI.setAutoLaunch) {
        window.hanglyAPI.setAutoLaunch(e.target.checked);
      }
    });

    showCharmChk.addEventListener('change', (e) => this.store.set('showDesktopCharm', e.target.checked));
    rememberChk.addEventListener('change', (e) => this.store.set('rememberCharm', e.target.checked));
    soundsChk.addEventListener('change', (e) => this.store.set('soundsEnabled', e.target.checked));

    volSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.store.set('volume', val);
      this.container.querySelector('#set-val-volume').textContent = Math.round(val * 100);
    });

    motionSel.addEventListener('change', (e) => this.store.set('motionIntensity', e.target.value));

    scaleSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.store.set('charmScale', val);
      this.container.querySelector('#set-val-scale').textContent = val.toFixed(2);
    });

    beadsChk.addEventListener('change', (e) => this.store.set('showBeads', e.target.checked));
  }

  updateInputsFromStore() {
    if (!this.container) return;

    this.container.querySelector('#set-launch-startup').checked = this.store.get('launchAtStartup');
    this.container.querySelector('#set-show-charm').checked = this.store.get('showDesktopCharm');
    this.container.querySelector('#set-remember-charm').checked = this.store.get('rememberCharm');
    this.container.querySelector('#set-sounds-enable').checked = this.store.get('soundsEnabled');

    const vol = this.store.get('volume');
    this.container.querySelector('#set-volume-slider').value = vol;
    this.container.querySelector('#set-val-volume').textContent = Math.round(vol * 100);

    this.container.querySelector('#set-motion-intensity').value = this.store.get('motionIntensity');

    const scale = this.store.get('charmScale');
    this.container.querySelector('#set-scale-slider').value = scale;
    this.container.querySelector('#set-val-scale').textContent = scale.toFixed(2);

    this.container.querySelector('#set-show-beads').checked = this.store.get('showBeads');
  }

  show() {
    this.init();
    this.updateInputsFromStore();
    this.container.classList.remove('studio-hidden');
    this.isVisible = true;
  }

  hide() {
    if (this.container) {
      this.container.classList.add('studio-hidden');
    }
    this.isVisible = false;
  }

  toggle() {
    if (this.isVisible) this.hide();
    else this.show();
  }
}
