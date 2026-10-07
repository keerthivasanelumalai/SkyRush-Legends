/**
 * SkyRush Legends - Original Obstacle Architecture
 * Celestial Stone Obelisks, Crystalline Spires, Storm Arc Pillars, and Moving Mechanisms.
 */
class Obstacle {
  constructor({
    x,
    gapY = 360,
    gapHeight = 175,
    type = 'celestial_gate', // 'celestial_gate', 'crystal_spire', 'storm_arc', 'sky_ruin'
    moving = false,
    moveAmplitude = 70,
    moveSpeed = 1.5
  }) {
    this.x = x;
    this.initialGapY = gapY;
    this.gapY = gapY;
    this.gapHeight = gapHeight;
    this.width = 68;
    this.type = type;

    // Dynamic movement
    this.moving = moving;
    this.moveAmplitude = moveAmplitude;
    this.moveSpeed = moveSpeed;
    this.timeOffset = Math.random() * Math.PI * 2;

    // Tracking
    this.passed = false;
    this.perfectPassed = false;

    // Near-miss detection padding (close to edge within 18px)
    this.nearMissMargin = 20;
  }

  update(dt) {
    if (this.moving) {
      this.timeOffset += dt * this.moveSpeed;
      this.gapY = this.initialGapY + Math.sin(this.timeOffset) * this.moveAmplitude;
    }
  }

  getTopBox() {
    return {
      x: this.x,
      y: 0,
      width: this.width,
      height: this.gapY - (this.gapHeight / 2)
    };
  }

  getBottomBox() {
    const bottomTop = this.gapY + (this.gapHeight / 2);
    return {
      x: this.x,
      y: bottomTop,
      width: this.width,
      height: 800 - bottomTop
    };
  }

  // Check if player executed a daring close-proximity pass
  checkNearMiss(player) {
    if (this.perfectPassed) return false;

    const topBox = this.getTopBox();
    const bottomBox = this.getBottomBox();

    // Player is inside the horizontal column of the obstacle
    if (player.x >= this.x && player.x <= this.x + this.width) {
      const distToTop = Math.abs(player.y - topBox.height);
      const distToBottom = Math.abs(player.y - bottomBox.y);

      // Skimming close to either the top or bottom barrier without crashing
      if (distToTop <= this.nearMissMargin + player.radius || distToBottom <= this.nearMissMargin + player.radius) {
        this.perfectPassed = true;
        return true;
      }
    }
    return false;
  }

  render(ctx) {
    const topBox = this.getTopBox();
    const bottomBox = this.getBottomBox();

    ctx.save();

    if (this.type === 'crystal_spire') {
      this.renderCrystalSpire(ctx, topBox, bottomBox);
    } else if (this.type === 'storm_arc') {
      this.renderStormArc(ctx, topBox, bottomBox);
    } else if (this.type === 'sky_ruin') {
      this.renderSkyRuin(ctx, topBox, bottomBox);
    } else {
      this.renderCelestialGate(ctx, topBox, bottomBox);
    }

    ctx.restore();
  }

  // 1. Celestial Stone Obelisks with pulsating runic energy
  renderCelestialGate(ctx, topBox, bottomBox) {
    const pulse = (Math.sin(Date.now() * 0.005) + 1) * 0.5;

    // Top Obelisk
    const topGrad = ctx.createLinearGradient(topBox.x, 0, topBox.x + topBox.width, 0);
    topGrad.addColorStop(0, '#1e293b');
    topGrad.addColorStop(0.5, '#334155');
    topGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = topGrad;
    ctx.fillRect(topBox.x, topBox.y, topBox.width, topBox.height);

    // Bottom Obelisk
    ctx.fillRect(bottomBox.x, bottomBox.y, bottomBox.width, bottomBox.height);

    // Glowing Runic Glyphs & Capital caps
    const capHeight = 16;
    ctx.fillStyle = '#6366f1';
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = 12 * pulse + 4;

    // Top cap & core crystal
    ctx.fillRect(topBox.x - 4, topBox.height - capHeight, topBox.width + 8, capHeight);
    // Bottom cap & core crystal
    ctx.fillRect(bottomBox.x - 4, bottomBox.y, bottomBox.width + 8, capHeight);

    // Energy Runes inside the pillar
    ctx.fillStyle = `rgba(129, 140, 248, ${0.4 + pulse * 0.5})`;
    for (let y = 40; y < topBox.height - 30; y += 45) {
      ctx.fillRect(topBox.x + topBox.width / 2 - 4, y, 8, 14);
    }
    for (let y = bottomBox.y + 40; y < 750; y += 45) {
      ctx.fillRect(bottomBox.x + bottomBox.width / 2 - 4, y, 8, 14);
    }
  }

