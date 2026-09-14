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
  isOverCharm(mx, my, charmX, charmY, radius) {
    const dx = mx - charmX;
    const dy = my - charmY;
    const hitMargin = 8; // Extra touch/cursor margin for comfortable grabbing
    return (dx * dx + dy * dy) <= Math.pow(radius + hitMargin, 2);
  }

  /**
   * Handle mouse down event
   * @param {MouseEvent} e 
   * @param {number} charmX 
   * @param {number} charmY 
   * @param {number} charmRadius 
   * @returns {boolean} Whether charm was grabbed
   */
  onMouseDown(e, charmX, charmY, charmRadius) {
    this.mousePos = { x: e.clientX, y: e.clientY };

    if (this.isOverCharm(e.clientX, e.clientY, charmX, charmY, charmRadius)) {
      this.state = InteractionState.GRABBED;
      this.grabOffset = {
        x: charmX - e.clientX,
        y: charmY - e.clientY
      };
      this.velocitySamples = [];
      this.addVelocitySample(e.clientX, e.clientY);
      return true;
    }

    return false;
  }

  /**
   * Handle mouse move event
   * @param {MouseEvent} e 
   * @param {number} charmX 
   * @param {number} charmY 
   * @param {number} charmRadius 
   * @param {number} width Window width
   * @param {number} height Window height
   * @returns {{ isDragging: boolean, targetX?: number, targetY?: number }}
   */
  onMouseMove(e, charmX, charmY, charmRadius, width, height) {
    this.mousePos = { x: e.clientX, y: e.clientY };

    if (this.state === InteractionState.GRABBED || this.state === InteractionState.DRAGGING) {
      this.state = InteractionState.DRAGGING;
      this.addVelocitySample(e.clientX, e.clientY);

      // Target position clamped to window margins
      const targetX = Math.max(20, Math.min(width - 20, e.clientX + this.grabOffset.x));
      const targetY = Math.max(20, Math.min(height - 20, e.clientY + this.grabOffset.y));

      return { isDragging: true, targetX, targetY };
    }

    // Update hover status when idle
    const hover = this.isOverCharm(e.clientX, e.clientY, charmX, charmY, charmRadius);
    this.state = hover ? InteractionState.HOVER : InteractionState.IDLE;

    return { isDragging: false };
  }

  /**
   * Handle mouse up / release event
   * @returns {{ wasDragging: boolean, vx: number, vy: number }} Release velocity
   */
  onMouseUp() {
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
   * Handle mouse leaving canvas area
   */
  onMouseLeave() {
    if (this.state === InteractionState.DRAGGING || this.state === InteractionState.GRABBED) {
      return this.onMouseUp();
    }
    this.state = InteractionState.IDLE;
    return { wasDragging: false, vx: 0, vy: 0 };
  }

  /**
   * Record mouse position sample for velocity calculation
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
