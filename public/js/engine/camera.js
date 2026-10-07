/**
 * SkyRush Legends - Camera & Viewport Engine
 * Handles smooth scrolling, dynamic aspect ratio, and organic screen shake
 */
class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    // Viewport dimensions
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;

    // Virtual design reference space for consistent responsive gameplay
    this.virtualHeight = 720;
    this.scale = 1;
    this.virtualWidth = 1280;

    this.updateDimensions();
  }

  updateDimensions() {
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;

    // Scale canvas so gameplay fits virtual height of 720px elegantly
    this.scale = this.viewportHeight / this.virtualHeight;
    this.virtualWidth = this.viewportWidth / this.scale;
  }

  shake(intensity = 8, durationMs = 250) {
    // Respect settings
    const settings = window.storageManager?.state?.settings || {};
    if (settings.screen_shake === 0) return;

    this.shakeIntensity = Math.min(25, intensity);
    this.shakeDuration = durationMs;
  }

  update(dt, playerX) {
    // Player leads camera by 25% of screen width so upcoming obstacles are visible
    this.targetX = playerX - this.virtualWidth * 0.25;
    this.x += (this.targetX - this.x) * Math.min(1, dt * 10);

    // Update screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt * 1000;
      const factor = Math.max(0, this.shakeDuration / 250);
      const currentIntensity = this.shakeIntensity * factor;
      this.shakeOffsetX = (Math.random() * 2 - 1) * currentIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * currentIntensity;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  applyTransform(ctx) {
    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.translate(-this.x + this.shakeOffsetX, this.shakeOffsetY);
  }

  restoreTransform(ctx) {
    ctx.restore();
  }

  // Convert screen coordinates to virtual game world coordinates
  screenToWorld(screenX, screenY) {
    return {
      x: screenX / this.scale + this.x,
      y: screenY / this.scale
    };
  }
}

window.Camera = Camera;
