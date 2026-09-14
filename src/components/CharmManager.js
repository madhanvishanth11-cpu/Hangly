/**
 * CharmManager - Handles rendering of preset charms (Silver Circle, Gold Star,
 * Ruby Heart, Emerald Gem) and custom user uploaded image charms.
 */
export const CharmType = {
  SILVER_CIRCLE: 'SILVER_CIRCLE',
  GOLD_STAR: 'GOLD_STAR',
  RUBY_HEART: 'RUBY_HEART',
  EMERALD_GEM: 'EMERALD_GEM',
  CUSTOM: 'CUSTOM'
};

export class CharmManager {
  constructor() {
    this.currentType = CharmType.SILVER_CIRCLE;
    this.customImage = null;
    this.customImageLoaded = false;
  }

  /**
   * Set active charm preset type
   * @param {string} type 
   */
  setCharmType(type) {
    if (CharmType[type]) {
      this.currentType = type;
    }
  }

  /**
   * Load custom image from File or URL data
   * @param {File|string} src File object or image URL
   */
  loadCustomImage(src) {
    const img = new Image();
    img.onload = () => {
      this.customImage = img;
      this.customImageLoaded = true;
      this.currentType = CharmType.CUSTOM;
    };

    if (typeof src === 'string') {
      img.src = src;
    } else if (src instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.readAsDataURL(src);
    }
  }

  /**
   * Render the currently selected charm graphic
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} radius Charm radius in pixels
   * @param {boolean} isGrabbed 
   */
  renderCharm(ctx, radius = 24, isGrabbed = false) {
    switch (this.currentType) {
      case CharmType.GOLD_STAR:
        this.renderGoldStar(ctx, radius, isGrabbed);
        break;
      case CharmType.RUBY_HEART:
        this.renderRubyHeart(ctx, radius, isGrabbed);
        break;
      case CharmType.EMERALD_GEM:
        this.renderEmeraldGem(ctx, radius, isGrabbed);
        break;
      case CharmType.CUSTOM:
        if (this.customImageLoaded && this.customImage) {
          this.renderCustomImage(ctx, radius, isGrabbed);
        } else {
          this.renderSilverCircle(ctx, radius, isGrabbed);
        }
        break;
      case CharmType.SILVER_CIRCLE:
      default:
        this.renderSilverCircle(ctx, radius, isGrabbed);
        break;
    }
  }

  /**
   * Render Classic Silver Circle Charm
   */
  renderSilverCircle(ctx, radius, isGrabbed) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);

    const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 2, 0, 0, radius);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.7, '#E5E5EA');
    gradient.addColorStop(1, '#D1D1D6');

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#A1A1A6';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = isGrabbed ? '#007AFF' : '#636366';
    ctx.fill();
  }

  /**
   * Render Gold 5-Point Star Charm
   */
  renderGoldStar(ctx, radius, isGrabbed) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;

    const points = 5;
    const outerRadius = radius * 1.1;
    const innerRadius = radius * 0.55;

    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    const gradient = ctx.createLinearGradient(-radius, -radius, radius, radius);
    gradient.addColorStop(0, '#FFF59D');
    gradient.addColorStop(0.5, '#FBC02D');
    gradient.addColorStop(1, '#F57F17');

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#FFF59D';
    ctx.stroke();
  }

  /**
   * Render Ruby Heart Charm
   */
  renderRubyHeart(ctx, radius, isGrabbed) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;

    const r = radius * 0.9;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.7);
    ctx.bezierCurveTo(-r * 1.2, -r * 0.3, -r * 0.6, -r * 1.2, 0, -r * 0.5);
    ctx.bezierCurveTo(r * 0.6, -r * 1.2, r * 1.2, -r * 0.3, 0, r * 0.7);
    ctx.closePath();

    const gradient = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r * 1.2);
    gradient.addColorStop(0, '#FF8A80');
    gradient.addColorStop(0.5, '#D50000');
    gradient.addColorStop(1, '#880E4F');

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#FF8A80';
    ctx.stroke();
  }

  /**
   * Render Emerald Gem Charm
   */
  renderEmeraldGem(ctx, radius, isGrabbed) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;

    const r = radius;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.85, -r * 0.4);
    ctx.lineTo(r * 0.85, r * 0.4);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.85, r * 0.4);
    ctx.lineTo(-r * 0.85, -r * 0.4);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(-r, -r, r, r);
    gradient.addColorStop(0, '#A7F3D0');
    gradient.addColorStop(0.5, '#059669');
    gradient.addColorStop(1, '#064E3B');

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#A7F3D0';
    ctx.stroke();
  }

  /**
   * Render Custom Uploaded Image Charm
   */
  renderCustomImage(ctx, radius, isGrabbed) {
    ctx.save();

    // Circular clip path for custom charm image
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(
      this.customImage,
      -radius,
      -radius,
      radius * 2,
      radius * 2
    );

    ctx.restore();

    // Silver metallic frame border around image
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isGrabbed ? '#007AFF' : '#A1A1A6';
    ctx.stroke();
  }
}
