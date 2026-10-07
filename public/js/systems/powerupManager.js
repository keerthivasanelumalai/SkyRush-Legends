/**
 * SkyRush Legends - Tactical Power-Up Engine
 * Manages active timers, player buffs, and in-game HUD displays.
 */
class PowerupManager {
  constructor() {
    this.activePowerups = new Map();
  }

  reset() {
    this.activePowerups.clear();
  }

  activate(type, player) {
    let duration = 8;
    let name = 'Power-Up';

    if (type === 'powerup_shield') {
      player.shieldActive = true;
      name = 'Shield';
      duration = 999; // Stays active until collision
    } else if (type === 'powerup_magnet') {
      player.magnetActive = true;
      name = 'Magnet';
      duration = 8;
    } else if (type === 'powerup_slowmo') {
      name = 'Slow-Mo';
      duration = 6;
    } else if (type === 'powerup_double') {
      name = '2x Coins';
      duration = 8;
    } else if (type === 'powerup_boost') {
      player.speedBoostActive = true;
      player.invulnerableTimer = 3.5;
      name = 'Sonic Boost';
      duration = 3.5;
    }

    this.activePowerups.set(type, {
      type,
      name,
      duration,
      maxDuration: duration,
      remaining: duration
    });

    if (window.soundManager) {
      window.soundManager.playPowerup();
    }
  }

  has(type) {
    return this.activePowerups.has(type);
  }

  update(dt, player) {
    for (const [type, p] of this.activePowerups.entries()) {
      if (type === 'powerup_shield') continue; // Shield handled on hit

      p.remaining -= dt;

      if (p.remaining <= 0) {
        this.deactivate(type, player);
      }
    }
  }

  deactivate(type, player) {
    this.activePowerups.delete(type);

    if (type === 'powerup_shield') {
      player.shieldActive = false;
    } else if (type === 'powerup_magnet') {
      player.magnetActive = false;
    } else if (type === 'powerup_boost') {
      player.speedBoostActive = false;
    }
  }

  breakShield(player) {
    if (this.has('powerup_shield')) {
      this.deactivate('powerup_shield', player);
      player.invulnerableTimer = 1.6; // Grace period after shield break

      if (window.soundManager) {
        window.soundManager.playShieldBreak();
      }
      if (window.gameEngine && window.gameEngine.camera) {
        window.gameEngine.camera.shake(12, 300);
      }
      return true; // Absorbed!
    }
    return false;
  }
}

window.PowerupManager = PowerupManager;