  // 2. Crystal Spire Barriers (Glowing Geodes)
  renderCrystalSpire(ctx, topBox, bottomBox) {
    const grad = ctx.createLinearGradient(topBox.x, 0, topBox.x + topBox.width, 0);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.5, '#38bdf8');
    grad.addColorStop(1, '#0369a1');

    ctx.fillStyle = grad;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 15;

    // Top Jagged Crystal
    ctx.beginPath();
    ctx.moveTo(topBox.x, 0);
    ctx.lineTo(topBox.x + topBox.width, 0);
    ctx.lineTo(topBox.x + topBox.width * 0.8, topBox.height - 20);
    ctx.lineTo(topBox.x + topBox.width * 0.5, topBox.height);
    ctx.lineTo(topBox.x + topBox.width * 0.2, topBox.height - 15);
    ctx.closePath();
    ctx.fill();

    // Bottom Jagged Crystal
    ctx.beginPath();
    ctx.moveTo(bottomBox.x + bottomBox.width * 0.5, bottomBox.y);
    ctx.lineTo(bottomBox.x + bottomBox.width * 0.8, bottomBox.y + 20);
    ctx.lineTo(bottomBox.x + bottomBox.width, bottomBox.y + 35);
    ctx.lineTo(bottomBox.x + bottomBox.width, 800);
    ctx.lineTo(bottomBox.x, 800);
    ctx.lineTo(bottomBox.x, bottomBox.y + 35);
    ctx.lineTo(bottomBox.x + bottomBox.width * 0.2, bottomBox.y + 15);
    ctx.closePath();
    ctx.fill();
  }

  // 3. Storm Arc Pillars (Electric Lightning Conductors)
  renderStormArc(ctx, topBox, bottomBox) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(topBox.x + 8, topBox.y, topBox.width - 16, topBox.height);
    ctx.fillRect(bottomBox.x + 8, bottomBox.y, bottomBox.width - 16, bottomBox.height);

    // Glowing plasma electrode globes
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.arc(topBox.x + topBox.width / 2, topBox.height - 8, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(bottomBox.x + bottomBox.width / 2, bottomBox.y + 8, 18, 0, Math.PI * 2);
    ctx.fill();

    // Electric plasma arcs between nodes occasionally
    if (Math.random() < 0.25) {
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(topBox.x + topBox.width / 2, topBox.height + 10);
      ctx.lineTo(topBox.x + topBox.width / 2 + (Math.random() * 20 - 10), (topBox.height + bottomBox.y) / 2);
      ctx.lineTo(bottomBox.x + bottomBox.width / 2, bottomBox.y - 10);
      ctx.stroke();
    }
  }

  // 4. Sky Ruin Monoliths (Ancient Floating Stone Ruins)
  renderSkyRuin(ctx, topBox, bottomBox) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(topBox.x, topBox.y, topBox.width, topBox.height - 10);
    ctx.fillRect(bottomBox.x, bottomBox.y + 10, bottomBox.width, bottomBox.height);

    // Weathered gold trim
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(topBox.x, topBox.height - 14, topBox.width, 6);
    ctx.fillRect(bottomBox.x, bottomBox.y + 8, bottomBox.width, 6);

    // Levitating ancient rune fragment in center
    const floatY = (topBox.height + bottomBox.y) / 2 + Math.sin(Date.now() * 0.004) * 8;
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(topBox.x + topBox.width / 2, floatY, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

window.Obstacle = Obstacle;
