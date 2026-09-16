/**
 * WebUI - Web application orchestrator managing SPA routing (/ , /charm-library,
 * /charm-studio, /settings), top header navigation, responsive layout panels,
 * selected charm hero card, and live web controls.
 */
export class WebUI {
  /**
   * @param {import('../components/hangingObject.js').HangingObject} hangingObject 
   * @param {import('../physics/RopeSimulation.js').RopeSimulation} ropeSimulation 
   * @param {import('../services/AudioService.js').AudioService} audioService 
   * @param {import('../services/SettingsStore.js').SettingsStore} settingsStore 
   * @param {import('../components/CharmStudioUI.js').CharmStudioUI} charmStudioUI 
   * @param {import('../components/CharmLibraryUI.js').CharmLibraryUI} charmLibraryUI 
   * @param {import('../views/SettingsView.js').SettingsView} settingsView 
   */
  constructor(hangingObject, ropeSimulation, audioService, settingsStore, charmStudioUI, charmLibraryUI, settingsView) {
    this.hangingObject = hangingObject;
    this.library = hangingObject.charmLibrary;
    this.ropeSimulation = ropeSimulation;
    this.audioService = audioService;
    this.settingsStore = settingsStore;
    this.charmStudioUI = charmStudioUI;
    this.charmLibraryUI = charmLibraryUI;
    this.settingsView = settingsView;

    this.activeRoute = '/';
    this.activeCategory = 'All';

    // Studio editing state in Web UI
    this.studioSettings = {
      scale: 1.0,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      opacity: 1.0,
      imageFit: 'contain'
    };
  }

  init() {
    // Only run Web UI when running in a web browser (not in Electron overlay)
    if (window.hanglyAPI) return;

    this.setupHeaderAndLayout();
    this.bindEvents();
    this.handleInitialRoute();
    this.updateHeroCard();
  }

  setupHeaderAndLayout() {
    // Inject web wrapper structure if not already present
    const appWrapper = document.getElementById('web-app-wrapper');
    if (!appWrapper) return;

    appWrapper.innerHTML = `
      <!-- Header Bar -->
      <header class="web-header">
        <div class="web-brand" id="nav-brand">
          <span class="brand-icon">💎</span>
          <span class="brand-title">Hangly</span>
        </div>

        <nav class="web-nav">
          <button class="nav-link active" data-route="/">Home</button>
          <button class="nav-link" data-route="/charm-library">Charm Library</button>
          <button class="nav-link" data-route="/charm-studio">Charm Studio</button>
          <button class="nav-link" data-route="/settings">Settings</button>
        </nav>
      </header>

      <!-- Main Layout Split -->
      <main class="web-main">
        <!-- Canvas Physics Section -->
        <section class="web-canvas-section">
          <div class="canvas-card">
            <div id="canvas-container"></div>
            <button id="fix-charm-btn" class="fix-charm-btn">FIX CHARM</button>
            <div class="canvas-hint">Drag or throw the hanging charm</div>
          </div>

          <!-- Hero Card (Selected Charm) -->
          <div class="hero-charm-card" id="web-hero-card">
            <!-- Rendered dynamically -->
          </div>
        </section>

        <!-- Dynamic Route View Panel -->
        <section class="web-panel-section" id="web-panel-view">
          <!-- Rendered dynamically based on activeRoute -->
        </section>
      </main>
    `;

    // Move existing overlay canvas inside canvas-container
    const canvasContainer = document.getElementById('canvas-container');
    const canvas = document.getElementById('overlay-canvas');
    if (canvasContainer && canvas) {
      canvasContainer.appendChild(canvas);
    }

    this.updateFixButtonState();
  }

