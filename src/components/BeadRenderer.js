/**
 * BeadRenderer - Handles rendering of small decorative polished beads
 * distributed along the rope physics points with configurable count support.
 */
export class BeadRenderer {
  constructor(beadCount = 6) {
    this.beadCount = beadCount;
    this.beadRadius = 4.0;
  }

  setBeadCount(count) {
    this.beadCount = Math.max(0, Math.min(12, count));
  }

  /**
   * Calculate evenly spaced node indices for any bead count
   * @param {number} totalPoints 
   * @returns {number[]}
   */
  getBeadNodeIndices(totalPoints) {
    if (this.beadCount <= 0 || totalPoints <= 2) return [];

    const indices = [];
    const step = (totalPoints - 2) / (this.beadCount + 1);

    for (let i = 1; i <= this.beadCount; i++) {
      indices.push(Math.round(i * step));
    }
    return indices;
  }

  /**
   * Render beads attached to simulated rope points
   * @param {CanvasRenderingContext2D} ctx 
   * @param {import('../physics/RopePoint.js').RopePoint[]} points 
   */
  renderBeads(ctx, points) {
    if (!points || points.length === 0 || this.beadCount <= 0) return;

    const nodeIndices = this.getBeadNodeIndices(points.length);
    ctx.save();

    for (let i = 0; i < nodeIndices.length; i++) {
      const nodeIdx = nodeIndices[i];
      if (nodeIdx >= points.length - 1) continue;

      const p = points[nodeIdx];
      this.drawBead(ctx, p.x, p.y);
    }

    ctx.restore();
  }

  /**
   * Draw a single polished 3D-shaded bead sphere
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x 
   * @param {number} y 
   */
  drawBead(ctx, x, y) {
    ctx.save();

    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    const gradient = ctx.createRadialGradient(
      x - this.beadRadius * 0.35,
      y - this.beadRadius * 0.35,
      0.5,
      x,
      y,
      this.beadRadius
    );
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.45, '#E5E5EA');
    gradient.addColorStop(0.85, '#B0B0B6');
    gradient.addColorStop(1, '#7C7C80');

    ctx.beginPath();
    ctx.arc(x, y, this.beadRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#555558';
    ctx.stroke();

    ctx.restore();
  }
}
