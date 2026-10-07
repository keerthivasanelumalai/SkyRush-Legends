/**
 * SkyRush Legends - High Performance Particle & Weather Engine
 * Object pooling for smooth 60 FPS on both mobile and desktop.
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.weatherParticles = [];
    this.lightningFlash = 0;
    this.maxParticles = 300;
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.weatherParticles = [];
    this.lightningFlash = 0;
  }

  // Spawn general particle
  spawn(x, y, options = {}) {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift(); // Evict oldest
    }

    const {
      vx = (Math.random() - 0.5) * 100,
      vy = (Math.random() - 0.5) * 100,
      size = Math.random() * 4 + 2,
      color = '#ffffff',
      life = 0.5,
      gravity = 0,
      shape = 'circle', // 'circle', 'spark', 'feather', 'ring'
      decay = 1
    } = options;

    this.particles.push({
      x,
      y,
      vx,
      vy,
      size,
      initialSize: size,
      color,
      life,
      maxLife: life,
      gravity,
      shape,
      decay,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 8
    });
  }

  // Flap wing exhaust/feathers
  emitFlapFeathers(x, y, skinColor = '#60a5fa') {
    const count = 4;
    for (let i = 0; i < count; i++) {
      this.spawn(x - 15, y + (Math.random() * 10 - 5), {
        vx: -Math.random() * 80 - 40,
        vy: Math.random() * 60 - 20,
        size: Math.random() * 5 + 3,
        color: skinColor,
        life: 0.4,
        gravity: 60,
        shape: 'feather'
      });
    }
  }

  // Coin collected sparkle ring
  emitCoinSparkles(x, y, color = '#fbbf24') {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = Math.random() * 120 + 80;
      this.spawn(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: color,
        life: 0.5,
        shape: 'spark'
      });
    }
  }

  // Perfect pass sonic boom ring
  emitPerfectPassShockwave(x, y) {
    this.spawn(x, y, {
      vx: 0,
      vy: 0,
      size: 15,
      color: '#38bdf8',
      life: 0.45,
      shape: 'ring'
    });
    this.addFloatingText(x, y - 25, 'PERFECT PASS!', '#38bdf8', 1.3);
  }

  // Player crash explosion
  emitExplosion(x, y, color = '#f59e0b') {
    const count = 35;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 260 + 50;
      this.spawn(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 3,
        color: Math.random() > 0.5 ? color : '#ffffff',
        life: 0.8,
        gravity: 120,
        shape: 'spark'
      });
    }
  }

  // Floating score/combo labels
  addFloatingText(x, y, text, color = '#fbbf24', scale = 1.0) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      scale,
      life: 0.8,
      maxLife: 0.8,
      vy: -50
    });
  }

  // Trigger lightning storm flash
  triggerLightning() {
    this.lightningFlash = 0.8; // opacity
  }

  // Update weather particles based on current world biome
  updateWeather(dt, camera, biome = 'meadow') {
    const settings = window.storageManager?.state?.settings || {};
    if (settings.particles === 0) return;

    const visibleLeft = camera.x - 100;
    const visibleRight = camera.x + camera.virtualWidth + 100;

    // Biome specific spawn
    if (biome === 'storm') {
      // Rain drops
      if (this.weatherParticles.length < 120) {
        this.weatherParticles.push({
          x: visibleLeft + Math.random() * (camera.virtualWidth + 200),
          y: -20,
          vx: -150,
          vy: 650,
          length: 18,
          color: 'rgba(186, 230, 253, 0.6)',
          type: 'rain'
        });
      }
      if (Math.random() < 0.005) {
        this.triggerLightning();
      }
    } else if (biome === 'frozen') {
      // Gentle snow flakes
      if (this.weatherParticles.length < 80) {
        this.weatherParticles.push({
          x: visibleLeft + Math.random() * (camera.virtualWidth + 200),
          y: -10,
          vx: (Math.random() - 0.5) * 40 - 20,
          vy: Math.random() * 50 + 40,
          size: Math.random() * 3 + 2,
          color: 'rgba(255, 255, 255, 0.8)',
          type: 'snow'
        });
      }
    } else if (biome === 'volcanic') {
      // Rising fire embers
      if (this.weatherParticles.length < 60) {
        this.weatherParticles.push({
          x: visibleLeft + Math.random() * (camera.virtualWidth + 200),
          y: camera.virtualHeight + 10,
          vx: (Math.random() - 0.5) * 50 - 30,
          vy: -Math.random() * 90 - 40,
          size: Math.random() * 3 + 2,
          color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
          type: 'ember'
        });
      }
    } else if (biome === 'cosmic' || biome === 'neon') {
      // Drifting astral dust
      if (this.weatherParticles.length < 40) {
        this.weatherParticles.push({
          x: visibleRight,
          y: Math.random() * camera.virtualHeight,
          vx: -Math.random() * 50 - 20,
          vy: (Math.random() - 0.5) * 20,
          size: Math.random() * 2 + 1,
          color: biome === 'neon' ? '#06b6d4' : '#e879f9',
          type: 'stardust'
        });
      }
    }

    // Update active weather particles
    for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
      const wp = this.weatherParticles[i];
      wp.x += wp.vx * dt;
      wp.y += wp.vy * dt;

      if (wp.y > camera.virtualHeight + 50 || wp.y < -50 || wp.x < visibleLeft - 100) {
        this.weatherParticles.splice(i, 1);
      }
    }

    // Decay lightning flash
    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 2.5);
    }
  }

  update(dt) {
    // Update general particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;

      if (p.shape === 'ring') {
        p.size += dt * 90; // Expanding shockwave ring
      } else {
        p.size = p.initialSize * (p.life / p.maxLife);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt;
    }
  }

  render(ctx) {
    // Render Weather
    for (let i = 0; i < this.weatherParticles.length; i++) {
      const wp = this.weatherParticles[i];
      ctx.fillStyle = wp.color;

      if (wp.type === 'rain') {
        ctx.strokeStyle = wp.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(wp.x, wp.y);
        ctx.lineTo(wp.x - 4, wp.y + wp.length);
        ctx.stroke();
      } else if (wp.type === 'snow' || wp.type === 'ember' || wp.type === 'stardust') {
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, wp.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Render Lightning Flash Overlay
    if (this.lightningFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.4})`;
      ctx.fillRect(-1000, -1000, 100000, 10000);
    }

    // Render Particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const alpha = Math.max(0, p.life / p.maxLife);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;

      if (p.shape === 'circle') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.5, p.size), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 1.5);
        ctx.lineTo(p.size * 0.5, 0);
        ctx.lineTo(0, p.size * 1.5);
        ctx.lineTo(-p.size * 0.5, 0);
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === 'feather') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.8, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Render Floating Texts
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      const alpha = Math.max(0, ft.life / ft.maxLife);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${Math.round(20 * ft.scale)}px Outfit, sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}

window.ParticleSystem = ParticleSystem;
