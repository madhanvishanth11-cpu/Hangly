/**
 * RopeRenderer - Handles drawing of the flexible rope path, top anchor pin,
 * and top/bottom connector rings.
 */
export class RopeRenderer {
  /**
   * Render the multi-point flexible rope cord
   * @param {CanvasRenderingContext2D} ctx 
   * @param {import('../physics/RopePoint.js').RopePoint[]} points 
   */
  renderRope(ctx, points) {
    if (!points || points.length < 2) return;

    ctx.save();

    // 1. Soft Shadow under Rope
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    // 2. Smooth Rope Path Through Physics Nodes
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    
    const lastPoint = points[points.length - 1];
    ctx.lineTo(lastPoint.x, lastPoint.y);

    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#4A4036'; // Natural warm brown cord color
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Render the top anchor mounting pin
   * @param {CanvasRenderingContext2D} ctx 
   * @param {{ x: number, y: number }} anchor 
   */
  renderAnchor(ctx, anchor) {
    ctx.save();

    // Outer Pin Rim
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#2C2C2E';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#8E8E93';
    ctx.stroke();

    // Inner Pin Core
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#E5E5EA';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Render small connector ring connecting final rope point to charm
   * @param {CanvasRenderingContext2D} ctx 
   * @param {{ x: number, y: number }} charmPoint 
   * @param {number} charmRadius 
   */
  renderBottomConnector(ctx, charmPoint, charmRadius) {
    ctx.save();
    ctx.translate(charmPoint.x, charmPoint.y);

    const ringRadius = 4.5;
    ctx.beginPath();
    ctx.arc(0, -charmRadius, ringRadius, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#8E8E93';
    ctx.stroke();

    ctx.restore();
  }
}
