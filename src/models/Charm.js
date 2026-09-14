/**
 * Charm - Data model representing a built-in charm asset and vector renderer.
 */
export class Charm {
  /**
   * @param {Object} config
   * @param {string} config.id Unique charm identifier
   * @param {string} config.name User-facing charm name
   * @param {string} [config.category='Classic'] Category grouping
   * @param {number} [config.radius=24] Base rendering radius
   * @param {Function} config.render Canvas rendering function (ctx, radius, isGrabbed)
   */
  constructor({ id, name, category = 'Classic', radius = 24, render }) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.radius = radius;
    this.render = render;
    this._previewCache = null;
  }

  /**
   * Generate cached PNG Data URL preview image for UI grid displays
   * @param {number} width 
   * @param {number} height 
   * @returns {string} Data URL
   */
  getPreviewDataURL(width = 48, height = 48) {
    if (this._previewCache) return this._previewCache;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.translate(width / 2, height / 2);
    const scale = (width * 0.4) / this.radius;
    ctx.scale(scale, scale);

    if (typeof this.render === 'function') {
      this.render(ctx, this.radius, false);
    }
    ctx.restore();

    this._previewCache = canvas.toDataURL();
    return this._previewCache;
  }
}
