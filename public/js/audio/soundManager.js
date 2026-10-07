/**
 * SkyRush Legends - Web Audio Procedural Sound & Music Engine
 * Zero external asset dependencies. High fidelity synth harmonies and SFX.
 */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.masterGain = null;

    this.musicVolume = 0.6;
    this.sfxVolume = 0.8;
    this.isMuted = false;

    this.currentTrack = null;
    this.musicInterval = null;
    this.activeOscillators = [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.setMusicVolume(this.musicVolume);
      this.setSfxVolume(this.sfxVolume);

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.isMuted ? 0 : this.musicVolume * 0.4, this.ctx.currentTime);
    }
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.setMusicVolume(this.musicVolume);
    this.setSfxVolume(this.sfxVolume);
    return this.isMuted;
  }

  /* ==========================================
     SOUND EFFECTS GENERATORS
     ========================================== */

  // Player flap / jump: soft airy upward sweep
  playFlap() {
    if (this.isMuted || !this.initialized) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(360, t + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.15);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Coin collected: Crisp dual-tone chime
  playCoin() {
    if (this.isMuted || !this.initialized) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const freqs = [987.77, 1318.51]; // B5 -> E6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.2, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.2);
    });
  }

  // Gem collected: High crystal triad
  playGem() {
    if (this.isMuted || !this.initialized) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const notes = [1046.50, 1318.51, 1567.98]; // C6, E6, G6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.25, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.26);
    });
  }

  // Perfect Pass: supersonic whoosh + bright resonant ring
  playPerfectPass() {
    if (this.isMuted || !this.initialized) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, t); // A6
    osc.frequency.exponentialRampToValueAtTime(2349, t + 0.25); // D7

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  // Combo step: ascending pitch stinger
  playCombo(level = 1) {
    if (this.isMuted || !this.initialized) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const baseFreq = 440; // A4
    const semitones = Math.min(12, level * 2);
    const freq = baseFreq * Math.pow(2, semitones / 12);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, t + 0.15);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Power-up collect: 4-note ascending power chord
  playPowerup() {
    if (this.isMuted || !this.initialized) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const chord = [392.00, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.18, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.32);
    });
  }

  // Shield break: Glass crack + dispersing burst
  playShieldBreak() {
    if (this.isMuted || !this.initialized) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.25);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Hit / Crash: Deep impact thud
  playHit() {
    if (this.isMuted || !this.initialized) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  // UI Button Click: tactile tick
  playClick() {
    if (this.isMuted || !this.initialized) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // UI Button Hover: subtle high tick
  playHover() {
    if (this.isMuted || !this.initialized) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);

    gain.gain.setValueAtTime(0.03, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // Level Complete fanfare
  playVictory() {
    if (this.isMuted || !this.initialized) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const fanfare = [
      { f: 523.25, time: 0 },    // C5
      { f: 659.25, time: 0.12 }, // E5
      { f: 783.99, time: 0.24 }, // G5
      { f: 1046.50, time: 0.38 } // C6
    ];

    fanfare.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t + note.time);

      gain.gain.setValueAtTime(0.25, t + note.time);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.time + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + note.time);
      osc.stop(t + note.time + 0.45);
    });
  }

  // Achievement unlock fanfare
  playAchievement() {
    if (this.isMuted || !this.initialized) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const chords = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
    chords.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + idx * 0.07);

      gain.gain.setValueAtTime(0.2, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.55);
    });
  }

  /* ==========================================
     SYNTHESIZER MUSIC SEQUENCER
     Atmospheric ambient chords + rhythmic bass
     ========================================== */

  playMusic(theme = 'menu') {
    if (!this.initialized) return;
    this.ensureContext();
    if (this.currentTrack === theme) return;

    this.stopMusic();
    this.currentTrack = theme;

    const tempo = theme === 'menu' ? 95 : 124;
    const stepDuration = 60 / tempo / 2; // eighth notes

    // Chord progressions per theme (Frequencies in Hz)
    const progressions = {
      menu: [
        [220, 261.63, 329.63, 392.00], // Am7
        [174.61, 220, 261.63, 329.63], // Fmaj7
        [261.63, 329.63, 392.00, 523.25], // Cmaj
        [196.00, 246.94, 293.66, 392.00]  // Gmaj
      ],
      gameplay: [
        [146.83, 220, 293.66, 349.23], // Dm
        [130.81, 196, 261.63, 329.63], // C
        [116.54, 174.61, 233.08, 293.66], // Bb
        [130.81, 164.81, 196.00, 246.94]  // G
      ]
    };

    const chords = progressions[theme] || progressions.gameplay;
    let currentChordIdx = 0;
    let step = 0;

    const playStep = () => {
      if (!this.ctx || this.isMuted) return;

      const t = this.ctx.currentTime;
      const chord = chords[currentChordIdx];

      // Arpeggiate chord notes
      const noteFreq = chord[step % chord.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = theme === 'menu' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(noteFreq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(theme === 'menu' ? 600 : 1200, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 1.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(t);
      osc.stop(t + stepDuration * 1.6);

      // Bass pulse on beat 1 and 3
      if (step === 0 || step === 4) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(chord[0] / 2, t);
        bassGain.gain.setValueAtTime(0.12, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 2);

        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain);
        bassOsc.start(t);
        bassOsc.stop(t + stepDuration * 2.1);
      }

      step++;
      if (step >= 8) {
        step = 0;
        currentChordIdx = (currentChordIdx + 1) % chords.length;
      }
    };

    this.musicInterval = setInterval(playStep, stepDuration * 1000);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentTrack = null;
  }
}

// Global Sound Instance
window.soundManager = new SoundManager();
