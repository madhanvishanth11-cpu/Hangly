import { RopePoint } from './RopePoint.js';
import { RopeConfiguration } from './RopeConfiguration.js';

/**
 * RopeSimulation - Manages 2D Verlet rope particle simulation, distance constraints,
 * motion intensity presets, drag pinning, and release throw momentum.
 */
export class RopeSimulation {
  constructor(anchorX = 180, anchorY = 35, config = RopeConfiguration) {
    this.config = config;
    this.anchorX = anchorX;
    this.anchorY = anchorY;
    this.segmentLength = this.config.totalLength / this.config.segmentCount;
    this.points = [];
    this.isSleeping = false;
    this.lowEnergyFrameCount = 0;
    this.isDraggingCharm = false;

    // Fixed / Locked Charm State
    this.isFixed = false;
    this.fixedX = 0;
    this.fixedY = 0;

    this.initPoints();
  }

  /**
   * Apply motion intensity setting ('low', 'normal', 'high') to simulation config
   * @param {string} intensity 
   */
  applyMotionIntensity(intensity) {
    switch (intensity) {
      case 'low':
        this.config.gravity = 800;
        this.config.damping = 0.975;
        break;
      case 'high':
        this.config.gravity = 1700;
        this.config.damping = 0.992;
        break;
      case 'normal':
      default:
        this.config.gravity = 1200;
        this.config.damping = 0.985;
        break;
    }
    this.wakeUp();
  }

  /**
   * Initialize rope points vertically hanging from anchor point
   */
  initPoints() {
    this.points = [];
    const totalPoints = this.config.segmentCount + 1;

    for (let i = 0; i < totalPoints; i++) {
      const x = this.anchorX;
      const y = this.anchorY + i * this.segmentLength;
      const isAnchor = (i === 0);
      const isCharm = (i === totalPoints - 1);
      const mass = isCharm ? this.config.charmMassRatio : 1.0;

      this.points.push(new RopePoint(x, y, isAnchor, mass));
    }
  }

  /**
   * Update anchor position if window resizes or moves
   * @param {number} x 
   * @param {number} y 
   */
  setAnchorPoint(x, y) {
    this.anchorX = x;
    this.anchorY = y;
    if (this.points.length > 0) {
      this.points[0].pinTo(x, y);
    }
  }

  /**
   * Pin charm (bottom node) to target mouse position during active drag
   * @param {number} x 
   * @param {number} y 
   */
  setCharmDragPosition(x, y) {
    if (this.isFixed) return; // Block dragging when charm is fixed/locked
    this.wakeUp();
    this.isDraggingCharm = true;
    const charmPoint = this.getBottomPoint();
    if (charmPoint) {
      charmPoint.x = x;
      charmPoint.y = y;
      charmPoint.oldX = x;
      charmPoint.oldY = y;
      charmPoint.pinned = true;
    }
  }

  /**
   * Release charm node and inject throw velocity momentum into physics simulation
   * @param {number} vx 
   * @param {number} vy 
   * @param {number} dt 
   */
  releaseCharmWithVelocity(vx, vy, dt = 1 / 60) {
    this.wakeUp();
    this.isDraggingCharm = false;

    const charmPoint = this.getBottomPoint();
    if (!charmPoint) return;

    charmPoint.pinned = false;

    charmPoint.oldX = charmPoint.x - vx * dt;
    charmPoint.oldY = charmPoint.y - vy * dt;

    const pointCount = this.points.length;
    if (pointCount >= 3) {
      const pPrev1 = this.points[pointCount - 2];
      const pPrev2 = this.points[pointCount - 3];

      if (!pPrev1.pinned) {
        pPrev1.oldX = pPrev1.x - vx * dt * 0.65;
        pPrev1.oldY = pPrev1.y - vy * dt * 0.65;
      }
      if (!pPrev2.pinned) {
        pPrev2.oldX = pPrev2.x - vx * dt * 0.35;
        pPrev2.oldY = pPrev2.y - vy * dt * 0.35;
      }
    }
  }

  /**
   * Apply displacement impulse to nudge the rope
   * @param {number} dx 
   * @param {number} dy 
   */
  applyImpulse(dx, dy) {
    this.wakeUp();
    const len = this.points.length;
    for (let i = 1; i < len; i++) {
      const factor = (i / len);
      this.points[i].oldX -= dx * factor;
      this.points[i].oldY -= dy * factor;
    }
  }

  wakeUp() {
    this.isSleeping = false;
    this.lowEnergyFrameCount = 0;
  }

  /**
   * Main physics update step
   * @param {number} dt Time step in seconds
   */
  update(dt = 1 / 60) {
    const clampedDt = Math.min(dt, 0.033);

    if (this.isSleeping && !this.isDraggingCharm) {
      return;
    }

    for (let i = 0; i < this.points.length; i++) {
      this.points[i].update(this.config.gravity, this.config.damping, clampedDt);
    }

    this.points[0].pinTo(this.anchorX, this.anchorY);

    if (this.isFixed) {
      const bottomPoint = this.getBottomPoint();
      if (bottomPoint) {
        bottomPoint.pinTo(this.fixedX, this.fixedY);
      }
    }

    const iterations = this.config.constraintIterations;
    const pointCount = this.points.length;

    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < pointCount - 1; i++) {
        const p1 = this.points[i];
        const p2 = this.points[i + 1];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const currentDist = Math.hypot(dx, dy) || 0.0001;

        const error = (currentDist - this.segmentLength) / currentDist;
        const offsetX = dx * error * 0.5;
        const offsetY = dy * error * 0.5;

        if (!p1.pinned && !p2.pinned) {
          const totalMass = p1.mass + p2.mass;
          const ratio1 = p2.mass / totalMass;
          const ratio2 = p1.mass / totalMass;

          p1.x += offsetX * ratio1 * 2;
          p1.y += offsetY * ratio1 * 2;
          p2.x -= offsetX * ratio2 * 2;
          p2.y -= offsetY * ratio2 * 2;
        } else if (!p1.pinned) {
          p1.x += offsetX * 2;
          p1.y += offsetY * 2;
        } else if (!p2.pinned) {
          p2.x -= offsetX * 2;
          p2.y -= offsetY * 2;
        }
      }

      this.points[0].pinTo(this.anchorX, this.anchorY);
    }

    if (!this.isDraggingCharm) {
      let totalKineticEnergy = 0;
      for (let i = 1; i < pointCount; i++) {
        const p = this.points[i];
        const vx = p.x - p.oldX;
        const vy = p.y - p.oldY;
        totalKineticEnergy += (vx * vx + vy * vy);
      }

      if (totalKineticEnergy < this.config.sleepThreshold) {
        this.lowEnergyFrameCount++;
        if (this.lowEnergyFrameCount > 90) {
          this.isSleeping = true;
        }
      } else {
        this.lowEnergyFrameCount = 0;
      }
    }
  }

  getBottomPoint() {
    return this.points[this.points.length - 1];
  }

  getCharmAngle() {
    if (this.points.length < 2) return 0;
    const pPrev = this.points[this.points.length - 2];
    const pLast = this.points[this.points.length - 1];
    return Math.atan2(pLast.x - pPrev.x, pLast.y - pPrev.y);
  }
}
