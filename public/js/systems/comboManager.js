/**
 * SkyRush Legends - Skill Combo & Multiplier System
 * Rewards daring near-misses, coin streaks, and continuous flight precision.
 */
class ComboManager {
  constructor() {
    this.combo = 0;
    this.maxCombo = 0;
    this.multiplier = 1;
    this.timer = 0;
    this.maxTimer = 3.5;
  }

  reset() {
    this.combo = 0;
    this.maxCombo = 0;
    this.multiplier = 1;
    this.timer = 0;
  }

  addCombo(amount = 1) {
    this.combo += amount;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    this.timer = this.maxTimer;

    // Calculate Multiplier Tier
    if (this.combo >= 35) this.multiplier = 10;
    else if (this.combo >= 20) this.multiplier = 5;
    else if (this.combo >= 10) this.multiplier = 3;
    else if (this.combo >= 5) this.multiplier = 2;
    else this.multiplier = 1;

    // Pitch rises with combo level
    if (window.soundManager) {
      window.soundManager.playCombo(Math.min(10, Math.floor(this.combo / 3)));
    }
  }

  update(dt) {
    if (this.combo > 0) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.reset();
      }
    }
  }

  getMultiplier() {
    return this.multiplier;
  }
}

window.ComboManager = ComboManager;
