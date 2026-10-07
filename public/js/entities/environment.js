/**
 * SkyRush Legends - Dynamic Multi-Layer Parallax Environment System
 * 8 Immersive Biomes with procedural layered mountains, floating islands, and celestial domes.
 */
class Environment {
  constructor() {
    this.biome = 'meadow';
    this.timeOfDay = 0; // Animation counter
  }

  setBiome(biomeName) {
    this.biome = biomeName || 'meadow';
  }

  update(dt) {
    this.timeOfDay += dt;
  }

  render(ctx, camera) {
    const w = camera.virtualWidth;
    const h = camera.virtualHeight;
    const camX = camera.x;

    ctx.save();

    // 1. Sky Dome (Fixed to camera viewport)
    this.renderSkyDome(ctx, camX, w, h);

    // 2. Distant Celestial Objects (Sun / Moon / Nebula)
    this.renderCelestialBody(ctx, camX, w, h);

    // 3. Far Layer (0.1x parallax speed - distant mountains / sky banks)
    this.renderFarLayer(ctx, camX, w, h);

    // 4. Midground Layer (0.35x parallax speed - floating sky temples / islands)
    this.renderMidgroundLayer(ctx, camX, w, h);

    // 5. Near Clouds / Vegetation (0.7x parallax speed)
    this.renderNearLayer(ctx, camX, w, h);

    ctx.restore();
  }

