/**
 * RopePoint - Represents a single particle node along the rope chain.
 * Uses Verlet integration position tracking.
 */
export class RopePoint {
  /**
   * @param {number} x Initial X coordinate
   * @param {number} y Initial Y coordinate
   * @param {boolean} [pinned=false] Whether point is anchored/fixed in place
   * @param {number} [mass=1.0] Mass multiplier for constraint solving
   */
  constructor(x, y, pinned = false, mass = 1.0) {
    this.x = x;
    this.y = y;
    this.oldX = x;
    this.oldY = y;
    this.pinned = pinned;
    this.mass = mass;
  }

  /**
   * Perform Verlet integration step
   * @param {number} gravity Gravity acceleration (px/s^2)
   * @param {number} damping Damping multiplier (air resistance)
   * @param {number} dt Delta time in seconds
   */
  update(gravity, damping, dt) {
    if (this.pinned) return;

    const vx = (this.x - this.oldX) * damping;
    const vy = (this.y - this.oldY) * damping;

    this.oldX = this.x;
    this.oldY = this.y;

    this.x += vx;
    this.y += vy + gravity * dt * dt;
  }

  /**
   * Fix point to specific coordinates
   * @param {number} x 
   * @param {number} y 
   */
  pinTo(x, y) {
    this.x = x;
    this.y = y;
    this.oldX = x;
    this.oldY = y;
  }
}
