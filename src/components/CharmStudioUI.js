/**
 * CharmStudioUI - Renders the interactive Charm Studio panel where users can
 * preview, adjust (scale, rotation, offsets, opacity, image fit), reset, and save
 * non-destructive customized versions of built-in or custom charms.
 */
export class CharmStudioUI {
  /**
   * @param {import('../charms/CharmLibrary.js').CharmLibrary} library 
   * @param {Function} onSave Callback when user saves a customized charm
   */
  constructor(library, onSave) {
    this.library = library;
    this.onSave = onSave;
    this.container = null;
    this.isVisible = false;
    this.sourceCharm = null;

    // Default adjustment settings
    this.settings = {
      scale: 1.0,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      opacity: 1.0,
      imageFit: 'contain'
    };

    this.animFrameId = null;
  }

  /**
   * Open Charm Studio with target charm loaded for editing
   * @param {import('../models/Charm.js').Charm} charm 
   */
  openWithCharm(charm) {
    this.sourceCharm = charm || this.library.getActiveCharm();

    // Load existing settings if editing a previously customized charm, otherwise reset
    if (this.sourceCharm.settings) {
      this.settings = { ...this.sourceCharm.settings };
    } else {
      this.resetSettings();
    }

    this.show();
    this.updateControlsFromSettings();
    this.startPreviewLoop();
  }

  resetSettings() {
    this.settings = {
      scale: 1.0,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      opacity: 1.0,
      imageFit: 'contain'
    };
  }

