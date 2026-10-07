/**
 * SkyRush Legends - Local Storage & State Management
 * Ensures offline capability, seamless guest mode, and cloud syncing
 */
class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'skyrush_player_save_v1';
    this.state = this.loadLocalState();
  }

  getDefaultState() {
    return {
      isGuest: true,
      user: {
        id: 'guest_' + Math.random().toString(36).substring(2, 9),
        username: 'SkyCadet_' + Math.floor(Math.random() * 899 + 100),
        avatar: 'falcon_classic',
        createdAt: new Date().toISOString()
      },
      profile: {
        level: 1,
        xp: 0,
        coins: 100,
        gems: 10,
        best_score: 0,
        total_flights: 0,
        total_distance: 0,
        total_coins: 0,
        total_perfect_passes: 0,
        total_obstacles: 0,
        equipped_skin: 'classic',
        equipped_trail: 'starlight',
        equipped_particle: 'sparks'
      },
      levels: {
        // e.g. 'w1_l1': { stars: 3, highScore: 450, completed: true }
      },
      inventory: ['classic', 'starlight', 'sparks'],
      achievements: {},
      dailyCompletedDate: null,
      settings: {
        music_volume: 0.6,
        sfx_volume: 0.8,
        screen_shake: 1,
        particles: 1,
        reduced_motion: 0,
        quality: 'high',
        controls_hint: 1
      }
    };
  }

  loadLocalState() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...this.getDefaultState(), ...parsed };
      }
    } catch (e) {
      console.warn('Could not read localStorage:', e);
    }
    return this.getDefaultState();
  }

  saveLocalState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  // Update profile metrics locally
  recordRun({ score, distance, coins, perfectPasses = 0, obstaclesPassed = 0 }) {
    const p = this.state.profile;
    p.total_flights += 1;
    p.total_distance += distance;
    p.total_coins += coins;
    p.coins += coins;
    p.total_perfect_passes += perfectPasses;
    p.total_obstacles += obstaclesPassed;

    if (score > p.best_score) {
      p.best_score = score;
    }

    const xpGained = Math.floor(score * 0.5) + (coins * 2) + (perfectPasses * 10) + 15;
    p.xp += xpGained;
    p.level = Math.floor(p.xp / 500) + 1;

    this.saveLocalState();
    return { xpGained, newRecord: score >= p.best_score };
  }

  recordLevelProgress(levelId, stars, score) {
    if (!this.state.levels[levelId]) {
      this.state.levels[levelId] = { stars: 0, highScore: 0, completed: false };
    }
    const current = this.state.levels[levelId];
    current.stars = Math.max(current.stars, stars);
    current.highScore = Math.max(current.highScore, score);
    current.completed = true;

    this.saveLocalState();
  }

  isLevelUnlocked(worldIndex, levelIndex) {
    if (worldIndex === 1 && levelIndex === 1) return true;

    // Previous level in same world must be completed
    if (levelIndex > 1) {
      const prevKey = `w${worldIndex}_l${levelIndex - 1}`;
      return !!(this.state.levels[prevKey] && this.state.levels[prevKey].completed);
    }

    // First level of subsequent world requires clearing last level of previous world
    if (worldIndex > 1) {
      const prevWorldLast = `w${worldIndex - 1}_l5`;
      return !!(this.state.levels[prevWorldLast] && this.state.levels[prevWorldLast].completed);
    }

    return false;
  }

  getEquippedSkin() {
    return this.state.profile.equipped_skin || 'classic';
  }

  getEquippedTrail() {
    return this.state.profile.equipped_trail || 'starlight';
  }

  setEquippedItem(type, itemId) {
    if (type === 'skin') this.state.profile.equipped_skin = itemId;
    if (type === 'trail') this.state.profile.equipped_trail = itemId;
    if (type === 'particle') this.state.profile.equipped_particle = itemId;
    this.saveLocalState();
  }

  addInventoryItem(itemId) {
    if (!this.state.inventory.includes(itemId)) {
      this.state.inventory.push(itemId);
      this.saveLocalState();
    }
  }

  hasItem(itemId) {
    return this.state.inventory.includes(itemId);
  }

  updateSettings(newSettings) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.saveLocalState();
  }
}

window.storageManager = new StorageManager();
