import { Charm } from '../models/Charm.js';

/**
 * CustomCharmStore - Handles local persistence, processing, resizing,
 * and non-destructive customized charm profile generation.
 */
export class CustomCharmStore {
  constructor() {
    this.STORAGE_KEY = 'hangly_custom_charms';
    this.customCharmsMap = new Map();
    this.imageCache = new Map();
    this.loadCustomCharms();
  }

  /**
   * Load saved custom charms from localStorage
   * @returns {Charm[]}
   */
  loadCustomCharms() {
    this.customCharmsMap.clear();
    try {
      const json = localStorage.getItem(this.STORAGE_KEY);
      if (json) {
        const rawList = JSON.parse(json);
        if (Array.isArray(rawList)) {
          rawList.forEach(item => {
            if (item.sourceCharmId && item.settings) {
              // Customized charm profile referencing a source charm
              const charm = this.createCustomizedCharmModel(
                item.id,
                item.name,
                item.sourceCharmId,
                item.settings,
                item.dataUrl
              );
              this.customCharmsMap.set(charm.id, charm);
            } else {
              // Standard custom imported image charm
              const charm = this.createCustomCharmModel(item.id, item.name, item.dataUrl);
              this.customCharmsMap.set(charm.id, charm);
            }
          });
        }
      }
    } catch (err) {
      console.warn('Failed to load custom charms from localStorage:', err);
    }
    return Array.from(this.customCharmsMap.values());
  }

  /**
   * Add a new custom imported image charm
   * @param {string} name 
   * @param {string} dataUrl 
   * @returns {Promise<Charm>}
   */
  async addCustomCharm(name, dataUrl) {
    const resizedDataUrl = await this.resizeImage(dataUrl, 256, 256);
    const id = `custom_${Date.now()}`;

    const charm = this.createCustomCharmModel(id, name, resizedDataUrl);
    this.customCharmsMap.set(id, charm);

    this.saveToStorage();
    return charm;
  }

  /**
   * Non-destructively save a customized version of a charm with studio adjustments
   * @param {string} name 
   * @param {Charm} sourceCharm 
   * @param {Object} settings Adjustment sliders (scale, rotation, offsetX, offsetY, opacity, imageFit)
   * @returns {Charm}
   */
  saveCustomizedCharm(name, sourceCharm, settings) {
    const id = `customized_${Date.now()}`;
    const dataUrl = sourceCharm.dataUrl || null;

    const charm = this.createCustomizedCharmModel(
      id,
      name || `Custom ${sourceCharm.name}`,
      sourceCharm.id,
      settings,
      dataUrl
    );

    // Cache source render reference
    charm._sourceCharm = sourceCharm;

    this.customCharmsMap.set(id, charm);
    this.saveToStorage();
    return charm;
  }

  /**
   * Remove a custom charm by ID
   * @param {string} id 
   * @returns {boolean}
   */
  removeCustomCharm(id) {
    if (this.customCharmsMap.has(id)) {
      this.customCharmsMap.delete(id);
      this.imageCache.delete(id);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Save current list of custom charms to localStorage
   */
  saveToStorage() {
    try {
      const rawList = [];
      this.customCharmsMap.forEach(charm => {
        rawList.push({
          id: charm.id,
          name: charm.name,
          sourceCharmId: charm.sourceCharmId || null,
          settings: charm.settings || null,
          dataUrl: charm.dataUrl || null
        });
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rawList));
    } catch (err) {
      console.error('Failed to save custom charms to localStorage:', err);
    }
  }

  /**
   * Create a Charm model instance for a custom image
   */
  createCustomCharmModel(id, name, dataUrl) {
    const store = this;

    const charm = new Charm({
      id,
      name: name || 'Custom Charm',
      category: 'Custom',
      radius: 24,
      render: (ctx, radius, isGrabbed) => {
        let img = store.imageCache.get(id);

        if (!img) {
          img = new Image();
          img.src = dataUrl;
          store.imageCache.set(id, img);
        }

        if (img.complete && img.naturalWidth > 0) {
          ctx.save();

          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.clip();

          const aspect = img.naturalWidth / img.naturalHeight;
          let dw = radius * 2;
          let dh = radius * 2;

          if (aspect > 1) {
            dw = radius * 2 * aspect;
          } else {
            dh = (radius * 2) / aspect;
          }

          ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
          ctx.restore();

          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = isGrabbed ? '#007AFF' : '#A1A1A6';
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fillStyle = '#3A3A3C';
          ctx.fill();
        }
      }
    });

    charm.isCustom = true;
    charm.dataUrl = dataUrl;
    return charm;
  }

  /**
   * Create a Charm model instance for a studio-customized profile
   */
  createCustomizedCharmModel(id, name, sourceCharmId, settings, dataUrl) {
    const store = this;

    const charm = new Charm({
      id,
      name: name || 'Customized Charm',
      category: 'Custom',
      radius: 24,
      render: (ctx, radius, isGrabbed) => {
        // Resolve source charm renderer dynamically
        let sourceCharm = charm._sourceCharm;
        if (!sourceCharm && store.libraryRef) {
          sourceCharm = store.libraryRef.getCharm(sourceCharmId);
        }

        ctx.save();

        // Apply studio adjustment settings
        const opacity = settings.opacity !== undefined ? settings.opacity : 1.0;
        const scale = settings.scale !== undefined ? settings.scale : 1.0;
        const rotRad = ((settings.rotation || 0) * Math.PI) / 180;
        const offX = settings.offsetX || 0;
        const offY = settings.offsetY || 0;

        ctx.globalAlpha = opacity;
        ctx.translate(offX, offY);
        ctx.rotate(rotRad);
        ctx.scale(scale, scale);

        if (sourceCharm && typeof sourceCharm.render === 'function') {
          sourceCharm.render(ctx, radius, isGrabbed);
        } else {
          // Fallback simple circle
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fillStyle = '#E5E5EA';
          ctx.fill();
        }

        ctx.restore();
      }
    });

    charm.isCustom = true;
    charm.sourceCharmId = sourceCharmId;
    charm.settings = settings;
    charm.dataUrl = dataUrl;
    return charm;
  }

  /**
   * Resize image to max resolution while preserving transparency and aspect ratio
   */
  resizeImage(dataUrl, maxW = 256, maxH = 256) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth;
        let h = img.naturalHeight;

        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }
}
