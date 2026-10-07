/**
 * SkyRush Legends - Flight Physics & Aerodynamics Engine
 * Smooth responsive lift, natural tilt easing, and accurate collision resolution.
 */
class PhysicsEngine {
  constructor() {
    this.gravity = 1100;       // px/s^2
    this.flapImpulse = -390;   // Instant upward velocity
    this.maxFallSpeed = 650;   // Terminal velocity
    this.forwardSpeed = 240;   // Baseline horizontal speed
  }

  updatePlayer(player, dt, modifiers = {}) {
    const gravMod = modifiers.gravityMod || 1.0;
    const speedMod = modifiers.speedMod || 1.0;

    // Apply gravity
    player.vy += this.gravity * gravMod * dt;
    if (player.vy > this.maxFallSpeed) {
      player.vy = this.maxFallSpeed;
    }

    // Apply vertical displacement
    player.y += player.vy * dt;

    // Apply forward flight
    player.x += this.forwardSpeed * speedMod * dt;

    // Calculate natural aerodynamic pitch rotation
    // When rising: tilt up to -25 deg (-0.44 rad)
    // When falling: tilt smoothly down up to +70 deg (+1.22 rad)
    let targetRotation = 0;
    if (player.vy < 0) {
      targetRotation = -0.42;
    } else {
      // Ease into dive
      const diveProgress = Math.min(1, player.vy / this.maxFallSpeed);
      targetRotation = diveProgress * 1.25;
    }

    // Interpolate rotation smoothly
    const rotSpeed = player.vy < 0 ? 16 : 6;
    player.rotation += (targetRotation - player.rotation) * Math.min(1, dt * rotSpeed);

    // Keep within world bounds (ceil and floor)
    const worldCeiling = 30;
    const worldFloor = 690;

    if (player.y < worldCeiling) {
      player.y = worldCeiling;
      player.vy = 0;
    }

    let hitFloor = false;
    if (player.y > worldFloor) {
      player.y = worldFloor;
      hitFloor = true;
    }

    return { hitFloor };
  }

  // Circle to Box collision detection (Player sphere vs rectangular obstacle barriers)
  checkCircleBoxCollision(circle, box) {
    // Find closest point on box to circle center
    const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));

    // Distance between circle center and closest box point
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distanceSquared = dx * dx + dy * dy;

    return distanceSquared < (circle.radius * circle.radius);
  }

  // Circle to Circle collision detection (Player vs Coins, Gems, Power-ups)
  checkCircleCircleCollision(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const distSq = dx * dx + dy * dy;
    const radiiSum = c1.radius + c2.radius;
    return distSq < (radiiSum * radiiSum);
  }
}

window.PhysicsEngine = PhysicsEngine;