  bindEvents() {
    // Navigation link clicks
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const route = e.currentTarget.getAttribute('data-route');
        this.navigate(route);
      });
    });

    // FIX / UNFIX CHARM Button click handler
    const fixBtn = document.getElementById('fix-charm-btn');
    if (fixBtn) {
      fixBtn.addEventListener('click', () => this.toggleFixCharm());
    }

    // Brand click navigates home
    const brand = document.getElementById('nav-brand');
    if (brand) {
      brand.addEventListener('click', () => this.navigate('/'));
    }

    // Handle browser back/forward history navigation
    window.addEventListener('popstate', () => {
      this.handleInitialRoute();
    });

    // Update hero card when settings or selected charm changes
    this.settingsStore.onChange(() => {
      this.updateHeroCard();
    });
  }

  toggleFixCharm() {
    const btn = document.getElementById('fix-charm-btn');
    const bottomPoint = this.ropeSimulation.getBottomPoint();

    if (this.ropeSimulation.isFixed) {
      // Unfix charm
      this.ropeSimulation.isFixed = false;
      if (bottomPoint) bottomPoint.pinned = false;
      this.ropeSimulation.isDraggingCharm = false;
      if (btn) {
        btn.textContent = 'FIX CHARM';
        btn.classList.remove('is-fixed');
      }
      this.audioService.playRelease(300);
      this.ropeSimulation.wakeUp();
    } else {
      // Fix charm at current position
      this.ropeSimulation.isFixed = true;
      if (bottomPoint) {
        this.ropeSimulation.fixedX = bottomPoint.x;
        this.ropeSimulation.fixedY = bottomPoint.y;
        bottomPoint.pinned = true;
      }
      if (btn) {
        btn.textContent = 'UNFIX CHARM';
        btn.classList.add('is-fixed');
      }
      this.audioService.playGrab();
    }
  }

  updateFixButtonState() {
    const btn = document.getElementById('fix-charm-btn');
    if (!btn) return;
    if (this.ropeSimulation.isFixed) {
      btn.textContent = 'UNFIX CHARM';
      btn.classList.add('is-fixed');
    } else {
      btn.textContent = 'FIX CHARM';
      btn.classList.remove('is-fixed');
    }
  }

  handleInitialRoute() {
    let path = window.location.pathname;
    if (path.endsWith('.html')) path = '/';
    if (!['/', '/charm-library', '/charm-studio', '/settings'].includes(path)) {
      path = '/';
    }
    this.navigate(path, false);
  }

  navigate(route, pushHistory = true) {
    this.activeRoute = route;

    if (pushHistory && window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }

    // Update active nav button
    document.querySelectorAll('.nav-link').forEach(btn => {
      const r = btn.getAttribute('data-route');
      if (r === route) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    this.renderPanel();
    this.updateHeroCard();
    this.updateFixButtonState();
  }

  updateHeroCard() {
    const heroCard = document.getElementById('web-hero-card');
    if (!heroCard) return;

    const charm = this.library.getActiveCharm();
    if (!charm) return;

    heroCard.innerHTML = `
      <div class="hero-left">
        <div class="hero-preview-circle">
          <img src="${charm.getPreviewDataURL()}" alt="${charm.name}" />
        </div>
        <div class="hero-info">
          <span class="hero-badge">Selected Charm</span>
          <h3 class="hero-title">${charm.name}</h3>
          <span class="hero-category">Category: ${charm.category || 'Classic'}</span>
        </div>
      </div>
      <div class="hero-actions">
        <button class="hero-btn-sec" id="hero-open-lib">Browse Library</button>
        <button class="hero-btn-prim" id="hero-edit-studio">Edit in Studio</button>
      </div>
    `;

    heroCard.querySelector('#hero-open-lib').addEventListener('click', () => this.navigate('/charm-library'));
    heroCard.querySelector('#hero-edit-studio').addEventListener('click', () => this.navigate('/charm-studio'));
  }

  renderPanel() {
    const panel = document.getElementById('web-panel-view');
    if (!panel) return;

    if (this.activeRoute === '/charm-library') {
      this.renderCharmLibraryPanel(panel);
    } else if (this.activeRoute === '/charm-studio') {
      this.renderCharmStudioPanel(panel);
    } else if (this.activeRoute === '/settings') {
      this.renderSettingsPanel(panel);
    } else {
      this.renderHomeOverviewPanel(panel);
    }
  }

  renderHomeOverviewPanel(container) {
    const allCharms = this.library.getAllCharms();
    const activeCharm = this.library.getActiveCharm();

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <h3>💎 Quick Charm Selection</h3>
          <button class="panel-link-btn" id="view-all-charms">View All (${allCharms.length})</button>
        </div>
        <div class="charm-quick-grid">
          ${allCharms.slice(0, 6).map(c => `
            <div class="quick-charm-item ${c.id === activeCharm.id ? 'active' : ''}" data-id="${c.id}">
              <img src="${c.getPreviewDataURL()}" alt="${c.name}" />
              <span>${c.name}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="panel-card" style="margin-top: 14px;">
        <div class="panel-header">
          <h3>⚡ Quick Settings</h3>
        </div>
        <div class="quick-settings-list">
          <label class="checkbox-label">
            <input type="checkbox" id="web-quick-beads" ${this.settingsStore.get('showBeads') ? 'checked' : ''}>
            Show Decorative Beads
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="web-quick-sounds" ${this.settingsStore.get('soundsEnabled') ? 'checked' : ''}>
            Enable Sound Effects
          </label>
        </div>
      </div>
    `;

    container.querySelector('#view-all-charms').addEventListener('click', () => this.navigate('/charm-library'));

    container.querySelectorAll('.quick-charm-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        this.library.setActiveCharm(id);
        this.audioService.playGrab();
        this.ropeSimulation.wakeUp();
        this.renderHomeOverviewPanel(container);
        this.updateHeroCard();
      });
    });

    container.querySelector('#web-quick-beads').addEventListener('change', (e) => {
      this.settingsStore.set('showBeads', e.target.checked);
    });
    container.querySelector('#web-quick-sounds').addEventListener('change', (e) => {
      this.settingsStore.set('soundsEnabled', e.target.checked);
    });
  }

  renderCharmLibraryPanel(container) {
    const allCharms = this.library.getAllCharms();
    const activeCharm = this.library.getActiveCharm();

    const filtered = allCharms.filter(c => {
      if (this.activeCategory === 'All') return true;
      return c.category === this.activeCategory;
    });

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <h3>💎 Charm Library</h3>
          <button class="add-custom-btn-web" id="web-add-custom-btn">➕ Add Custom Charm</button>
        </div>

        <!-- Categories -->
        <div class="lib-categories" style="margin-top: 10px;">
          ${['All', 'Custom', 'Metallic', 'Gems', 'Celestial', 'Nature'].map(cat => `
            <button class="cat-btn ${cat === this.activeCategory ? 'active' : ''}" data-cat="${cat}">${cat}</button>
          `).join('')}
        </div>

        <!-- Grid -->
        <div class="web-grid-scroll">
          <div class="lib-grid">
            ${filtered.length === 0 ? `
              <div class="empty-msg">
                <p>No ${this.activeCategory.toLowerCase()} charms found</p>
                ${this.activeCategory === 'Custom' ? '<p style="font-size:10px; color:#A1A1A6;">Click "➕ Add Custom Charm" to upload your own photo!</p>' : ''}
              </div>
            ` : filtered.map(c => `
              <div class="lib-card ${c.id === activeCharm.id ? 'selected' : ''} ${c.isCustom ? 'is-custom' : ''}" data-id="${c.id}">
                <div class="lib-card-preview">
                  <img src="${c.getPreviewDataURL()}" alt="${c.name}" />
                  ${c.id === activeCharm.id ? '<span class="check-badge">✓</span>' : ''}
                  ${c.isCustom ? `<button class="delete-charm-btn" data-id="${c.id}" title="Delete Custom Charm">🗑️</button>` : ''}
                  <button class="edit-studio-btn" data-id="${c.id}" title="Edit in Studio">✏️</button>
                </div>
                <span class="lib-card-title" title="${c.name}">${c.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Category filter buttons
    container.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeCategory = btn.getAttribute('data-cat');
        this.renderCharmLibraryPanel(container);
      });
    });

    // Add Custom Charm File Picker
    container.querySelector('#web-add-custom-btn').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png, image/jpeg, image/jpg, image/webp';
      input.onchange = (evt) => {
        const file = evt.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target.result;
          const name = file.name.replace(/\.[^/.]+$/, '');
          const charm = await this.library.addCustomCharm(name, dataUrl);
          this.activeCategory = 'Custom';
          this.audioService.playGrab();
          this.ropeSimulation.wakeUp();
          this.renderCharmLibraryPanel(container);
          this.updateHeroCard();
        };
        reader.readAsDataURL(file);
      };
      input.click();
    });

    // Card click events
    container.querySelectorAll('.lib-card').forEach(card => {
      const id = card.getAttribute('data-id');
      const targetCharm = this.library.getCharm(id);

      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-charm-btn') || e.target.classList.contains('edit-studio-btn')) return;
        this.library.setActiveCharm(id);
        this.audioService.playGrab();
        this.ropeSimulation.wakeUp();
        this.renderCharmLibraryPanel(container);
        this.updateHeroCard();
      });

      const editBtn = card.querySelector('.edit-studio-btn');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.navigate('/charm-studio');
        });
      }

      const deleteBtn = card.querySelector('.delete-charm-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`Are you sure you want to delete "${targetCharm.name}"?`)) {
            this.library.removeCustomCharm(id);
            this.renderCharmLibraryPanel(container);
            this.updateHeroCard();
          }
        });
      }
    });
  }

  renderCharmStudioPanel(container) {
    const activeCharm = this.library.getActiveCharm();
    if (activeCharm.settings) {
      this.studioSettings = { ...activeCharm.settings };
    }

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <h3>✨ Charm Studio</h3>
          <span class="studio-charm-name">${activeCharm.name}</span>
        </div>

        <div class="studio-controls-web">
          <div class="slider-group">
            <label>Scale: <span id="web-val-scale">${(this.studioSettings.scale || 1.0).toFixed(2)}</span>x</label>
            <input type="range" id="web-scale" min="0.5" max="2.0" step="0.05" value="${this.studioSettings.scale || 1.0}">
          </div>

          <div class="slider-group">
            <label>Rotation: <span id="web-val-rot">${this.studioSettings.rotation || 0}</span>°</label>
            <input type="range" id="web-rot" min="-180" max="180" step="1" value="${this.studioSettings.rotation || 0}">
          </div>

          <div class="slider-group">
            <label>Position X: <span id="web-val-offx">${this.studioSettings.offsetX || 0}</span>px</label>
            <input type="range" id="web-offx" min="-30" max="30" step="1" value="${this.studioSettings.offsetX || 0}">
          </div>

          <div class="slider-group">
            <label>Position Y: <span id="web-val-offy">${this.studioSettings.offsetY || 0}</span>px</label>
            <input type="range" id="web-offy" min="-30" max="30" step="1" value="${this.studioSettings.offsetY || 0}">
          </div>

          <div class="slider-group">
            <label>Opacity: <span id="web-val-opac">${Math.round((this.studioSettings.opacity || 1.0) * 100)}</span>%</label>
            <input type="range" id="web-opac" min="0.1" max="1.0" step="0.05" value="${this.studioSettings.opacity || 1.0}">
          </div>

          <div class="slider-group studio-select-group">
            <label for="web-fit">Image Fit</label>
            <select id="web-fit">
              <option value="contain" ${this.studioSettings.imageFit === 'contain' ? 'selected' : ''}>Contain (Fit inside circle)</option>
              <option value="cover" ${this.studioSettings.imageFit === 'cover' ? 'selected' : ''}>Cover (Fill charm area)</option>
              <option value="original" ${this.studioSettings.imageFit === 'original' ? 'selected' : ''}>Original Aspect Ratio</option>
            </select>
          </div>
        </div>

        <div class="studio-actions-row" style="margin-top: 14px;">
          <button id="web-studio-reset" class="studio-btn-sec">Reset</button>
          <button id="web-studio-save" class="studio-btn-prim">Save Charm</button>
        </div>
      </div>
    `;

    // Bind Sliders
    const scaleInput = container.querySelector('#web-scale');
    const rotInput = container.querySelector('#web-rot');
    const offXInput = container.querySelector('#web-offx');
    const offYInput = container.querySelector('#web-offy');
    const opacInput = container.querySelector('#web-opac');
    const fitSelect = container.querySelector('#web-fit');

    scaleInput.addEventListener('input', (e) => {
      this.studioSettings.scale = parseFloat(e.target.value);
      container.querySelector('#web-val-scale').textContent = this.studioSettings.scale.toFixed(2);
      activeCharm.settings = { ...this.studioSettings };
      this.ropeSimulation.wakeUp();
    });

    rotInput.addEventListener('input', (e) => {
      this.studioSettings.rotation = parseInt(e.target.value, 10);
      container.querySelector('#web-val-rot').textContent = this.studioSettings.rotation;
      activeCharm.settings = { ...this.studioSettings };
      this.ropeSimulation.wakeUp();
    });

    offXInput.addEventListener('input', (e) => {
      this.studioSettings.offsetX = parseInt(e.target.value, 10);
      container.querySelector('#web-val-offx').textContent = this.studioSettings.offsetX;
      activeCharm.settings = { ...this.studioSettings };
      this.ropeSimulation.wakeUp();
    });

    offYInput.addEventListener('input', (e) => {
      this.studioSettings.offsetY = parseInt(e.target.value, 10);
      container.querySelector('#web-val-offy').textContent = this.studioSettings.offsetY;
      activeCharm.settings = { ...this.studioSettings };
      this.ropeSimulation.wakeUp();
    });

    opacInput.addEventListener('input', (e) => {
      this.studioSettings.opacity = parseFloat(e.target.value);
      container.querySelector('#web-val-opac').textContent = Math.round(this.studioSettings.opacity * 100);
      activeCharm.settings = { ...this.studioSettings };
      this.ropeSimulation.wakeUp();
    });

    fitSelect.addEventListener('change', (e) => {
      this.studioSettings.imageFit = e.target.value;
      activeCharm.settings = { ...this.studioSettings };
      this.ropeSimulation.wakeUp();
    });

    container.querySelector('#web-studio-reset').addEventListener('click', () => {
      this.studioSettings = { scale: 1.0, rotation: 0, offsetX: 0, offsetY: 0, opacity: 1.0, imageFit: 'contain' };
      this.renderCharmStudioPanel(container);
    });

    container.querySelector('#web-studio-save').addEventListener('click', () => {
      const defaultName = `Custom ${activeCharm.name}`;
      const name = prompt('Enter a name for your customized charm:', defaultName) || defaultName;
      const newCharm = this.library.saveCustomizedCharm(name, activeCharm, { ...this.studioSettings });
      this.library.setActiveCharm(newCharm.id);
      this.audioService.playGrab();
      this.ropeSimulation.wakeUp();
      this.navigate('/charm-library');
    });
  }

  renderSettingsPanel(container) {
    const s = this.settingsStore.settings;

    container.innerHTML = `
      <div class="panel-card">
        <div class="panel-header">
          <h3>⚙️ Application Settings</h3>
        </div>

        <div class="settings-list-web">
          <div class="settings-section">
            <span class="studio-label">Sound & Audio</span>
            <label class="checkbox-label">
              <input type="checkbox" id="web-set-sounds" ${s.soundsEnabled ? 'checked' : ''}>
              Enable Interaction Sound Effects
            </label>
            <div class="slider-group" style="margin-top:6px;">
              <label>Master Volume: <span id="web-val-vol">${Math.round(s.volume * 100)}</span>%</label>
              <input type="range" id="web-set-vol" min="0" max="1" step="0.05" value="${s.volume}">
            </div>
          </div>

          <div class="settings-section">
            <span class="studio-label">Physics Simulation</span>
            <div class="slider-group studio-select-group">
              <label for="web-set-motion">Motion Intensity</label>
              <select id="web-set-motion">
                <option value="low" ${s.motionIntensity === 'low' ? 'selected' : ''}>Low (Gentle Sways)</option>
                <option value="normal" ${s.motionIntensity === 'normal' ? 'selected' : ''}>Normal (Realistic Balance)</option>
                <option value="high" ${s.motionIntensity === 'high' ? 'selected' : ''}>High (Energetic Momentum)</option>
              </select>
            </div>
          </div>

          <div class="settings-section">
            <span class="studio-label">Appearance & Visuals</span>
            <div class="slider-group">
              <label>Charm Scale: <span id="web-val-scale">${s.charmScale.toFixed(2)}</span>x</label>
              <input type="range" id="web-set-scale" min="0.6" max="1.6" step="0.05" value="${s.charmScale}">
            </div>
            <label class="checkbox-label" style="margin-top:6px;">
              <input type="checkbox" id="web-set-beads" ${s.showBeads ? 'checked' : ''}>
              Show Decorative Beads
            </label>
          </div>

          <div class="settings-section about-section">
            <span class="studio-label">About</span>
            <div class="about-card">
              <div class="about-title">Hangly Web App</div>
              <div class="about-ver">Version 1.0.0</div>
              <div class="about-slogan">"A tiny piece of motion for your desktop and browser."</div>
            </div>
          </div>
        </div>

        <div class="settings-actions" style="margin-top: 14px;">
          <button id="web-set-reset" class="studio-btn-sec">Reset Defaults</button>
        </div>
      </div>
    `;

    container.querySelector('#web-set-sounds').addEventListener('change', (e) => this.settingsStore.set('soundsEnabled', e.target.checked));
    container.querySelector('#web-set-vol').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.settingsStore.set('volume', val);
      container.querySelector('#web-val-vol').textContent = Math.round(val * 100);
    });

    container.querySelector('#web-set-motion').addEventListener('change', (e) => this.settingsStore.set('motionIntensity', e.target.value));

    container.querySelector('#web-set-scale').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.settingsStore.set('charmScale', val);
      container.querySelector('#web-val-scale').textContent = val.toFixed(2);
    });

    container.querySelector('#web-set-beads').addEventListener('change', (e) => this.settingsStore.set('showBeads', e.target.checked));

    container.querySelector('#web-set-reset').addEventListener('click', () => {
      if (confirm('Reset all settings to default values?')) {
        this.settingsStore.resetToDefaults();
        this.renderSettingsPanel(container);
        this.updateHeroCard();
      }
    });
  }
}