  init() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'charm-studio-modal';
    this.container.className = 'studio-hidden';
    this.container.innerHTML = `
      <div class="studio-backdrop"></div>
      <div class="studio-panel studio-editor-panel">
        <div class="studio-header">
          <h3>✨ Charm Studio</h3>
          <button id="studio-close-btn" title="Close Studio">&times;</button>
        </div>

        <!-- Live Preview Canvas -->
        <div class="studio-preview-box">
          <canvas id="studio-preview-canvas" width="220" height="150"></canvas>
          <span class="studio-preview-label">Live Preview</span>
        </div>

        <!-- Adjustment Controls -->
        <div class="studio-controls">
          <div class="slider-group">
            <label>Scale: <span id="studio-val-scale">1.0</span>x</label>
            <input type="range" id="studio-scale" min="0.5" max="2.0" step="0.05" value="1.0">
          </div>

          <div class="slider-group">
            <label>Rotation: <span id="studio-val-rot">0</span>°</label>
            <input type="range" id="studio-rot" min="-180" max="180" step="1" value="0">
          </div>

          <div class="slider-group">
            <label>Position X: <span id="studio-val-offx">0</span>px</label>
            <input type="range" id="studio-offx" min="-30" max="30" step="1" value="0">
          </div>

          <div class="slider-group">
            <label>Position Y: <span id="studio-val-offy">0</span>px</label>
            <input type="range" id="studio-offy" min="-30" max="30" step="1" value="0">
          </div>

          <div class="slider-group">
            <label>Opacity: <span id="studio-val-opac">100</span>%</label>
            <input type="range" id="studio-opac" min="0.1" max="1.0" step="0.05" value="1.0">
          </div>

          <div class="slider-group studio-select-group">
            <label for="studio-fit">Image Fit</label>
            <select id="studio-fit">
              <option value="contain">Contain (Fit inside circle)</option>
              <option value="cover">Cover (Fill charm area)</option>
              <option value="original">Original Aspect Ratio</option>
            </select>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="studio-actions-row">
          <button id="studio-reset-btn" class="studio-btn-sec">Reset</button>
          <button id="studio-cancel-btn" class="studio-btn-sec">Cancel</button>
          <button id="studio-save-btn" class="studio-btn-prim">Save Charm</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = this.container.querySelector('#studio-close-btn');
    const cancelBtn = this.container.querySelector('#studio-cancel-btn');
    const resetBtn = this.container.querySelector('#studio-reset-btn');
    const saveBtn = this.container.querySelector('#studio-save-btn');
    const backdrop = this.container.querySelector('.studio-backdrop');

    const hideHandler = () => this.hide();
    closeBtn.addEventListener('click', hideHandler);
    cancelBtn.addEventListener('click', hideHandler);
    backdrop.addEventListener('click', hideHandler);

    resetBtn.addEventListener('click', () => {
      this.resetSettings();
      this.updateControlsFromSettings();
    });

    saveBtn.addEventListener('click', () => {
      this.saveCharm();
    });

    // Slider inputs
    const scaleInput = this.container.querySelector('#studio-scale');
    const rotInput = this.container.querySelector('#studio-rot');
    const offXInput = this.container.querySelector('#studio-offx');
    const offYInput = this.container.querySelector('#studio-offy');
    const opacInput = this.container.querySelector('#studio-opac');
    const fitSelect = this.container.querySelector('#studio-fit');

    scaleInput.addEventListener('input', (e) => {
      this.settings.scale = parseFloat(e.target.value);
      this.container.querySelector('#studio-val-scale').textContent = this.settings.scale.toFixed(2);
    });

    rotInput.addEventListener('input', (e) => {
      this.settings.rotation = parseInt(e.target.value, 10);
      this.container.querySelector('#studio-val-rot').textContent = this.settings.rotation;
    });

    offXInput.addEventListener('input', (e) => {
      this.settings.offsetX = parseInt(e.target.value, 10);
      this.container.querySelector('#studio-val-offx').textContent = this.settings.offsetX;
    });

    offYInput.addEventListener('input', (e) => {
      this.settings.offsetY = parseInt(e.target.value, 10);
      this.container.querySelector('#studio-val-offy').textContent = this.settings.offsetY;
    });

    opacInput.addEventListener('input', (e) => {
      this.settings.opacity = parseFloat(e.target.value);
      this.container.querySelector('#studio-val-opac').textContent = Math.round(this.settings.opacity * 100);
    });

    fitSelect.addEventListener('change', (e) => {
      this.settings.imageFit = e.target.value;
    });
  }

  updateControlsFromSettings() {
    if (!this.container) return;

    this.container.querySelector('#studio-scale').value = this.settings.scale;
    this.container.querySelector('#studio-val-scale').textContent = this.settings.scale.toFixed(2);

    this.container.querySelector('#studio-rot').value = this.settings.rotation;
    this.container.querySelector('#studio-val-rot').textContent = this.settings.rotation;

    this.container.querySelector('#studio-offx').value = this.settings.offsetX;
    this.container.querySelector('#studio-val-offx').textContent = this.settings.offsetX;

    this.container.querySelector('#studio-offy').value = this.settings.offsetY;
    this.container.querySelector('#studio-val-offy').textContent = this.settings.offsetY;

    this.container.querySelector('#studio-opac').value = this.settings.opacity;
    this.container.querySelector('#studio-val-opac').textContent = Math.round(this.settings.opacity * 100);

    this.container.querySelector('#studio-fit').value = this.settings.imageFit || 'contain';
  }

  startPreviewLoop() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const canvas = this.container.querySelector('#studio-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const renderPreview = () => {
      if (!this.isVisible) return;

      const w = canvas.width;
      const h = canvas.height;
      const anchorX = w / 2;
      const anchorY = 15;
      const charmY = 100;
      const radius = 24;

      ctx.clearRect(0, 0, w, h);

      // Render top anchor pin
      ctx.save();
      ctx.beginPath();
      ctx.arc(anchorX, anchorY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#2C2C2E';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#8E8E93';
      ctx.stroke();

      // Render short rope segment
      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY);
      ctx.lineTo(anchorX, charmY);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#4A4036';
      ctx.stroke();

      // Attachment Ring
      ctx.beginPath();
      ctx.arc(anchorX, charmY - radius, 4, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#8E8E93';
      ctx.stroke();

      // Render Charm with Live Adjustment Settings applied
      ctx.translate(anchorX, charmY);

      if (this.sourceCharm) {
        ctx.save();
        ctx.globalAlpha = this.settings.opacity;
        ctx.translate(this.settings.offsetX, this.settings.offsetY);
        ctx.rotate((this.settings.rotation * Math.PI) / 180);
        ctx.scale(this.settings.scale, this.settings.scale);

        try {
          this.sourceCharm.render(ctx, radius, false);
        } catch (err) {
          console.error('Error in studio preview render:', err);
        }

        ctx.restore();
      }

      ctx.restore();

      this.animFrameId = requestAnimationFrame(renderPreview);
    };

    renderPreview();
  }

  saveCharm() {
    if (!this.sourceCharm) return;

    try {
      const defaultName = `Custom ${this.sourceCharm.name}`;
      const name = prompt('Enter a name for your customized charm:', defaultName) || defaultName;

      const newCharm = this.library.saveCustomizedCharm(name, this.sourceCharm, { ...this.settings });

      if (typeof this.onSave === 'function') {
        this.onSave(newCharm);
      }

      this.hide();
    } catch (err) {
      alert(`Failed to save customized charm: ${err.message}`);
    }
  }

  show() {
    this.init();
    this.container.classList.remove('studio-hidden');
    this.isVisible = true;
  }

  hide() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.container) {
      this.container.classList.add('studio-hidden');
    }
    this.isVisible = false;
  }

  toggle() {
    if (this.isVisible) this.hide();
    else this.openWithCharm(this.library.getActiveCharm());
  }
}
