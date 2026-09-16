/**
 * MouseInteractionHandler - Manages mouse hit testing, grab/drag state machine,
 * and release velocity calculations for momentum throwing.
 */
export const InteractionState = {
  IDLE: 'IDLE',
  HOVER: 'HOVER',
  GRABBED: 'GRABBED',
  DRAGGING: 'DRAGGING',
  RELEASED: 'RELEASED'
};

export class MouseInteractionHandler {
  constructor() {
    this.state = InteractionState.IDLE;
    this.mousePos = { x: 0, y: 0 };
    this.grabOffset = { x: 0, y: 0 };
    this.velocitySamples = [];
    this.maxSampleWindowMs = 120; // 120ms velocity tracking window
  }

  /**
   * Check if mouse coordinates are over charm body
   * @param {number} mx 
   * @param {number} my 
   * @param {number} charmX 
   * @param {number} charmY 
   * @param {number} radius 
   * @returns {boolean}
   */
  /**
   * Check if coordinates are over charm body
   * @param {number} mx Relative X
   * @param {number} my Relative Y
   * @param {number} charmX 
   * @param {number} charmY 
   * @param {number} radius 
   * @returns {boolean}
   */
  isOverCharm(mx, my, charmX, charmY, radius) {
    const dx = mx - charmX;
    const dy = my - charmY;
    const hitMargin = 12; // Extra touch/cursor margin for comfortable grabbing
    return (dx * dx + dy * dy) <= Math.pow((radius || 24) + hitMargin, 2);
  }

  /**
   * Handle pointer down event with canvas-relative coordinates
   * @param {number} px 
   * @param {number} py 
   * @param {number} charmX 
   * @param {number} charmY 
   * @param {number} charmRadius 
   * @returns {boolean} Whether charm was grabbed
   */
  onPointerDown(px, py, charmX, charmY, charmRadius) {
    this.mousePos = { x: px, y: py };

    if (this.isOverCharm(px, py, charmX, charmY, charmRadius)) {
      this.state = InteractionState.GRABBED;
      this.grabOffset = {
        x: charmX - px,
        y: charmY - py
      };
      this.velocitySamples = [];
      this.addVelocitySample(px, py);
      return true;
    }

    return false;
  }

  /**
   * Legacy alias for onPointerDown
   */
  onMouseDown(e, charmX, charmY, charmRadius) {
    const px = e.clientX !== undefined ? e.clientX : (e.x || 0);
    const py = e.clientY !== undefined ? e.clientY : (e.y || 0);
    return this.onPointerDown(px, py, charmX, charmY, charmRadius);
  }

  /**
   * Handle pointer move event with canvas-relative coordinates and boundary clamping
   * @param {number} px 
   * @param {number} py 
   * @param {number} charmX 
   * @param {number} charmY 
   * @param {number} charmRadius 
   * @param {number} width Preview container width
   * @param {number} height Preview container height
   * @returns {{ isDragging: boolean, targetX?: number, targetY?: number }}
   */
  onPointerMove(px, py, charmX, charmY, charmRadius, width, height) {
    this.mousePos = { x: px, y: py };

    if (this.state === InteractionState.GRABBED || this.state === InteractionState.DRAGGING) {
      this.state = InteractionState.DRAGGING;
      this.addVelocitySample(px, py);

      // Clamp target position to preview window boundaries
      const margin = Math.max(15, charmRadius || 24);
      const targetX = Math.max(margin, Math.min((width || 360) - margin, px + this.grabOffset.x));
      const targetY = Math.max(margin, Math.min((height || 400) - margin, py + this.grabOffset.y));

      return { isDragging: true, targetX, targetY };
    }

    // Update hover status when idle
    const hover = this.isOverCharm(px, py, charmX, charmY, charmRadius);
    this.state = hover ? InteractionState.HOVER : InteractionState.IDLE;

    return { isDragging: false };
  }

  /**
   * Legacy alias for onPointerMove
   */
  onMouseMove(e, charmX, charmY, charmRadius, width, height) {
    const px = e.clientX !== undefined ? e.clientX : (e.x || 0);
    const py = e.clientY !== undefined ? e.clientY : (e.y || 0);
    return this.onPointerMove(px, py, charmX, charmY, charmRadius, width, height);
  }

  /**
   * Handle pointer up / release event
   * @returns {{ wasDragging: boolean, vx: number, vy: number }} Release velocity
   */
  onPointerUp() {
    if (this.state === InteractionState.DRAGGING || this.state === InteractionState.GRABBED) {
      const { vx, vy } = this.calculateReleaseVelocity();
      this.state = InteractionState.RELEASED;
      this.velocitySamples = [];
      return { wasDragging: true, vx, vy };
    }

    this.state = InteractionState.IDLE;
    this.velocitySamples = [];
    return { wasDragging: false, vx: 0, vy: 0 };
  }

  /**
   * Legacy alias for onPointerUp
   */
  onMouseUp() {
    return this.onPointerUp();
  }

  /**
   * Handle mouse/pointer leaving canvas area
   */
  onMouseLeave() {
    if (this.state === InteractionState.DRAGGING || this.state === InteractionState.GRABBED) {
      return this.onPointerUp();
    }
    this.state = InteractionState.IDLE;
    return { wasDragging: false, vx: 0, vy: 0 };
  }

  /**
   * Record pointer position sample for velocity calculation
   * @param {number} x 
   * @param {number} y 
   */
  addVelocitySample(x, y) {
    const now = performance.now();
    this.velocitySamples.push({ x, y, t: now });

    // Prune samples older than maxSampleWindowMs
    const cutoff = now - this.maxSampleWindowMs;
    while (this.velocitySamples.length > 0 && this.velocitySamples[0].t < cutoff) {
      this.velocitySamples.shift();
    }
  }

  /**
   * Calculate release throw velocity from recent position samples
   * @returns {{ vx: number, vy: number }} Velocity in px/sec
   */
  calculateReleaseVelocity() {
    if (this.velocitySamples.length < 2) {
      return { vx: 0, vy: 0 };
    }

    const oldest = this.velocitySamples[0];
    const newest = this.velocitySamples[this.velocitySamples.length - 1];

    const dtSeconds = (newest.t - oldest.t) / 1000;
    if (dtSeconds < 0.005) {
      return { vx: 0, vy: 0 };
    }

    let vx = (newest.x - oldest.x) / dtSeconds;
    let vy = (newest.y - oldest.y) / dtSeconds;

    // Clamp maximum throw velocity to prevent physics explosion/instability
    const maxSpeed = 2200;
    const speed = Math.hypot(vx, vy);
    if (speed > maxSpeed) {
      const factor = maxSpeed / speed;
      vx *= factor;
      vy *= factor;
    }

    return { vx, vy };
  }
}
