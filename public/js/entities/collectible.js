/**
 * SkyRush Legends - Collectibles Architecture
 * Golden Sky Coins, Celestial Gems, and Tactical Power-Ups with Magnetic Physics.
 */
class Collectible {
  constructor({
    x,
    y,
    type = 'coin', // 'coin', 'gem', 'powerup_shield', 'powerup_magnet', 'powerup_slowmo', 'powerup_double', 'powerup_boost'
    value = 1
  }) {
    this.x = x;
    this.y = y;
    this.initialY = y;
    this.type = type;
    this.value = value;
    this.radius = type === 'gem' ? 14 : (type.startsWith('powerup') ? 16 : 12);

    this.collected = false;
    this.rotationAngle = Math.random() * Math.PI * 2;
    this.floatOffset = Math.random() * Math.PI * 2;
  }

  update(dt, player) {
    // Gentle floating bob
    this.floatOffset += dt * 3.5;
    this.y = this.initialY + Math.sin(this.floatOffset) * 6;

    // Coin spin rotation
    this.rotationAngle += dt * 4;

    // Magnet Attraction Physics
    if (player && player.magnetActive && (this.type === 'coin' || this.type === 'gem')) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 260) {
        const pullSpeed = 550 * (1 - dist / 300);
        this.x += (dx / dist) * pullSpeed * dt;
        this.y += (dy / dist) * pullSpeed * dt;
        this.initialY = this.y; // Update baseline float position
      }
    }
  }

  render(ctx) {
    if (this.collected) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'coin') {
      this.renderCoin(ctx);
    } else if (this.type === 'gem') {
      this.renderGem(ctx);
    } else {
      this.renderPowerup(ctx);
    }

    ctx.restore();
  }

  renderCoin(ctx) {
    const scaleX = Math.cos(this.rotationAngle);

    ctx.scale(scaleX, 1);
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;

    // Outer rim
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner bevel
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 3, 0, Math.PI * 2);
    ctx.fill();

    // Embossed star
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  renderGem(ctx) {
    ctx.shadowColor = '#d946ef';
    ctx.shadowBlur = 12;

    // Faceted diamond shape
    ctx.fillStyle = '#c026d3';
    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius, -this.radius * 0.3);
    ctx.lineTo(this.radius * 0.7, this.radius);
    ctx.lineTo(-this.radius * 0.7, this.radius);
    ctx.lineTo(-this.radius, -this.radius * 0.3);
    ctx.closePath();
    ctx.fill();

    // Gleaming top facet
    ctx.fillStyle = '#f0abfc';
    ctx.beginPath();
    ctx.moveTo(0, -this.radius + 3);
    ctx.lineTo(this.radius * 0.6, -this.radius * 0.2);
    ctx.lineTo(0, this.radius * 0.2);
    ctx.lineTo(-this.radius * 0.6, -this.radius * 0.2);
    ctx.closePath();
    ctx.fill();
  }

  renderPowerup(ctx) {
    let color = '#38bdf8';
    let iconSymbol = '🛡️';

    if (this.type === 'powerup_shield') { color = '#38bdf8'; iconSymbol = '🛡️'; }
    else if (this.type === 'powerup_magnet') { color = '#f59e0b'; iconSymbol = '🧲'; }
    else if (this.type === 'powerup_slowmo') { color = '#34d399'; iconSymbol = '⏳'; }
    else if (this.type === 'powerup_double') { color = '#fbbf24'; iconSymbol = '2X'; }
    else if (this.type === 'powerup_boost')  { color = '#f43f5e'; iconSymbol = '🚀'; }

    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    // Glowing energy sphere
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 3, 0, Math.PI * 2);
    ctx.fill();

    // Center icon
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(iconSymbol, 0, 1);
  }
}

window.Collectible = Collectible;
