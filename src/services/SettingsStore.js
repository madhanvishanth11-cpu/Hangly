/**
 * SettingsStore - Manages user settings persistence, schema validation,
 * change listeners, and safe default settings restoration.
 */
export class SettingsStore {
  constructor() {
    this.STORAGE_KEY = 'hangly_user_settings';
    this.listeners = [];

    this.defaults = {
      soundsEnabled: true,
      volume: 0.5,
      showBeads: true,
      rememberCharm: true,
      motionIntensity: 'normal', // 'low' | 'normal' | 'high'
      charmScale: 1.0,           // 0.6 - 1.6
      launchAtStartup: false,
      showDesktopCharm: true,
      hasSeenWelcome: false
    };

    this.settings = this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return this.validateSettings(parsed);
      }
    } catch (err) {
      console.warn('Failed to read settings from localStorage, restoring defaults:', err);
    }
    return { ...this.defaults };
  }

  /**
   * Validate and sanitize settings values against schema limits
   * @param {Object} raw 
   * @returns {Object}
   */
  validateSettings(raw) {
    if (!raw || typeof raw !== 'object') return { ...this.defaults };

    const valid = { ...this.defaults };

    if (typeof raw.soundsEnabled === 'boolean') valid.soundsEnabled = raw.soundsEnabled;
    if (typeof raw.showBeads === 'boolean') valid.showBeads = raw.showBeads;
    if (typeof raw.rememberCharm === 'boolean') valid.rememberCharm = raw.rememberCharm;
    if (typeof raw.launchAtStartup === 'boolean') valid.launchAtStartup = raw.launchAtStartup;
    if (typeof raw.showDesktopCharm === 'boolean') valid.showDesktopCharm = raw.showDesktopCharm;
    if (typeof raw.hasSeenWelcome === 'boolean') valid.hasSeenWelcome = raw.hasSeenWelcome;

    if (typeof raw.volume === 'number' && !isNaN(raw.volume)) {
      valid.volume = Math.max(0, Math.min(1.0, raw.volume));
    }

    if (typeof raw.charmScale === 'number' && !isNaN(raw.charmScale)) {
      valid.charmScale = Math.max(0.6, Math.min(1.6, raw.charmScale));
    }

    if (['low', 'normal', 'high'].includes(raw.motionIntensity)) {
      valid.motionIntensity = raw.motionIntensity;
    }

    return valid;
  }

  get(key) {
    return this.settings[key] !== undefined ? this.settings[key] : this.defaults[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this.save();
  }

  update(partialSettings) {
    this.settings = { ...this.settings, ...partialSettings };
    this.save();
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }

  /**
   * Reset settings to default values without modifying custom charms
   */
  resetToDefaults() {
    this.settings = { ...this.defaults };
    this.save();
  }

  onChange(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
    }
  }

  notifyListeners() {
    this.listeners.forEach(fn => {
      try {
        fn(this.settings);
      } catch (err) {
        console.error('Error in settings listener:', err);
      }
    });
  }
}
