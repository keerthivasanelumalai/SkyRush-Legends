/**
 * SkyRush Legends - Master Game Engine
 * 60 FPS requestAnimationFrame loop, responsive Canvas viewport, state management, and input routing.
 */
class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Systems & Entities
    this.camera = new Camera();
    this.physics = new PhysicsEngine();
    this.particles = new ParticleSystem();
    this.environment = new Environment();
    this.player = new Player(200, 360);

    this.levelManager = new LevelManager();
    this.endlessManager = new EndlessManager();
    this.powerupManager = new PowerupManager();
    this.comboManager = new ComboManager();

    // Game Mode & State
    this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER', 'VICTORY'
    this.mode = 'endless'; // 'campaign', 'endless', 'daily'
    this.currentLevelConfig = null;
    this.dailyConfig = null;

    // Game Loop
    this.lastTime = 0;
    this.isRunning = false;

    // Run Stats
    this.score = 0;
    this.distance = 0;
    this.coinsCollected = 0;
    this.obstaclesPassed = 0;
    this.perfectPasses = 0;
    this.runToken = null;
    this.runStartTime = 0;

    // Active Game World Objects
    this.obstacles = [];
    this.collectibles = [];

    // Screen Shake / Damage Flash
    this.flashEl = document.getElementById('fx-damage-flash');
    this.speedLinesEl = document.getElementById('fx-speed-lines');

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.setupInputListeners();
    this.startLoop();
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // Scale context for high-DPI
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);

    this.camera.updateDimensions();
  }

  setupInputListeners() {
    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (this.state === 'PLAYING') {
          e.preventDefault();
          this.handleJump();
        }
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        if (this.state === 'PLAYING') {
          this.pause();
        } else if (this.state === 'PAUSED') {
          this.resume();
        }
      }
    });

    // Mouse / Touch Controls on Canvas and Gameplay Viewport
    const handlePointerAction = (e) => {
      // Ignore if clicking on open UI modals or interactive buttons
      if (e.target.closest('#modal-layer') || e.target.closest('.btn') || e.target.closest('.dock-item') || e.target.closest('.player-pill')) {
        return;
      }

      if (this.state === 'PLAYING') {
        e.preventDefault();
        this.handleJump();
      }
    };

    window.addEventListener('mousedown', handlePointerAction);
    window.addEventListener('touchstart', handlePointerAction, { passive: false });
  }

  handleJump() {
    if (this.state !== 'PLAYING') return;
    this.player.flap(this.physics.flapImpulse);
  }

  /* ==========================================
     RUN LIFECYCLE
     ========================================== */

  async startEndlessMode() {
    this.mode = 'endless';
    this.currentLevelConfig = null;
    this.resetRunState();

    this.environment.setBiome('meadow');
    this.endlessManager.reset();
    this.endlessManager.spawnNextSegment(this.player.x, this.obstacles, this.collectibles, 0);

    // Audio
    if (window.soundManager) {
      window.soundManager.playMusic('gameplay');
    }

    // Request anti-cheat run token
    try {
      const res = await window.apiClient.startRun('endless');
      if (res && res.token) this.runToken = res.token;
    } catch (e) {
      this.runToken = 'offline_' + Date.now();
    }

    this.state = 'PLAYING';
    if (window.uiManager) window.uiManager.showScreen('hud');
  }

  async startCampaignLevel(worldId, levelId) {
    this.mode = 'campaign';
    this.currentLevelConfig = this.levelManager.getLevelConfig(worldId, levelId);
    this.resetRunState();

    this.environment.setBiome(this.currentLevelConfig.biome);
    this.spawnCampaignObstacles(this.currentLevelConfig);

    if (window.soundManager) {
      window.soundManager.playMusic('gameplay');
    }

    try {
      const res = await window.apiClient.startRun('campaign', this.currentLevelConfig.levelKey);
      if (res && res.token) this.runToken = res.token;
    } catch (e) {
      this.runToken = 'offline_' + Date.now();
    }

    this.state = 'PLAYING';
    if (window.uiManager) window.uiManager.showScreen('hud');
  }

  async startDailyChallenge(dailyConfig) {
    this.mode = 'daily';
    this.dailyConfig = dailyConfig;
    this.resetRunState();

    this.environment.setBiome(dailyConfig.modifier.id.includes('storm') ? 'storm' : 'cosmic');
    this.endlessManager.reset();
    this.endlessManager.spawnNextSegment(this.player.x, this.obstacles, this.collectibles, 0);

    if (window.soundManager) {
      window.soundManager.playMusic('gameplay');
    }

    this.state = 'PLAYING';
    if (window.uiManager) window.uiManager.showScreen('hud');
  }

  spawnCampaignObstacles(config) {
    let currentX = 550;
    const spacing = 340;

    for (let i = 0; i < config.obstacleCount; i++) {
      const gapY = 220 + Math.sin(i * 0.9) * 160 + (Math.random() * 60 - 30);
      const isMoving = config.movingObstacles && (i % 2 === 0);

      this.obstacles.push(new Obstacle({
        x: currentX,
        gapY,
        gapHeight: config.gapHeight,
        type: config.obstacleType,
        moving: isMoving,
        moveAmplitude: config.moveAmplitude,
        moveSpeed: 1.5
      }));

      // Collectible in gap
      this.collectibles.push(new Collectible({
        x: currentX,
        y: gapY,
        type: Math.random() < 0.8 ? 'coin' : 'gem'
      }));

      // Occasional powerup
      if (i > 1 && i % 4 === 0) {
        this.collectibles.push(new Collectible({
          x: currentX - spacing / 2,
          y: gapY + (Math.random() * 80 - 40),
          type: Math.random() < 0.5 ? 'powerup_shield' : 'powerup_magnet'
        }));
      }

      currentX += spacing;
    }

    // Finish portal marker at end
    this.finishLineX = currentX + 100;
  }

  resetRunState() {
    this.player.reset(200, 360);
    this.obstacles = [];
    this.collectibles = [];
    this.particles.reset();
    this.powerupManager.reset();
    this.comboManager.reset();

    this.score = 0;
    this.distance = 0;
    this.coinsCollected = 0;
    this.obstaclesPassed = 0;
    this.perfectPasses = 0;
    this.runStartTime = Date.now();
  }

  pause() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    if (window.uiManager) window.uiManager.showModal('pause');
  }

  resume() {
    if (this.state !== 'PAUSED') return;
    this.state = 'PLAYING';
    if (window.uiManager) window.uiManager.closeModals();
  }

  handleGameOver() {
    this.state = 'GAMEOVER';
    this.player.isDead = true;

    // Visual & Audio impact
    if (this.flashEl) {
      this.flashEl.style.opacity = '1';
      setTimeout(() => { if (this.flashEl) this.flashEl.style.opacity = '0'; }, 300);
    }

    this.camera.shake(20, 450);
    this.particles.emitExplosion(this.player.x, this.player.y, '#f59e0b');

    if (window.soundManager) {
      window.soundManager.playHit();
      window.soundManager.stopMusic();
    }

    // Save and submit score
    this.finalizeRun();
  }

  handleVictory() {
    this.state = 'VICTORY';
    if (window.soundManager) {
      window.soundManager.playVictory();
      window.soundManager.stopMusic();
    }

    this.finalizeCampaignRun();
  }

  async finalizeRun() {
    const runPayload = {
      runToken: this.runToken,
      mode: this.mode,
      score: this.score,
      distance: Math.floor(this.distance),
      coins: this.coinsCollected,
      flaps: this.player.flapCount,
      obstaclesPassed: this.obstaclesPassed,
      perfectPasses: this.perfectPasses,
      durationMs: Date.now() - this.runStartTime
    };

    // Save locally
    const localResult = window.storageManager.recordRun(runPayload);

    // Submit to server
    let serverRes = null;
    try {
      serverRes = await window.apiClient.submitScore(runPayload);
      if (serverRes && serverRes.newAchievements) {
        serverRes.newAchievements.forEach(a => window.toastManager.achievement(a.title || a.id));
      }
    } catch (e) {
      console.log('Offline score save active');
    }

    // Daily Challenge completion check
    if (this.mode === 'daily' && this.dailyConfig) {
      if (this.score >= this.dailyConfig.targetScore && this.coinsCollected >= this.dailyConfig.targetCoins) {
        window.apiClient.completeDailyChallenge(this.score, this.coinsCollected).then(() => {
          window.toastManager.success('Daily Challenge Completed! Reward Claimed!');
        }).catch(() => {});
      }
    }

    setTimeout(() => {
      if (window.uiManager) {
        window.uiManager.showGameOver({
          score: this.score,
          distance: Math.floor(this.distance),
          coins: this.coinsCollected,
          maxCombo: this.comboManager.maxCombo,
          newRecord: localResult.newRecord || (serverRes && serverRes.newRecord),
          xpGained: localResult.xpGained
        });
      }
    }, 900);
  }

  async finalizeCampaignRun() {
    const evaluation = this.levelManager.evaluateRun(this.currentLevelConfig, {
      distance: this.distance,
      coins: this.coinsCollected,
      perfectPasses: this.perfectPasses
    });

    const levelKey = this.currentLevelConfig.levelKey;
    window.storageManager.recordLevelProgress(levelKey, evaluation.stars, this.score);

    try {
      await window.apiClient.submitLevelProgress({
        levelId: levelKey,
        stars: evaluation.stars,
        score: this.score,
        coinsEarned: this.coinsCollected,
        perfectPasses: this.perfectPasses
      });
    } catch (e) {
      console.log('Offline campaign progress saved');
    }

    setTimeout(() => {
      if (window.uiManager) {
        window.uiManager.showVictory({
          levelTitle: this.currentLevelConfig.title,
          stars: evaluation.stars,
          score: this.score,
          coins: this.coinsCollected,
          results: evaluation.results
        });
      }
    }, 900);
  }

  /* ==========================================
     UPDATE & RENDER LOOP
     ========================================== */

  startLoop() {
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(currentTime) {
    if (!this.isRunning) return;

    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000); // capped delta
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.state === 'PLAYING') {
      // Modifiers
      const modifiers = {};
      if (this.powerupManager.has('powerup_slowmo')) modifiers.speedMod = 0.65;
      if (this.player.speedBoostActive) modifiers.speedMod = 2.0;

      // Update flight physics
      const { hitFloor } = this.physics.updatePlayer(this.player, dt, modifiers);
      if (hitFloor && !this.player.isDead) {
        this.handleGameOver();
        return;
      }

      this.player.update(dt);
      this.distance += this.physics.forwardSpeed * (modifiers.speedMod || 1.0) * dt * 0.1;

      // Update Camera tracking
      this.camera.update(dt, this.player.x);

      // Endless procedural spawning
      if (this.mode === 'endless' || this.mode === 'daily') {
        this.endlessManager.spawnNextSegment(this.player.x, this.obstacles, this.collectibles, this.distance);
        this.environment.setBiome(this.endlessManager.getCurrentBiome(this.distance));
      }

      // Check Campaign Victory
      if (this.mode === 'campaign' && this.player.x >= this.finishLineX) {
        this.handleVictory();
        return;
      }

      // Update Obstacles & Collisions
      for (let i = 0; i < this.obstacles.length; i++) {
        const obs = this.obstacles[i];
        obs.update(dt);

        // Near-miss detection
        if (obs.checkNearMiss(this.player)) {
          this.perfectPasses++;
          this.comboManager.addCombo(3);
          this.score += 50 * this.comboManager.getMultiplier();
          this.particles.emitPerfectPassShockwave(this.player.x, this.player.y);
          if (window.soundManager) window.soundManager.playPerfectPass();
        }

        // Passed obstacle
        if (!obs.passed && this.player.x > obs.x + obs.width) {
          obs.passed = true;
          this.obstaclesPassed++;
          this.comboManager.addCombo(1);
          this.score += 10 * this.comboManager.getMultiplier();
        }

        // Collision Check (skip if speed boost or invincible)
        if (!this.player.isDead && this.player.invulnerableTimer <= 0 && !this.player.speedBoostActive) {
          const hitTop = this.physics.checkCircleBoxCollision(this.player, obs.getTopBox());
          const hitBottom = this.physics.checkCircleBoxCollision(this.player, obs.getBottomBox());

          if (hitTop || hitBottom) {
            if (this.powerupManager.breakShield(this.player)) {
              // Shield absorbed hit!
            } else {
              this.handleGameOver();
              return;
            }
          }
        }
      }

      // Update Collectibles & Magnetism
      for (let i = 0; i < this.collectibles.length; i++) {
        const c = this.collectibles[i];
        if (c.collected) continue;

        c.update(dt, this.player);

        // Collision with player
        if (this.physics.checkCircleCircleCollision(this.player, c)) {
          c.collected = true;

          if (c.type === 'coin') {
            const coinVal = this.powerupManager.has('powerup_double') ? 2 : 1;
            this.coinsCollected += coinVal;
            this.score += 15 * this.comboManager.getMultiplier();
            this.comboManager.addCombo(1);
            this.particles.emitCoinSparkles(c.x, c.y, '#fbbf24');
            if (window.soundManager) window.soundManager.playCoin();
          } else if (c.type === 'gem') {
            this.coinsCollected += 5;
            this.score += 50 * this.comboManager.getMultiplier();
            this.particles.emitCoinSparkles(c.x, c.y, '#d946ef');
            if (window.soundManager) window.soundManager.playGem();
          } else if (c.type.startsWith('powerup_')) {
            this.powerupManager.activate(c.type, this.player);
            this.particles.emitCoinSparkles(c.x, c.y, '#38bdf8');
          }
        }
      }

      // Cleanup offscreen objects (behind camera)
      const cullX = this.camera.x - 200;
      this.obstacles = this.obstacles.filter(o => o.x + o.width > cullX);
      this.collectibles = this.collectibles.filter(c => !c.collected && c.x > cullX);

      // Systems updates
      this.powerupManager.update(dt, this.player);
      this.comboManager.update(dt);
      this.particles.updateWeather(dt, this.camera, this.environment.biome);

      // HUD update
      if (window.uiManager) {
        window.uiManager.updateHUD({
          score: this.score,
          coins: this.coinsCollected,
          distance: Math.floor(this.distance),
          combo: this.comboManager.combo,
          comboTimer: this.comboManager.timer,
          comboMaxTimer: this.comboManager.maxTimer,
          multiplier: this.comboManager.getMultiplier(),
          activePowerups: Array.from(this.powerupManager.activePowerups.values()),
          levelConfig: this.currentLevelConfig
        });
      }
    }

    // Always update visual particles and environment
    this.particles.update(dt);
    this.environment.update(dt);
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply Camera Transform
    this.camera.applyTransform(this.ctx);

    // 1. Multi-Layer Parallax Environment
    this.environment.render(this.ctx, this.camera);

    // 2. Obstacles
    for (let i = 0; i < this.obstacles.length; i++) {
      this.obstacles[i].render(this.ctx);
    }

    // 3. Collectibles
    for (let i = 0; i < this.collectibles.length; i++) {
      this.collectibles[i].render(this.ctx);
    }

    // 4. Player Creature
    this.player.render(this.ctx);

    // 5. Particles & Weather
    this.particles.render(this.ctx);

    // Restore Camera Transform
    this.camera.restoreTransform(this.ctx);
  }
}

window.GameEngine = GameEngine;
