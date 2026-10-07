/**
 * SkyRush Legends - World Progression & Campaign Level Manager
 * 8 Distinct Worlds with 5 Levels each (40 Levels Total) with 3-Star Objectives.
 */
class LevelManager {
  constructor() {
    this.worlds = [
      { id: 1, name: 'Meadow Skies', biome: 'meadow', desc: 'Sunlit pastures and ancient levitating obelisks.' },
      { id: 2, name: 'Cloud Kingdom', biome: 'cloud_kingdom', desc: 'Heavenly pastel skies above soaring cloud palaces.' },
      { id: 3, name: 'Storm Valley', biome: 'storm', desc: 'Violent tempest gale winds and crackling lightning arcs.' },
      { id: 4, name: 'Sunset Canyon', biome: 'sunset', desc: 'Amber dusk reflecting off towering sandstone monoliths.' },
      { id: 5, name: 'Frozen Heights', biome: 'frozen', desc: 'Chilled glacial peaks and dazzling aurora borealis ribbons.' },
      { id: 6, name: 'Neon Sky', biome: 'neon', desc: 'Electrified synthwave horizons pulsing with cyber-energy.' },
      { id: 7, name: 'Volcanic Skies', biome: 'volcanic', desc: 'Rising ash clouds and molten magma fissures below.' },
      { id: 8, name: 'Cosmic Flight', biome: 'cosmic', desc: 'Transcend the atmosphere into stardust and celestial voids.' }
    ];

    this.currentWorldIndex = 1;
    this.currentLevelIndex = 1;
  }

  getWorld(worldId) {
    return this.worlds.find(w => w.id === worldId) || this.worlds[0];
  }

  getLevelConfig(worldId, levelId) {
    const world = this.getWorld(worldId);
    const difficultyMultiplier = (worldId - 1) * 0.15 + (levelId - 1) * 0.08;

    const baseDistance = 350 + (worldId - 1) * 120 + (levelId - 1) * 60;
    const baseGap = Math.max(130, 190 - (worldId * 5 + levelId * 4));
    const obstacleSpeed = 220 + difficultyMultiplier * 40;
    const obstacleCount = Math.floor(baseDistance / 70);

    // Target Coin objective
    const coinTarget = 10 + Math.floor(difficultyMultiplier * 10);
    // Near-miss / Perfect pass target
    const perfectTarget = 1 + Math.floor(difficultyMultiplier * 3);

    // Obstacle types per world
    let obstacleType = 'celestial_gate';
    if (world.biome === 'frozen') obstacleType = 'crystal_spire';
    else if (world.biome === 'storm') obstacleType = 'storm_arc';
    else if (world.biome === 'sunset' || world.biome === 'volcanic') obstacleType = 'sky_ruin';
    else if (world.biome === 'cosmic' || world.biome === 'neon') obstacleType = 'crystal_spire';

    return {
      worldId,
      levelId,
      levelKey: `w${worldId}_l${levelId}`,
      worldName: world.name,
      biome: world.biome,
      title: `${world.name} - Stage ${levelId}`,
      targetDistance: baseDistance,
      gapHeight: baseGap,
      speed: obstacleSpeed,
      obstacleCount,
      obstacleType,
      movingObstacles: levelId >= 3,
      moveAmplitude: 30 + levelId * 8,
      objectives: [
        { id: 'reach_goal', text: `Reach the finish gate (${baseDistance}m)` },
        { id: 'coins', text: `Collect ${coinTarget} sky coins`, target: coinTarget },
        { id: 'perfect', text: `Perform ${perfectTarget} Perfect Passes`, target: perfectTarget }
      ]
    };
  }

  // Calculate stars earned on level run
  evaluateRun(levelConfig, { distance, coins, perfectPasses }) {
    let stars = 0;
    const results = {
      reachGoal: distance >= levelConfig.targetDistance,
      coins: coins >= levelConfig.objectives[1].target,
      perfect: perfectPasses >= levelConfig.objectives[2].target
    };

    if (results.reachGoal) stars++;
    if (results.coins) stars++;
    if (results.perfect) stars++;

    return { stars: Math.max(1, stars), results };
  }
}

window.LevelManager = LevelManager;
