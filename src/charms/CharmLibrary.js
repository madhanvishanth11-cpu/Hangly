import { Charm } from '../models/Charm.js';
import { CustomCharmStore } from './CustomCharmStore.js';

/**
 * CharmLibrary - Catalog of built-in and user-imported custom charms,
 * active selection state management, local storage persistence, and safe fallback handling.
 */
export class CharmLibrary {
  constructor() {
    this.charmsMap = new Map();
    this.customStore = new CustomCharmStore();
    this.customStore.libraryRef = this;

    this.STORAGE_KEY = 'hangly_selected_charm_id';
    this.FALLBACK_ID = 'gold_star';

    this.registerBuiltInCharms();
    this.activeCharmId = this.loadSavedCharmId();
  }

  /**
   * Register catalog of 10 distinct built-in charms
   */
  registerBuiltInCharms() {
    // 1. Silver Coin
    this.register(new Charm({
      id: 'silver_coin',
      name: 'Silver Coin',
      category: 'Metallic',
      radius: 24,
      render: (ctx, radius, isGrabbed) => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 2, 0, 0, radius);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.7, '#E5E5EA');
        grad.addColorStop(1, '#D1D1D6');
        ctx.fillStyle = grad;
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
    }));

    // 2. Golden Star
    this.register(new Charm({
      id: 'gold_star',
      name: 'Golden Star',
      category: 'Celestial',
      radius: 24,
      render: (ctx, radius, isGrabbed) => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        const points = 5;
        const outerR = radius * 1.1;
        const innerR = radius * 0.55;

        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
          const r = (i % 2 === 0) ? outerR : innerR;
          const angle = (i * Math.PI) / points - Math.PI / 2;
          const x = r * Math.cos(angle);
          const y = r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        const grad = ctx.createLinearGradient(-radius, -radius, radius, radius);
        grad.addColorStop(0, '#FFF59D');
        grad.addColorStop(0.5, '#FBC02D');
        grad.addColorStop(1, '#F57F17');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isGrabbed ? '#007AFF' : '#FFF59D';
        ctx.stroke();
      }
    }));

    // 3. Ruby Heart
    this.register(new Charm({
      id: 'ruby_heart',
      name: 'Ruby Heart',
      category: 'Gems',
      radius: 24,
      render: (ctx, radius, isGrabbed) => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        const r = radius * 0.9;
        ctx.beginPath();
        ctx.moveTo(0, r * 0.7);
        ctx.bezierCurveTo(-r * 1.2, -r * 0.3, -r * 0.6, -r * 1.2, 0, -r * 0.5);
        ctx.bezierCurveTo(r * 0.6, -r * 1.2, r * 1.2, -r * 0.3, 0, r * 0.7);
        ctx.closePath();

        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r * 1.2);
        grad.addColorStop(0, '#FF8A80');
        grad.addColorStop(0.5, '#D50000');
        grad.addColorStop(1, '#880E4F');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isGrabbed ? '#007AFF' : '#FF8A80';
        ctx.stroke();
      }
    }));

    // 4. Emerald Facet
    this.register(new Charm({
      id: 'emerald_gem',
      name: 'Emerald Facet',
      category: 'Gems',
      radius: 24,
      render: (ctx, radius, isGrabbed) => {
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

        const grad = ctx.createLinearGradient(-r, -r, r, r);
        grad.addColorStop(0, '#A7F3D0');
        grad.addColorStop(0.5, '#059669');
        grad.addColorStop(1, '#064E3B');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isGrabbed ? '#007AFF' : '#A7F3D0';
        ctx.stroke();
      }
    }));

    // 5. Sapphire Crystal
    this.register(new Charm({
      id: 'sapphire_crystal',
      name: 'Sapphire Crystal',
      category: 'Gems',
      radius: 24,
      render: (ctx, radius, isGrabbed) => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        const r = radius * 0.95;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.1);
        ctx.lineTo(r * 0.8, -r * 0.5);
        ctx.lineTo(r * 0.8, r * 0.5);
        ctx.lineTo(0, r * 1.1);
        ctx.lineTo(-r * 0.8, r * 0.5);
        ctx.lineTo(-r * 0.8, -r * 0.5);
        ctx.closePath();

        const grad = ctx.createLinearGradient(-r, -r, r, r);
        grad.addColorStop(0, '#93C5FD');
        grad.addColorStop(0.5, '#2563EB');
        grad.addColorStop(1, '#1E3A8A');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isGrabbed ? '#60A5FA' : '#93C5FD';
        ctx.stroke();
      }
    }));

    // 6. Amethyst Teardrop
    this.register(new Charm({
      id: 'amethyst_drop',
      name: 'Amethyst Teardrop',
      category: 'Gems',
      radius: 24,
      render: (ctx, radius, isGrabbed) => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        const r = radius;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.1);
        ctx.bezierCurveTo(r * 1.2, -r * 0.2, r * 1.1, r * 0.9, 0, r * 1.1);
        ctx.bezierCurveTo(-r * 1.1, r * 0.9, -r * 1.2, -r * 0.2, 0, -r * 1.1);
        ctx.closePath();

        const grad = ctx.createRadialGradient(0, -r * 0.3, 2, 0, 0, r * 1.2);
        grad.addColorStop(0, '#E9D5FF');
        grad.addColorStop(0.5, '#9333EA');
        grad.addColorStop(1, '#581C87');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isGrabbed ? '#C084FC' : '#E9D5FF';
        ctx.stroke();
      }
    }));

    // 7. Golden Bell
    this.register(new Charm({
      id: 'golden_bell',
      name: 'Golden Bell',
      category: 'Metallic',
      radius: 24,
      render: (ctx, radius, isGrabbed) => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        const r = radius * 0.9;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.9);
        ctx.bezierCurveTo(r * 0.8, -r * 0.9, r * 0.9, r * 0.2, r * 1.1, r * 0.7);
        ctx.lineTo(-r * 1.1, r * 0.7);
        ctx.bezierCurveTo(-r * 0.9, r * 0.2, -r * 0.8, -r * 0.9, 0, -r * 0.9);
        ctx.closePath();

        const grad = ctx.createLinearGradient(-r, -r, r, r);
        grad.addColorStop(0, '#FEF08A');
        grad.addColorStop(0.5, '#EAB308');
        grad.addColorStop(1, '#854D0E');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#FEF08A';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, r * 0.85, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#CA8A04';
        ctx.fill();
      }
    }));

    // 8. Lunar Moon
    this.register(new Charm({
      id: 'lunar_moon',
      name: 'Lunar Crescent',
      category: 'Celestial',
      radius: 24,
      render: (ctx, radius, isGrabbed) => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        const r = radius * 1.05;
        ctx.beginPath();
        ctx.arc(0, 0, r, Math.PI * 0.3, Math.PI * 1.7, false);
        ctx.arc(r * 0.4, 0, r * 0.75, Math.PI * 1.55, Math.PI * 0.45, true);
        ctx.closePath();

        const grad = ctx.createLinearGradient(-r, -r, r, r);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.5, '#E2E8F0');
        grad.addColorStop(1, '#94A3B8');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
      }
    }));

    // 9. Wooden Acorn
    this.register(new Charm({
      id: 'wooden_acorn',
      name: 'Wooden Acorn',
      category: 'Nature',
      radius: 24,
      render: (ctx, radius, isGrabbed) => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        const r = radius * 0.95;

        ctx.beginPath();
        ctx.arc(0, r * 0.1, r * 0.9, 0, Math.PI);
        ctx.lineTo(0, r * 1.1);
        ctx.closePath();
        const bodyGrad = ctx.createRadialGradient(0, r * 0.3, 2, 0, r * 0.3, r);
        bodyGrad.addColorStop(0, '#D97706');
        bodyGrad.addColorStop(1, '#78350F');
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, -r * 0.2, r * 0.9, Math.PI * 1.05, Math.PI * 1.95);
        ctx.closePath();
        ctx.fillStyle = '#451A03';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#78350F';
        ctx.stroke();
      }
    }));

    // 10. Bronze Shield
    this.register(new Charm({
      id: 'bronze_shield',
      name: 'Bronze Shield',
      category: 'Metallic',
      radius: 24,
      render: (ctx, radius, isGrabbed) => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        const r = radius * 0.95;
        ctx.beginPath();
        ctx.moveTo(-r * 0.9, -r * 0.8);
        ctx.lineTo(r * 0.9, -r * 0.8);
        ctx.lineTo(r * 0.9, r * 0.1);
        ctx.bezierCurveTo(r * 0.8, r * 0.7, 0, r * 1.1, 0, r * 1.2);
        ctx.bezierCurveTo(0, r * 1.1, -r * 0.8, r * 0.7, -r * 0.9, r * 0.1);
        ctx.closePath();

        const grad = ctx.createLinearGradient(-r, -r, r, r);
        grad.addColorStop(0, '#FDBA74');
        grad.addColorStop(0.5, '#C2410C');
        grad.addColorStop(1, '#7C2D12');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#FDBA74';
        ctx.stroke();
      }
    }));

    // 11. Crystal Diamond
    this.register(new Charm({
      id: 'diamond_gem',
      name: 'Crystal Diamond',
      category: 'Gems',
      radius: 24,
      render: (ctx, radius, isGrabbed) => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        const r = radius * 0.95;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.1);
        ctx.lineTo(r, -r * 0.3);
        ctx.lineTo(0, r * 1.1);
        ctx.lineTo(-r, -r * 0.3);
        ctx.closePath();

        const grad = ctx.createLinearGradient(-r, -r, r, r);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.4, '#CFFAFE');
        grad.addColorStop(0.8, '#38BDF8');
        grad.addColorStop(1, '#0284C7');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isGrabbed ? '#38BDF8' : '#FFFFFF';
        ctx.stroke();
      }
    }));

    // 12. Cherry Blossom
    this.register(new Charm({
      id: 'cherry_blossom',
      name: 'Cherry Blossom',
      category: 'Nature',
      radius: 24,
      render: (ctx, radius, isGrabbed) => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        const petals = 5;
        const r = radius * 0.95;

        for (let i = 0; i < petals; i++) {
          const angle = (i * Math.PI * 2) / petals - Math.PI / 2;
          ctx.save();
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.ellipse(0, -r * 0.6, r * 0.35, r * 0.55, 0, 0, Math.PI * 2);
          const pGrad = ctx.createRadialGradient(0, -r * 0.6, 2, 0, -r * 0.6, r * 0.55);
          pGrad.addColorStop(0, '#FCE7F3');
          pGrad.addColorStop(0.6, '#F472B6');
          pGrad.addColorStop(1, '#DB2777');
          ctx.fillStyle = pGrad;
          ctx.fill();
          ctx.restore();
        }

        ctx.shadowColor = 'transparent';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = '#FDE047';
        ctx.fill();
      }
    }));

    // 13. Cosmic Prism
    this.register(new Charm({
      id: 'cosmic_star',
      name: 'Cosmic Prism',
      category: 'Celestial',
      radius: 24,
      render: (ctx, radius, isGrabbed) => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        const r = radius * 0.95;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.15);
        ctx.lineTo(r * 0.95, 0);
        ctx.lineTo(0, r * 1.15);
        ctx.lineTo(-r * 0.95, 0);
        ctx.closePath();

        const grad = ctx.createLinearGradient(-r, -r, r, r);
        grad.addColorStop(0, '#F472B6');
        grad.addColorStop(0.33, '#C084FC');
        grad.addColorStop(0.66, '#60A5FA');
        grad.addColorStop(1, '#34D399');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
      }
    }));
  }

  register(charm) {
    if (charm && charm.id) {
      this.charmsMap.set(charm.id, charm);
    }
  }

  getAllCharms() {
    const builtIn = Array.from(this.charmsMap.values());
    const custom = this.customStore.loadCustomCharms();
    return [...builtIn, ...custom];
  }

  getCharm(id) {
    if (id && this.charmsMap.has(id)) {
      return this.charmsMap.get(id);
    }
    if (id && this.customStore.customCharmsMap.has(id)) {
      return this.customStore.customCharmsMap.get(id);
    }
    console.warn(`Charm ID "${id}" not found. Falling back to default "${this.FALLBACK_ID}".`);
    return this.charmsMap.get(this.FALLBACK_ID);
  }

  async addCustomCharm(name, dataUrl) {
    const charm = await this.customStore.addCustomCharm(name, dataUrl);
    this.setActiveCharm(charm.id);
    return charm;
  }

  saveCustomizedCharm(name, sourceCharm, settings) {
    const charm = this.customStore.saveCustomizedCharm(name, sourceCharm, settings);
    this.setActiveCharm(charm.id);
    return charm;
  }

  removeCustomCharm(id) {
    const removed = this.customStore.removeCustomCharm(id);
    if (removed) {
      if (this.activeCharmId === id) {
        this.setActiveCharm(this.FALLBACK_ID);
      }
    }
    return removed;
  }

  getActiveCharm() {
    return this.getCharm(this.activeCharmId);
  }

  setActiveCharm(id) {
    const charm = this.getCharm(id);
    if (charm) {
      this.activeCharmId = charm.id;
      try {
        localStorage.setItem(this.STORAGE_KEY, charm.id);
      } catch (err) {
        console.error('Failed to save selected charm to localStorage:', err);
      }
      return true;
    }
    return false;
  }

  loadSavedCharmId() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved && (this.charmsMap.has(saved) || this.customStore.customCharmsMap.has(saved))) {
        return saved;
      }
    } catch (err) {
      console.warn('Could not read saved charm ID:', err);
    }
    return this.FALLBACK_ID;
  }
}
