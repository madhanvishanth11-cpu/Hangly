/**
 * SoundManager - Synthesizes realistic audio effects (grab clicks, throw whooshes,
 * and sway chimes) using the Web Audio API without external file dependencies.
 */
export class SoundManager {
  constructor() {
    this.enabled = true;
    this.volume = 0.5;
    this.audioCtx = null;
    this.lastChimeTime = 0;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  ensureContext() {
    this.init();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Play metallic click/clink sound on charm grab
   */
  playGrabSound() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Play release whoosh sound proportional to throw velocity
   * @param {number} speed Velocity speed in px/sec
   */
  playReleaseSound(speed = 0) {
    if (!this.enabled || speed < 150) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const intensity = Math.min(1.0, speed / 1500);

    // Create white noise buffer for whoosh
    const bufferSize = this.audioCtx.sampleRate * 0.15;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.audioCtx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400 + intensity * 600, now);
    filter.Q.setValueAtTime(2.0, now);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.3 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.15);
  }

  /**
   * Play gentle metallic chime when rope sways with high kinetic energy
   */
  playSwayChime() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    if (now - this.lastChimeTime < 0.6) return; // Throttle chimes
    this.lastChimeTime = now;

    const freqs = [1046.5, 1318.5, 1567.98]; // C6, E6, G6 chime harmonics
    const freq = freqs[Math.floor(Math.random() * freqs.length)];

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(this.volume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }
}
