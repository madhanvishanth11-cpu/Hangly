import { InteractionState } from '../physics/MouseInteractionHandler.js';
import { RopeRenderer } from './RopeRenderer.js';
import { BeadRenderer } from './BeadRenderer.js';
import { CharmLibrary } from '../charms/CharmLibrary.js';

/**
 * HangingObject - Main orchestrator component rendering the physics rope,
 * decorative beads, connector rings, active charm, hover/grab cues, and dev debug overlay.
 */
export class HangingObject {
  constructor() {
    this.baseRadius = 24;
    this.charmScale = 1.0;
    this.showBeads = true;
    this.ropeRenderer = new RopeRenderer();
    this.beadRenderer = new BeadRenderer(6);
    this.charmLibrary = new CharmLibrary();
  }

  get charmRadius() {
    return this.baseRadius * this.charmScale;
  }

  /**
   * Render complete hanging object stack
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} width 
   * @param {number} height 
   * @param {import('../physics/RopeSimulation.js').RopeSimulation} simulation 
   * @param {string} [interactionState=InteractionState.IDLE]
   */
  render(ctx, width, height, simulation, interactionState = InteractionState.IDLE) {
    if (!simulation || !simulation.points || simulation.points.length === 0) {
      return;
    }

    const points = simulation.points;
    const anchor = points[0];
    const charmPoint = simulation.getBottomPoint();
    const charmAngle = simulation.getCharmAngle();
    const effectiveRadius = this.charmRadius;

    ctx.save();

    // 1. Render Top Anchor Pin Mount
    this.ropeRenderer.renderAnchor(ctx, anchor);

    // 2. Render Flexible Rope Cord Line
    this.ropeRenderer.renderRope(ctx, points);

    // 3. Render Decorative Beads (if enabled in settings)
    if (this.showBeads) {
      this.beadRenderer.renderBeads(ctx, points);
    }

    // 4. Render Bottom Connector Ring
    this.ropeRenderer.renderBottomConnector(ctx, charmPoint, effectiveRadius);

    // 5. Render Charm Body & Hover/Grab Cues
    ctx.save();
    ctx.translate(charmPoint.x, charmPoint.y);

    const tiltAngle = Math.max(-0.4, Math.min(0.4, -charmAngle));
    ctx.rotate(tiltAngle);

    const isGrabbed = (interactionState === InteractionState.DRAGGING || interactionState === InteractionState.GRABBED);

    // Hover / Grab Glow Ring Effect
    if (interactionState === InteractionState.HOVER || isGrabbed) {
      ctx.beginPath();
      ctx.arc(0, 0, effectiveRadius + 5, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = isGrabbed ? 'rgba(0, 122, 255, 0.6)' : 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();
    }

    // Safe charm rendering with fallback protection
    try {
      const activeCharm = this.charmLibrary.getActiveCharm();

      ctx.save();
      if (this.charmScale !== 1.0) {
        ctx.scale(this.charmScale, this.charmScale);
      }
      activeCharm.render(ctx, this.baseRadius, isGrabbed);
      ctx.restore();
    } catch (err) {
      console.error('Error rendering active charm, rendering fallback coin:', err);
      const fallbackCharm = this.charmLibrary.getCharm('silver_coin');
      fallbackCharm.render(ctx, effectiveRadius, isGrabbed);
    }

    ctx.restore(); // Restore charm transform

    // 6. Development / Debug Mode Overlay
    if (simulation.config.debug) {
      this.renderDebugOverlay(ctx, simulation, interactionState);
    }

    ctx.restore();
  }

  /**
   * Render debug graphics
   */
  renderDebugOverlay(ctx, simulation, interactionState) {
    const points = simulation.points;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#007AFF';
    ctx.stroke();

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.pinned ? 4.5 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = p.pinned ? '#FF3B30' : '#FF9500';
      ctx.fill();
    }

    const activeCharm = this.charmLibrary.getActiveCharm();

    ctx.font = '11px sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 220, 56);
    ctx.fillStyle = '#34C759';
    ctx.fillText(`DEBUG MODE (Shift+D)`, 16, 26);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Nodes: ${points.length} | Scale: ${this.charmScale.toFixed(2)}x`, 16, 42);
    ctx.fillStyle = '#FFCC00';
    ctx.fillText(`State: ${simulation.isSleeping ? 'Sleep' : 'Active'} | Charm: ${activeCharm.name}`, 16, 58);
  }
}
