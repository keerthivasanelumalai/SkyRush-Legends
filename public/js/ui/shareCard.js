/**
 * SkyRush Legends - Social Score Card Generator
 * Generates an HD 1200x630 celestial brag badge on HTML5 Canvas for sharing or downloading.
 */
class ShareCardGenerator {
  static generateCard({ username = 'Pilot', score = 0, distance = 0, coins = 0, maxCombo = 0, skin = 'classic' }) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');

    // 1. Cosmic Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGrad.addColorStop(0, '#070913');
    bgGrad.addColorStop(0.4, '#1e1b4b');
    bgGrad.addColorStop(1, '#312e81');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 630);

    // Decorative Nebula Rings
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(600, 315, 280, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
    ctx.beginPath();
    ctx.arc(600, 315, 340, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Game Branding Header
    ctx.font = 'bold 24px Outfit, sans-serif';
    ctx.fillStyle = '#06b6d4';
    ctx.letterSpacing = '6px';
    ctx.textAlign = 'center';
    ctx.fillText('SKYRUSH LEGENDS - FLIGHT RECORD', 600, 80);

    // Player Badge
    ctx.font = 'bold 36px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = '2px';
    ctx.fillText(username.toUpperCase(), 600, 140);

    // 3. Huge Score Display
    ctx.font = '900 120px Outfit, sans-serif';
    const scoreGrad = ctx.createLinearGradient(400, 200, 800, 320);
    scoreGrad.addColorStop(0, '#ffffff');
    scoreGrad.addColorStop(0.5, '#fbbf24');
    scoreGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = scoreGrad;
    ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
    ctx.shadowBlur = 35;
    ctx.fillText(score.toLocaleString(), 600, 290);
    ctx.shadowBlur = 0; // reset

    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('TOTAL CELESTIAL SCORE', 600, 330);

    // 4. Secondary Flight Stats Dashboard
    const statsY = 440;
    const stats = [
      { label: 'DISTANCE', val: `${distance.toLocaleString()}m`, color: '#38bdf8' },
      { label: 'COINS', val: coins.toLocaleString(), color: '#fbbf24' },
      { label: 'MAX COMBO', val: `x${maxCombo}`, color: '#f43f5e' }
    ];

    stats.forEach((s, idx) => {
      const x = 320 + idx * 280;

      // Card Backing
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x - 110, statsY - 50, 220, 100, 16);
      ctx.fill();
      ctx.stroke();

      // Stat Value
      ctx.font = '900 38px Outfit, sans-serif';
      ctx.fillStyle = s.color;
      ctx.fillText(s.val, x, statsY);

      // Stat Label
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(s.label, x, statsY + 32);
    });

    // 5. Footer watermark
    ctx.font = '600 18px Outfit, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Play now in browser: skyrush.game', 600, 580);

    return canvas.toDataURL('image/png');
  }
}

window.ShareCardGenerator = ShareCardGenerator;
