/**
 * SkyRush Legends - Procedural Endless Mode Engine
 * Infinite track generation, dynamic biome shifting, and adaptive difficulty scaling.
 */
class EndlessManager {
  constructor() {
    this.biomes = ['meadow', 'cloud_kingdom', 'sunset', 'storm', 'frozen', 'neon', 'volcanic', 'cosmic'];
    this.currentBiomeIndex = 0;
    this.lastSpawnX = 600;
    this.spacing = 320;
    this.baseSpeed = 240;
  }

  reset() {
    this.currentBiomeIndex = 0;
    this.lastSpawnX = 600;
    this.spacing = 320;
  }

  getCurrentBiome(distance) {
    // Transition biome every 500m
    const idx = Math.floor(distance / 500) % this.biomes.length;
    return this.biomes[idx];
  }

  getSpeed(distance) {
    // Smooth speed scaling capped at 380px/s
    return Math.min(380, this.baseSpeed + (distance / 100) * 8);
  }

  getGapHeight(distance) {
    // Gap slowly decreases from 185 down to 135 for increasing challenge
    return Math.max(135, 185 - (distance / 200) * 5);
  }

  // Generate next segment of obstacles and collectibles
  spawnNextSegment(aheadX, obstacles, collectibles, distance) {
    while (this.lastSpawnX < aheadX + 1200) {
      const currentBiome = this.getCurrentBiome(distance);
      const gapHeight = this.getGapHeight(distance);

      // Random gap Y position between 180 and 540
      const gapY = Math.floor(Math.random() * 320) + 200;

      // Obstacle style matches current biome
      let obsType = 'celestial_gate';
      if (currentBiome === 'frozen') obsType = 'crystal_spire';
      else if (currentBiome === 'storm') obsType = 'storm_arc';
      else if (currentBiome === 'sunset' || currentBiome === 'volcanic') obsType = 'sky_ruin';
      else if (currentBiome === 'cosmic' || currentBiome === 'neon') obsType = 'crystal_spire';

      const isMoving = distance > 300 && Math.random() < 0.35;

      const obstacle = new Obstacle({
        x: this.lastSpawnX,
        gapY,
        gapHeight,
        type: obsType,
        moving: isMoving,
        moveAmplitude: Math.random() * 40 + 20,
        moveSpeed: Math.random() * 0.8 + 1.2
      });

      obstacles.push(obstacle);

      // Spawn Collectibles in the gap
      const roll = Math.random();
      if (roll < 0.7) {
        // Coin in center of gap
        collectibles.push(new Collectible({
          x: this.lastSpawnX,
          y: gapY,
          type: 'coin'
        }));
      } else if (roll < 0.85) {
        // Celestial Gem
        collectibles.push(new Collectible({
          x: this.lastSpawnX,
          y: gapY,
          type: 'gem',
          value: 1
        }));
      } else {
        // Tactical Power-up
        const powerups = [
          'powerup_shield',
          'powerup_magnet',
          'powerup_slowmo',
          'powerup_double',
          'powerup_boost'
        ];
        const chosenPowerup = powerups[Math.floor(Math.random() * powerups.length)];

        collectibles.push(new Collectible({
          x: this.lastSpawnX,
          y: gapY,
          type: chosenPowerup
        }));
      }

      this.lastSpawnX += this.spacing;
    }
  }
}

window.EndlessManager = EndlessManager;
