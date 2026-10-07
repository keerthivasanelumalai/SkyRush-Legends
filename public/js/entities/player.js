/**
 * SkyRush Legends - Player Entity "Astra"
 * The Celestial Starwing Swift with 9 distinct animated skins, wing aerodynamics, and visual auras.
 */
class Player {
  constructor(x = 200, y = 360) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.vy = 0;
    this.rotation = 0;
    this.radius = 20; // Collision hitbox radius (generous and fair)

    // Wing flapping animation state
    this.wingAngle = 0;
    this.wingSpeed = 8;
    this.flapTimer = 0;

    // Skin & Cosmetics
    this.skin = 'classic';
    this.trail = 'starlight';
    this.particleType = 'sparks';

    // States
    this.isDead = false;
    this.invulnerableTimer = 0;
    this.shieldActive = false;
    this.magnetActive = false;
    this.speedBoostActive = false;
    this.flapCount = 0;

    // Rainbow hue timer
    this.rainbowHue = 0;
  }

  reset(x = 200, y = 360) {
    this.x = x;
    this.y = y;
    this.vy = 0;
    this.rotation = 0;
    this.isDead = false;
    this.invulnerableTimer = 0;
    this.shieldActive = false;
    this.magnetActive = false;
    this.speedBoostActive = false;
    this.flapCount = 0;
    this.wingAngle = 0;

    // Load equipped skin from storage
    if (window.storageManager) {
      this.skin = window.storageManager.getEquippedSkin();
      this.trail = window.storageManager.getEquippedTrail();
    }
  }

  flap(impulse = -390) {
    if (this.isDead) return;

    this.vy = impulse;
    this.flapTimer = 0.25; // Wing flap animation burst
    this.flapCount++;

    // Audio
    if (window.soundManager) {
      window.soundManager.playFlap();
    }

    // Particle feathers emit
    if (window.gameEngine && window.gameEngine.particles) {
      const colors = this.getSkinColors();
      window.gameEngine.particles.emitFlapFeathers(this.x, this.y, colors.wing);
    }
  }

  update(dt) {
    // Rainbow hue increment
    this.rainbowHue = (this.rainbowHue + dt * 180) % 360;

    // Wing flap animation
    if (this.flapTimer > 0) {
      this.flapTimer -= dt;
      this.wingAngle = Math.sin(Date.now() * 0.04) * 0.9;
    } else {
      // Idle gliding flutter
      this.wingAngle = Math.sin(Date.now() * 0.01) * 0.3;
    }

    // Invulnerability decay
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Emit trail particles
    if (window.gameEngine && window.gameEngine.particles && !this.isDead) {
      this.emitTrailParticles();
    }
  }

  emitTrailParticles() {
    const p = window.gameEngine.particles;
    const colors = this.getSkinColors();

    if (this.trail === 'starlight') {
      if (Math.random() < 0.4) {
        p.spawn(this.x - 22, this.y + (Math.random() * 8 - 4), {
          vx: -60, vy: (Math.random() - 0.5) * 20,
          size: Math.random() * 3 + 1,
          color: colors.primary, life: 0.35, shape: 'spark'
        });
      }
    } else if (this.trail === 'plasma_fire') {
      p.spawn(this.x - 24, this.y + (Math.random() * 10 - 5), {
        vx: -90, vy: (Math.random() - 0.5) * 30,
        size: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
        life: 0.3, shape: 'circle'
      });
    } else if (this.trail === 'frost_crystal') {
      p.spawn(this.x - 24, this.y + (Math.random() * 8 - 4), {
        vx: -60, vy: (Math.random() - 0.5) * 15,
        size: Math.random() * 3 + 2,
        color: '#bae6fd', life: 0.4, shape: 'spark'
      });
    } else if (this.trail === 'rainbow_stream') {
      p.spawn(this.x - 24, this.y, {
        vx: -70, vy: (Math.random() - 0.5) * 25,
        size: 3.5,
        color: `hsl(${this.rainbowHue}, 90%, 65%)`,
        life: 0.4, shape: 'circle'
      });
    } else if (this.trail === 'shadow_smoke') {
      p.spawn(this.x - 24, this.y + (Math.random() * 12 - 6), {
        vx: -50, vy: (Math.random() - 0.5) * 35,
        size: Math.random() * 5 + 3,
        color: 'rgba(30, 27, 75, 0.7)', life: 0.5, shape: 'circle'
      });
    }

    // Speed boost special rocket blast
    if (this.speedBoostActive) {
      p.spawn(this.x - 30, this.y, {
        vx: -220, vy: (Math.random() - 0.5) * 40,
        size: 5, color: '#f43f5e', life: 0.25, shape: 'spark'
      });
    }
  }

  getSkinColors() {
    switch (this.skin) {
      case 'golden':
        return { body: '#fbbf24', wing: '#f59e0b', belly: '#fef08a', eye: '#1e1b4b', primary: '#fef08a', glow: 'rgba(251, 191, 36, 0.8)' };
      case 'neon':
        return { body: '#06b6d4', wing: '#ec4899', belly: '#3b82f6', eye: '#ffffff', primary: '#22d3ee', glow: 'rgba(6, 182, 212, 0.8)' };
      case 'fire':
        return { body: '#ef4444', wing: '#f97316', belly: '#fbbf24', eye: '#ffffff', primary: '#f97316', glow: 'rgba(239, 68, 68, 0.8)' };
      case 'ice':
        return { body: '#38bdf8', wing: '#0284c7', belly: '#e0f2fe', eye: '#0369a1', primary: '#38bdf8', glow: 'rgba(56, 189, 248, 0.8)' };
      case 'galaxy':
        return { body: '#6366f1', wing: '#a855f7', belly: '#312e81', eye: '#ec4899', primary: '#c084fc', glow: 'rgba(168, 85, 247, 0.8)' };
      case 'shadow':
        return { body: '#1e1b4b', wing: '#0f172a', belly: '#312e81', eye: '#ef4444', primary: '#dc2626', glow: 'rgba(239, 68, 68, 0.7)' };
      case 'rainbow':
        const h = this.rainbowHue;
        return { body: `hsl(${h}, 85%, 60%)`, wing: `hsl(${(h+60)%360}, 90%, 65%)`, belly: `hsl(${(h+180)%360}, 90%, 75%)`, eye: '#ffffff', primary: '#ffffff', glow: `hsl(${h}, 90%, 60%)` };
      case 'legendary':
        return { body: '#fef08a', wing: '#fbbf24', belly: '#ffffff', eye: '#6366f1', primary: '#fbbf24', glow: 'rgba(254, 240, 138, 0.9)' };
      case 'classic':
      default:
        return { body: '#3b82f6', wing: '#1d4ed8', belly: '#93c5fd', eye: '#ffffff', primary: '#60a5fa', glow: 'rgba(59, 130, 246, 0.6)' };
    }
  }

  render(ctx) {
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      return; // Flicker when invincible
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const colors = this.getSkinColors();

    // Subtle creature aura glow
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 15;

    // Back Wing (Upper)
    ctx.save();
    ctx.translate(-4, -6);
    ctx.rotate(-this.wingAngle);
    ctx.fillStyle = colors.wing;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-14, -26, 6, -24);
    ctx.quadraticCurveTo(12, -14, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Body (Aerodynamic teardrop)
    ctx.fillStyle = colors.body;
    ctx.beginPath();
    ctx.moveTo(22, 0); // Beak tip
    ctx.quadraticCurveTo(8, -14, -14, -10); // Upper back
    ctx.quadraticCurveTo(-26, 0, -22, 6);   // Tail
    ctx.quadraticCurveTo(-6, 16, 14, 8);    // Lower belly
    ctx.closePath();
    ctx.fill();

    // Belly Accent
    ctx.fillStyle = colors.belly;
    ctx.beginPath();
    ctx.moveTo(12, 6);
    ctx.quadraticCurveTo(-2, 14, -14, 4);
    ctx.quadraticCurveTo(-2, 4, 12, 6);
    ctx.closePath();
    ctx.fill();

    // Crest / Forehead Feathers
    ctx.fillStyle = colors.wing;
    ctx.beginPath();
    ctx.moveTo(6, -11);
    ctx.quadraticCurveTo(-2, -22, -10, -14);
    ctx.quadraticCurveTo(-4, -10, 6, -11);
    ctx.closePath();
    ctx.fill();

    // Eye (Luminescent & Sharp)
    ctx.fillStyle = colors.eye;
    ctx.beginPath();
    ctx.arc(10, -4, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a'; // Pupil
    ctx.beginPath();
    ctx.arc(11, -4, 2, 0, Math.PI * 2);
    ctx.fill();

    // Beak (Golden celestial horn)
    ctx.fillStyle = colors.skin === 'golden' ? '#ffffff' : '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(18, -3);
    ctx.lineTo(26, 0);
    ctx.lineTo(16, 4);
    ctx.closePath();
    ctx.fill();

    // Front Wing (Lower)
    ctx.save();
    ctx.translate(-2, 2);
    ctx.rotate(this.wingAngle);
    ctx.fillStyle = colors.wing;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-18, -20, 4, -22);
    ctx.quadraticCurveTo(10, -10, 0, 0);
    ctx.closePath();
    ctx.fill();

    // Wing Feather Details
    ctx.strokeStyle = colors.belly;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, -8);
    ctx.lineTo(2, -18);
    ctx.stroke();
    ctx.restore();

    // Legendary Sovereign Crown / Divine Halo
    if (this.skin === 'legendary') {
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore(); // Restore base transform

    // Render Active In-Game Power-Up Auras (Centered on player, not rotated)
    if (this.shieldActive) {
      ctx.save();
      ctx.translate(this.x, this.y);
      const shieldPulse = Math.sin(Date.now() * 0.008) * 3;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 12 + shieldPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (this.magnetActive) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

window.Player = Player;
