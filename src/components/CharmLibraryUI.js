/**
 * CharmLibraryUI - Renders the charm selection grid modal overlay, allowing
 * users to browse by category, preview charms, select active charms,
 * open charms in Charm Studio for customization, and import or delete custom charms.
 */
export class CharmLibraryUI {
  /**
   * @param {import('../charms/CharmLibrary.js').CharmLibrary} library 
   * @param {Function} onSelect Callback when user selects a new charm
   * @param {Function} [onEditStudio] Callback to open a charm in Charm Studio
   */
  constructor(library, onSelect, onEditStudio) {
    this.library = library;
    this.onSelect = onSelect;
    this.onEditStudio = onEditStudio;
    this.container = null;
    this.isVisible = false;
    this.activeCategory = 'All';
  }

  init() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'charm-library-modal';
    this.container.className = 'studio-hidden';
    this.container.innerHTML = `
      <div class="studio-backdrop"></div>
      <div class="studio-panel lib-panel">
        <div class="studio-header">
          <h3>💎 Charm Library</h3>
          <button id="lib-close-btn" title="Close Library">&times;</button>
        </div>

        <!-- Add Custom Charm Button -->
        <div class="lib-actions">
          <button id="lib-add-custom-btn" class="add-custom-btn">
            ➕ Add Custom Charm
          </button>
        </div>

        <!-- Category Filters -->
        <div class="lib-categories" id="lib-category-filters">
          <button class="cat-btn active" data-cat="All">All</button>
          <button class="cat-btn" data-cat="Custom">Custom</button>
          <button class="cat-btn" data-cat="Metallic">Metallic</button>
          <button class="cat-btn" data-cat="Gems">Gems</button>
          <button class="cat-btn" data-cat="Celestial">Celestial</button>
          <button class="cat-btn" data-cat="Nature">Nature</button>
        </div>

        <!-- Charm Grid -->
        <div class="lib-grid-scroll">
          <div class="lib-grid" id="lib-charm-grid"></div>
        </div>

        <div class="studio-footer">
          <button id="lib-done-btn">Done</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
    this.bindEvents();
    this.renderGrid();
  }

  bindEvents() {
    const closeBtn = this.container.querySelector('#lib-close-btn');
    const doneBtn = this.container.querySelector('#lib-done-btn');
    const backdrop = this.container.querySelector('.studio-backdrop');
    const addCustomBtn = this.container.querySelector('#lib-add-custom-btn');

    const hideHandler = () => this.hide();
    closeBtn.addEventListener('click', hideHandler);
    doneBtn.addEventListener('click', hideHandler);
    backdrop.addEventListener('click', hideHandler);

    // Native file picker custom charm import (or web file input fallback)
    addCustomBtn.addEventListener('click', async () => {
      if (window.hanglyAPI && window.hanglyAPI.selectCharmFile) {
        const result = await window.hanglyAPI.selectCharmFile();
        if (result && result.dataUrl) {
          const charm = await this.library.addCustomCharm(result.name, result.dataUrl);
          this.activeCategory = 'Custom';
          this.renderGrid();
          if (typeof this.onSelect === 'function') {
            this.onSelect(charm);
          }
        }
      } else {
        // Fallback for web browser environment (Vercel deployment)
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
            this.renderGrid();
            if (typeof this.onSelect === 'function') {
              this.onSelect(charm);
            }
          };
          reader.readAsDataURL(file);
        };
        input.click();
      }
    });

    // Category filter buttons
    const catBtns = this.container.querySelectorAll('.cat-btn');
    catBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        catBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCategory = btn.getAttribute('data-cat');
        this.renderGrid();
      });
    });
  }

  renderGrid() {
    const gridEl = this.container.querySelector('#lib-charm-grid');
    if (!gridEl) return;

    gridEl.innerHTML = '';
    const allCharms = this.library.getAllCharms();
    const activeCharm = this.library.getActiveCharm();

    const filtered = allCharms.filter(c => {
      if (this.activeCategory === 'All') return true;
      return c.category === this.activeCategory;
    });

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-msg">
          <p style="margin:0 0 4px 0; font-weight:500;">No ${this.activeCategory.toLowerCase()} charms found</p>
          ${this.activeCategory === 'Custom' ? '<p style="margin:0; font-size:10px; color:#A1A1A6;">Click "➕ Add Custom Charm" to import your own image!</p>' : ''}
        </div>`;
      return;
    }

    filtered.forEach(charm => {
      const isSelected = (charm.id === activeCharm.id);
      const isCustom = Boolean(charm.isCustom);
      const card = document.createElement('div');
      card.className = `lib-card ${isSelected ? 'selected' : ''} ${isCustom ? 'is-custom' : ''}`;
      card.setAttribute('data-id', charm.id);

      card.innerHTML = `
        <div class="lib-card-preview">
          <img src="${charm.getPreviewDataURL()}" alt="${charm.name}" />
          ${isSelected ? '<span class="check-badge">✓</span>' : ''}
          ${isCustom ? `<button class="delete-charm-btn" data-id="${charm.id}" title="Delete Custom Charm">🗑️</button>` : ''}
          <button class="edit-studio-btn" data-id="${charm.id}" title="Edit in Charm Studio">✏️</button>
        </div>
        <span class="lib-card-title" title="${charm.name}">${charm.name}</span>
      `;

      // Select charm click handler
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-charm-btn') || e.target.classList.contains('edit-studio-btn')) return;
        this.library.setActiveCharm(charm.id);
        this.renderGrid();
        if (typeof this.onSelect === 'function') {
          this.onSelect(charm);
        }
      });

      // Edit in Studio button handler
      const editBtn = card.querySelector('.edit-studio-btn');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetCharm = this.library.getCharm(charm.id);
          this.hide();
          if (typeof this.onEditStudio === 'function') {
            this.onEditStudio(targetCharm);
          }
        });
      }

      // Delete custom charm click handler
      if (isCustom) {
        const deleteBtn = card.querySelector('.delete-charm-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!confirm(`Are you sure you want to delete "${charm.name}"?`)) {
              return;
            }
            const charmId = deleteBtn.getAttribute('data-id');
            const currentActive = this.library.getActiveCharm();

            this.library.removeCustomCharm(charmId);
            this.renderGrid();

            const newActive = this.library.getActiveCharm();
            if (typeof this.onSelect === 'function' && currentActive.id !== newActive.id) {
              this.onSelect(newActive);
            }
          });
        }
      }

      gridEl.appendChild(card);
    });
  }

  show() {
    this.init();
    this.renderGrid();
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