  renderSkyDome(ctx, camX, w, h) {
    const skyGrad = ctx.createLinearGradient(camX, 0, camX, h);

    switch (this.biome) {
      case 'cloud_kingdom':
        skyGrad.addColorStop(0, '#f472b6');
        skyGrad.addColorStop(0.5, '#fb923c');
        skyGrad.addColorStop(1, '#fed7aa');
        break;
      case 'storm':
        skyGrad.addColorStop(0, '#0f172a');
        skyGrad.addColorStop(0.6, '#1e1b4b');
        skyGrad.addColorStop(1, '#312e81');
        break;
      case 'sunset':
        skyGrad.addColorStop(0, '#701a75');
        skyGrad.addColorStop(0.4, '#c026d3');
        skyGrad.addColorStop(1, '#fbbf24');
        break;
      case 'frozen':
        skyGrad.addColorStop(0, '#0c4a6e');
        skyGrad.addColorStop(0.6, '#0284c7');
        skyGrad.addColorStop(1, '#bae6fd');
        break;
      case 'neon':
        skyGrad.addColorStop(0, '#090514');
        skyGrad.addColorStop(0.6, '#2e1065');
        skyGrad.addColorStop(1, '#701a75');
        break;
      case 'volcanic':
        skyGrad.addColorStop(0, '#1c1917');
        skyGrad.addColorStop(0.6, '#7f1d1d');
        skyGrad.addColorStop(1, '#ea580c');
        break;
      case 'cosmic':
        skyGrad.addColorStop(0, '#020617');
        skyGrad.addColorStop(0.5, '#0f172a');
        skyGrad.addColorStop(1, '#1e1b4b');
        break;
      case 'meadow':
      default:
        skyGrad.addColorStop(0, '#38bdf8');
        skyGrad.addColorStop(0.6, '#7dd3fc');
        skyGrad.addColorStop(1, '#bae6fd');
        break;
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(camX, 0, w, h);
  }

  renderCelestialBody(ctx, camX, w, h) {
    const bodyX = camX + w * 0.75;
    const bodyY = h * 0.22;

    ctx.save();
    if (this.biome === 'cosmic' || this.biome === 'neon') {
      // Swirling Galaxy Nebula / Digital Sun
      const radGrad = ctx.createRadialGradient(bodyX, bodyY, 10, bodyX, bodyY, 80);
      radGrad.addColorStop(0, this.biome === 'neon' ? '#ec4899' : '#c084fc');
      radGrad.addColorStop(0.6, this.biome === 'neon' ? 'rgba(236, 72, 153, 0.4)' : 'rgba(192, 132, 252, 0.3)');
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(bodyX, bodyY, 80, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Golden Sun or Celestial Moon
      ctx.fillStyle = this.biome === 'frozen' ? '#e0f2fe' : '#fef08a';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 35;
      ctx.beginPath();
      ctx.arc(bodyX, bodyY, 42, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderFarLayer(ctx, camX, w, h) {
    const speed = 0.1;
    const offsetX = (camX * speed) % 800;
    const startX = camX - offsetX - 800;

    ctx.save();
    ctx.fillStyle = this.getFarLayerColor();

    for (let x = startX; x < camX + w + 800; x += 800) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x, h - 220);
      ctx.quadraticCurveTo(x + 200, h - 380, x + 400, h - 220);
      ctx.quadraticCurveTo(x + 600, h - 420, x + 800, h - 220);
      ctx.lineTo(x + 800, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  getFarLayerColor() {
    switch (this.biome) {
      case 'cloud_kingdom': return 'rgba(251, 146, 60, 0.35)';
      case 'storm':         return 'rgba(30, 27, 75, 0.6)';
      case 'sunset':        return 'rgba(157, 23, 77, 0.45)';
      case 'frozen':        return 'rgba(186, 230, 253, 0.45)';
      case 'neon':          return 'rgba(88, 28, 135, 0.5)';
      case 'volcanic':      return 'rgba(68, 10, 10, 0.6)';
      case 'cosmic':        return 'rgba(30, 27, 75, 0.4)';
      case 'meadow':
      default:              return 'rgba(125, 211, 252, 0.4)';
    }
  }

  renderMidgroundLayer(ctx, camX, w, h) {
    const speed = 0.35;
    const offsetX = (camX * speed) % 600;
    const startX = camX - offsetX - 600;

    ctx.save();
    ctx.fillStyle = this.getMidLayerColor();

    for (let x = startX; x < camX + w + 600; x += 600) {
      // Floating Sky Island Monolith
      const islandY = h - 260 + Math.sin(x * 0.01) * 30;
      ctx.beginPath();
      ctx.moveTo(x + 100, islandY);
      ctx.quadraticCurveTo(x + 200, islandY - 30, x + 300, islandY);
      ctx.lineTo(x + 220, islandY + 70);
      ctx.closePath();
      ctx.fill();

      // Ruin pillar on top of island
      ctx.fillRect(x + 180, islandY - 45, 12, 45);
      ctx.fillRect(x + 215, islandY - 55, 14, 55);
    }
    ctx.restore();
  }

  getMidLayerColor() {
    switch (this.biome) {
      case 'cloud_kingdom': return 'rgba(244, 114, 182, 0.5)';
      case 'storm':         return 'rgba(15, 23, 42, 0.7)';
      case 'sunset':        return 'rgba(190, 24, 93, 0.6)';
      case 'frozen':        return 'rgba(125, 211, 252, 0.6)';
      case 'neon':          return 'rgba(126, 34, 206, 0.65)';
      case 'volcanic':      return 'rgba(127, 29, 29, 0.7)';
      case 'cosmic':        return 'rgba(49, 46, 129, 0.55)';
      case 'meadow':
      default:              return 'rgba(56, 189, 248, 0.55)';
    }
  }

  renderNearLayer(ctx, camX, w, h) {
    const speed = 0.7;
    const offsetX = (camX * speed) % 500;
    const startX = camX - offsetX - 500;

    ctx.save();
    ctx.fillStyle = this.getNearLayerColor();

    // Drifting foreground clouds / rolling hills
    for (let x = startX; x < camX + w + 500; x += 500) {
      ctx.beginPath();
      ctx.arc(x + 80, h - 30, 80, 0, Math.PI * 2);
      ctx.arc(x + 200, h - 50, 110, 0, Math.PI * 2);
      ctx.arc(x + 350, h - 30, 90, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  getNearLayerColor() {
    switch (this.biome) {
      case 'storm':    return 'rgba(15, 23, 42, 0.85)';
      case 'volcanic': return 'rgba(28, 25, 23, 0.85)';
      case 'frozen':   return 'rgba(241, 245, 249, 0.75)';
      case 'neon':     return 'rgba(24, 9, 48, 0.85)';
      default:         return 'rgba(255, 255, 255, 0.7)';
    }
  }
}

window.Environment = Environment;
