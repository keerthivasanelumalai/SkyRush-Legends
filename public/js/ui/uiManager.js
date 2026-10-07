/**
 * SkyRush Legends - Master UI & Screen Controller
 * Orchestrates all menu views, modals, HUD updates, shop previews, and user actions.
 */
class UIManager {
  constructor() {
    this.currentScreen = 'menu';
    this.activeModal = null;
    this.currentShopTab = 'skin';
    this.selectedShopItem = 'classic';
    this.shopPreviewAnim = null;
    this.menuHeroAnim = null;

    this.bindEvents();
    this.updateUserHeader();
    this.startMenuHeroPreview();
  }

  // Switch between primary screen layers
  showScreen(screenName) {
    document.querySelectorAll('.screen-layer').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`${screenName}-screen`) || document.getElementById(`${screenName}-layer`);
    if (target) {
      target.classList.add('active');
      this.currentScreen = screenName;
    }

    if (screenName === 'menu') {
      this.updateUserHeader();
      if (window.soundManager) window.soundManager.playMusic('menu');
    }
  }

  // Open a modal dialog
  showModal(modalName) {
    this.closeModals(false);
    const modalLayer = document.getElementById('modal-layer');
    const modalContent = document.getElementById(`modal-${modalName}`);

    if (modalLayer && modalContent) {
      modalLayer.classList.add('active');
      modalContent.style.display = 'flex';
      this.activeModal = modalName;

      // Populate dynamic data
      if (modalName === 'profile') this.renderProfileModal();
      else if (modalName === 'worlds') this.renderWorldsModal();
      else if (modalName === 'missions') this.renderMissionsModal();
      else if (modalName === 'achievements') this.renderAchievementsModal();
      else if (modalName === 'leaderboard') this.renderLeaderboardModal('global');
      else if (modalName === 'shop') this.renderShopModal();
      else if (modalName === 'daily') this.renderDailyModal();
      else if (modalName === 'settings') this.renderSettingsModal();

      if (window.soundManager) window.soundManager.playClick();
    }
  }

  closeModals(playSound = true) {
    const modalLayer = document.getElementById('modal-layer');
    if (modalLayer) modalLayer.classList.remove('active');

    document.querySelectorAll('.modal-card').forEach(el => el.style.display = 'none');
    this.activeModal = null;

    if (this.shopPreviewAnim) {
      cancelAnimationFrame(this.shopPreviewAnim);
      this.shopPreviewAnim = null;
    }

    if (playSound && window.soundManager) {
      window.soundManager.playClick();
    }
  }

  // Update Top Navigation Currency and Profile Pill
  updateUserHeader() {
    const state = window.storageManager.state;
    const profile = state.profile;
    const user = state.user;

    // Currency counters
    const coinsEl = document.getElementById('header-coins-val');
    const gemsEl = document.getElementById('header-gems-val');
    if (coinsEl) coinsEl.textContent = (profile.coins || 0).toLocaleString();
    if (gemsEl) gemsEl.textContent = (profile.gems || 0).toLocaleString();

    // Player Pill
    const nameEl = document.getElementById('header-player-name');
    const levelEl = document.getElementById('header-level-tag');
    const xpFillEl = document.getElementById('header-xp-fill');

    if (nameEl) nameEl.textContent = user.username || 'Sky Cadet';
    if (levelEl) levelEl.textContent = `LVL ${profile.level || 1}`;
    if (xpFillEl) {
      const xpProgress = (profile.xp % 500) / 500 * 100;
      xpFillEl.style.width = `${Math.min(100, Math.max(5, xpProgress))}%`;
    }
  }

  // In-Game Live HUD Update
  updateHUD({ score, coins, distance, combo, comboTimer, comboMaxTimer, multiplier, activePowerups, levelConfig }) {
    const scoreEl = document.getElementById('hud-score-val');
    const coinsEl = document.getElementById('hud-coins-val');
    const distEl = document.getElementById('hud-dist-val');

    if (scoreEl) scoreEl.textContent = Math.floor(score).toLocaleString();
    if (coinsEl) coinsEl.textContent = coins.toLocaleString();
    if (distEl) distEl.textContent = `${distance}m`;

    // Combo Gauge
    const comboWrap = document.getElementById('hud-combo-wrap');
    const comboBadge = document.getElementById('hud-combo-badge');
    const comboFill = document.getElementById('hud-combo-fill');

    if (comboWrap && comboBadge && comboFill) {
      if (combo > 1) {
        comboWrap.classList.add('active');
        comboBadge.textContent = `COMBO x${multiplier} (${combo})`;
        const progress = Math.max(0, comboTimer / comboMaxTimer * 100);
        comboFill.style.width = `${progress}%`;
      } else {
        comboWrap.classList.remove('active');
      }
    }

    // Power-ups shelf
    const pContainer = document.getElementById('hud-powerups-shelf');
    if (pContainer) {
      pContainer.innerHTML = '';
      activePowerups.forEach(p => {
        const pill = document.createElement('div');
        const typeClass = p.type.replace('powerup_', '');
        pill.className = `powerup-pill ${typeClass}`;

        const remainingPct = p.type === 'powerup_shield' ? 100 : Math.max(0, (p.remaining / p.maxDuration) * 100);
        pill.innerHTML = `
          <span class="powerup-name">${p.name}</span>
          <div class="powerup-timer-bar">
            <div class="powerup-timer-fill" style="width: ${remainingPct}%"></div>
          </div>
        `;
        pContainer.appendChild(pill);
      });
    }

    // Campaign Objectives Pill
    const objEl = document.getElementById('hud-objective-wrap');
    if (objEl) {
      if (levelConfig) {
        objEl.style.display = 'flex';
        objEl.innerHTML = `<span>🎯 Goal: ${levelConfig.targetDistance}m (${distance}/${levelConfig.targetDistance}m)</span>`;
        if (distance >= levelConfig.targetDistance) {
          objEl.classList.add('completed');
        } else {
          objEl.classList.remove('completed');
        }
      } else {
        objEl.style.display = 'none';
      }
    }
  }

  // Show Game Over Dialog
  showGameOver({ score, distance, coins, maxCombo, newRecord, xpGained }) {
    this.showModal('gameover');

    document.getElementById('go-score-val').textContent = score.toLocaleString();
    document.getElementById('go-distance-val').textContent = `${distance}m`;
    document.getElementById('go-coins-val').textContent = coins.toLocaleString();
    document.getElementById('go-combo-val').textContent = `x${maxCombo}`;
    document.getElementById('go-xp-val').textContent = `+${xpGained} XP`;

    const recordBanner = document.getElementById('go-new-record-banner');
    if (recordBanner) {
      recordBanner.style.display = newRecord ? 'inline-flex' : 'none';
    }

    this.updateUserHeader();
  }

  // Show Level Complete Dialog
  showVictory({ levelTitle, stars, score, coins, results }) {
    this.showModal('victory');

    document.getElementById('vic-level-title').textContent = levelTitle;
    document.getElementById('vic-score-val').textContent = score.toLocaleString();
    document.getElementById('vic-coins-val').textContent = `+${coins} Coins`;

    // Render stars
    const starsContainer = document.getElementById('vic-stars-wrap');
    if (starsContainer) {
      starsContainer.innerHTML = '';
      for (let i = 1; i <= 3; i++) {
        const star = document.createElement('span');
        star.className = `star-icon ${i <= stars ? 'filled' : ''}`;
        star.innerHTML = '★';
        star.style.fontSize = '2.5rem';
        starsContainer.appendChild(star);
      }
    }

    this.updateUserHeader();
  }

  /* ==========================================
     MODAL POPULATION LOGIC
     ========================================== */

  // 1. Profile Modal
  renderProfileModal() {
    const s = window.storageManager.state;
    const p = s.profile;
    const u = s.user;

    document.getElementById('prof-username').textContent = u.username || 'Sky Cadet';
    document.getElementById('prof-user-id').textContent = `ID: ${u.id}`;
    document.getElementById('prof-rank').textContent = this.getRankTitle(p.level);

    document.getElementById('stat-best-score').textContent = p.best_score.toLocaleString();
    document.getElementById('stat-distance').textContent = `${p.total_distance.toLocaleString()}m`;
    document.getElementById('stat-flights').textContent = p.total_flights.toLocaleString();
    document.getElementById('stat-coins').textContent = p.total_coins.toLocaleString();
    document.getElementById('stat-perfect').textContent = p.total_perfect_passes.toLocaleString();
    document.getElementById('stat-obstacles').textContent = p.total_obstacles.toLocaleString();
  }

  getRankTitle(level) {
    if (level >= 25) return '👑 Cosmic Sovereign';
    if (level >= 18) return '⚡ Tempest Archon';
    if (level >= 12) return '🌟 Astral Vanguard';
    if (level >= 8)  return '🦅 Cloud Master';
    if (level >= 4)  return '🪶 Wind Weaver';
    return '🌱 Sky Novice';
  }

  // 2. Worlds & Levels Modal
  renderWorldsModal() {
    const lm = window.gameEngine.levelManager;
    const world = lm.getWorld(lm.currentWorldIndex);

    document.getElementById('world-num-tag').textContent = `WORLD ${world.id} / 8`;
    document.getElementById('world-name-tag').textContent = world.name;

    const grid = document.getElementById('levels-grid-container');
    grid.innerHTML = '';

    for (let l = 1; l <= 5; l++) {
      const levelKey = `w${world.id}_l${l}`;
      const unlocked = window.storageManager.isLevelUnlocked(world.id, l);
      const levelData = window.storageManager.state.levels[levelKey] || { stars: 0, completed: false };

      const card = document.createElement('div');
      card.className = `level-card ${unlocked ? '' : 'locked'}`;
      card.innerHTML = `
        <span class="level-card-number">${l}</span>
        <div class="level-stars-wrap">
          <span class="star-icon ${levelData.stars >= 1 ? 'filled' : ''}">★</span>
          <span class="star-icon ${levelData.stars >= 2 ? 'filled' : ''}">★</span>
          <span class="star-icon ${levelData.stars >= 3 ? 'filled' : ''}">★</span>
        </div>
      `;

      if (unlocked) {
        card.addEventListener('click', () => {
          this.closeModals();
          window.gameEngine.startCampaignLevel(world.id, l);
        });
      }

      grid.appendChild(card);
    }
  }

  // 3. Missions Modal
  async renderMissionsModal() {
    const list = document.getElementById('missions-list-container');
    list.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 2rem;">Loading Missions...</div>';

    try {
      const res = await window.apiClient.getMissions();
      const missions = res.missions || [];

      list.innerHTML = '';
      missions.forEach(m => {
        const item = document.createElement('div');
        item.className = 'mission-item';

        const pct = Math.min(100, Math.round((m.progress / m.target) * 100));

        item.innerHTML = `
          <div class="mission-icon-box">🎯</div>
          <div class="mission-content">
            <span class="mission-title">${m.title}</span>
            <span class="mission-desc">${m.desc} (${m.progress.toLocaleString()} / ${m.target.toLocaleString()})</span>
            <div class="mission-progress-bar">
              <div class="mission-progress-fill" style="width: ${pct}%"></div>
            </div>
          </div>
          <div>
            ${m.claimed ?
              '<button class="btn btn-glass" disabled style="opacity: 0.6">Claimed</button>' :
              (m.completed ?
                `<button class="btn btn-gold btn-claim-mission" data-id="${m.id}">Claim</button>` :
                `<button class="btn btn-glass" disabled>${pct}%</button>`
              )
            }
          </div>
        `;

        const claimBtn = item.querySelector('.btn-claim-mission');
        if (claimBtn) {
          claimBtn.addEventListener('click', async () => {
            try {
              const claimRes = await window.apiClient.claimMission(m.id);
              window.toastManager.success(claimRes.message);
              this.renderMissionsModal();
              this.updateUserHeader();
            } catch (err) {
              window.toastManager.error(err.message);
            }
          });
        }

        list.appendChild(item);
      });
    } catch (e) {
      list.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 2rem;">Offline missions active. Sign in for daily cloud tracking!</div>';
    }
  }

  // 4. Achievements Modal
  async renderAchievementsModal() {
    const list = document.getElementById('achievements-list-container');
    list.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 2rem;">Loading Achievements...</div>';

    try {
      const res = await window.apiClient.getAchievements();
      const achievements = res.achievements || [];

      list.innerHTML = '';
      achievements.forEach(a => {
        const item = document.createElement('div');
        item.className = 'achievement-item';

        item.innerHTML = `
          <div class="achievement-icon-box" style="${a.unlocked ? 'border-color: #fbbf24; background: rgba(245, 158, 11, 0.2);' : ''}">
            ${a.unlocked ? '🏆' : '🔒'}
          </div>
          <div class="achievement-content">
            <span class="achievement-title">${a.title}</span>
            <span class="achievement-desc">${a.desc}</span>
            <span style="font-size: 0.8rem; color: #fbbf24; font-weight: 700;">Reward: +${a.coins} Coins, +${a.gems} Gems</span>
          </div>
          <div>
            ${a.unlocked ?
              '<span style="color: #86efac; font-weight: 800; font-size: 0.85rem;">UNLOCKED</span>' :
              '<span style="color: #64748b; font-weight: 700; font-size: 0.85rem;">LOCKED</span>'
            }
          </div>
        `;
        list.appendChild(item);
      });
    } catch (e) {
      list.innerHTML = '<div style="text-align: center; color: #94a3b8;">Offline achievements active.</div>';
    }
  }

  // 5. Leaderboard Modal
  async renderLeaderboardModal(category = 'global') {
    const tbody = document.getElementById('leaderboard-tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #94a3b8;">Fetching celestial rankings...</td></tr>';

    try {
      const res = await window.apiClient.getLeaderboard(category);
      const rows = res.leaderboard || [];

      tbody.innerHTML = '';
      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #94a3b8;">No records yet. Be the first!</td></tr>';
        return;
      }

      rows.forEach(r => {
        const tr = document.createElement('tr');
        if (r.isCurrentUser) tr.className = 'current-user';

        let rankBadgeClass = 'rank-other';
        if (r.rank === 1) rankBadgeClass = 'rank-1';
        else if (r.rank === 2) rankBadgeClass = 'rank-2';
        else if (r.rank === 3) rankBadgeClass = 'rank-3';

        tr.innerHTML = `
          <td><span class="leaderboard-rank-badge ${rankBadgeClass}">${r.rank}</span></td>
          <td style="color: #ffffff; font-weight: 800;">${r.username} ${r.isCurrentUser ? '(YOU)' : ''}</td>
          <td style="color: #fbbf24; font-weight: 900;">${r.score.toLocaleString()}</td>
          <td style="color: #38bdf8;">${r.distance ? r.distance.toLocaleString() + 'm' : '-'}</td>
          <td>LVL ${r.level || 1}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #ef4444;">Unable to load leaderboard. Server offline.</td></tr>';
    }
  }

  // 6. Skins & Shop Modal
  async renderShopModal() {
    const grid = document.getElementById('shop-items-grid');
    grid.innerHTML = '<div style="color: #94a3b8; padding: 1rem;">Loading Armory...</div>';

    try {
      const res = await window.apiClient.getShopCatalog();
      const items = res.items || [];
      const filtered = items.filter(i => i.type === this.currentShopTab);

      grid.innerHTML = '';
      filtered.forEach(item => {
        const card = document.createElement('div');
        const isSelected = this.selectedShopItem === item.id;
        card.className = `shop-item-card ${isSelected ? 'selected' : ''} ${item.equipped ? 'equipped' : ''}`;

        card.innerHTML = `
          <span class="rarity-pill rarity-${item.rarity}">${item.rarity}</span>
          <span style="font-weight: 800; font-size: 0.95rem; color: #ffffff;">${item.name}</span>
          <span style="font-size: 0.8rem; color: #fbbf24; font-weight: 700;">
            ${item.priceCoins > 0 ? `${item.priceCoins} Coins` : (item.priceGems > 0 ? `${item.priceGems} Gems` : 'FREE')}
          </span>
          <div style="font-size: 0.75rem; color: ${item.equipped ? '#86efac' : (item.owned ? '#94a3b8' : '#cbd5e1')}">
            ${item.equipped ? 'EQUIPPED' : (item.owned ? 'OWNED' : 'LOCKED')}
          </div>
        `;

        card.addEventListener('click', () => {
          this.selectedShopItem = item.id;
          this.updateShopPreview(item);
          document.querySelectorAll('.shop-item-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
        });

        grid.appendChild(card);
      });

      // Select first item or currently equipped
      const activeItem = filtered.find(i => i.id === this.selectedShopItem) || filtered[0];
      if (activeItem) {
        this.selectedShopItem = activeItem.id;
        this.updateShopPreview(activeItem);
      }
    } catch (e) {
      grid.innerHTML = '<div style="color: #ef4444;">Failed to load shop.</div>';
    }
  }

  updateShopPreview(item) {
    document.getElementById('shop-preview-name').textContent = item.name;
    document.getElementById('shop-preview-desc').textContent = item.desc;
    const rarityEl = document.getElementById('shop-preview-rarity');
    rarityEl.textContent = item.rarity;
    rarityEl.className = `rarity-pill rarity-${item.rarity}`;

    const actionBtn = document.getElementById('shop-preview-action-btn');
    if (item.equipped) {
      actionBtn.textContent = 'Equipped';
      actionBtn.className = 'btn btn-glass';
      actionBtn.disabled = true;
    } else if (item.owned) {
      actionBtn.textContent = 'Equip';
      actionBtn.className = 'btn btn-primary';
      actionBtn.disabled = false;
      actionBtn.onclick = async () => {
        try {
          await window.apiClient.equipItem(item.id);
          window.storageManager.setEquippedItem(item.type, item.id);
          window.toastManager.success(`Equipped ${item.name}!`);
          this.renderShopModal();
          this.updateUserHeader();
        } catch (e) {
          window.toastManager.error(e.message);
        }
      };
    } else {
      actionBtn.textContent = `Unlock (${item.priceCoins > 0 ? item.priceCoins + ' Coins' : item.priceGems + ' Gems'})`;
      actionBtn.className = 'btn btn-gold';
      actionBtn.disabled = false;
      actionBtn.onclick = async () => {
        try {
          const res = await window.apiClient.buyItem(item.id);
          window.storageManager.addInventoryItem(item.id);
          window.toastManager.success(res.message);
          this.renderShopModal();
          this.updateUserHeader();
        } catch (e) {
          window.toastManager.error(e.message);
        }
      };
    }

    this.startShopCanvasPreview(item.id);
  }

  startShopCanvasPreview(skinId) {
    const canvas = document.getElementById('shop-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (this.shopPreviewAnim) cancelAnimationFrame(this.shopPreviewAnim);

    const dummyPlayer = new Player(canvas.width / 2, canvas.height / 2);
    dummyPlayer.skin = skinId;

    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dummyPlayer.x = canvas.width / 2;
      dummyPlayer.y = canvas.height / 2 + Math.sin(Date.now() * 0.005) * 6;
      dummyPlayer.update(0.016);
      dummyPlayer.render(ctx);
      this.shopPreviewAnim = requestAnimationFrame(renderLoop);
    };

    renderLoop();
  }

  // 7. Daily Challenge Modal
  async renderDailyModal() {
    try {
      const res = await window.apiClient.getDailyChallenge();
      const ch = res.challenge;

      document.getElementById('daily-title-val').textContent = ch.title;
      document.getElementById('daily-desc-val').textContent = ch.description;
      document.getElementById('daily-target-score').textContent = ch.targetScore.toLocaleString();
      document.getElementById('daily-target-coins').textContent = ch.targetCoins.toLocaleString();
      document.getElementById('daily-reward-coins').textContent = `+${ch.reward.coins} Coins`;
      document.getElementById('daily-reward-gems').textContent = `+${ch.reward.gems} Gems`;

      const playBtn = document.getElementById('btn-play-daily');
      if (res.completed) {
        playBtn.textContent = 'Already Completed Today';
        playBtn.disabled = true;
        playBtn.className = 'btn btn-glass';
      } else {
        playBtn.textContent = 'Enter Daily Challenge';
        playBtn.disabled = false;
        playBtn.className = 'btn btn-gold';
        playBtn.onclick = () => {
          this.closeModals();
          window.gameEngine.startDailyChallenge(ch);
        };
      }
    } catch (e) {
      console.warn('Daily challenge load error:', e);
    }
  }

  // 8. Settings Modal
  renderSettingsModal() {
    const s = window.storageManager.state.settings || {};

    const musicSlider = document.getElementById('setting-music-slider');
    const sfxSlider = document.getElementById('setting-sfx-slider');
    const shakeToggle = document.getElementById('setting-shake-toggle');
    const particlesToggle = document.getElementById('setting-particles-toggle');
    const motionToggle = document.getElementById('setting-motion-toggle');

    if (musicSlider) musicSlider.value = s.music_volume ?? 0.6;
    if (sfxSlider) sfxSlider.value = s.sfx_volume ?? 0.8;
    if (shakeToggle) shakeToggle.checked = (s.screen_shake ?? 1) === 1;
    if (particlesToggle) particlesToggle.checked = (s.particles ?? 1) === 1;
    if (motionToggle) motionToggle.checked = (s.reduced_motion ?? 0) === 1;
  }

  // Live Canvas in Main Menu
  startMenuHeroPreview() {
    const canvas = document.getElementById('menu-hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const hero = new Player(canvas.width / 2, canvas.height / 2);

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hero.skin = window.storageManager.getEquippedSkin();
      hero.x = canvas.width / 2;
      hero.y = canvas.height / 2 + Math.sin(Date.now() * 0.003) * 6;
      hero.update(0.016);
      hero.render(ctx);
      this.menuHeroAnim = requestAnimationFrame(loop);
    };

    loop();
  }

  /* ==========================================
     EVENT BINDINGS
     ========================================== */

  bindEvents() {
    // Main Menu Buttons
    document.getElementById('btn-play-endless')?.addEventListener('click', () => {
      this.showScreen('hud');
      window.gameEngine.startEndlessMode();
    });

    document.getElementById('btn-open-worlds')?.addEventListener('click', () => this.showModal('worlds'));
    document.getElementById('btn-open-daily')?.addEventListener('click', () => this.showModal('daily'));
    document.getElementById('btn-open-missions')?.addEventListener('click', () => this.showModal('missions'));
    document.getElementById('btn-open-achievements')?.addEventListener('click', () => this.showModal('achievements'));
    document.getElementById('btn-open-leaderboard')?.addEventListener('click', () => this.showModal('leaderboard'));
    document.getElementById('btn-open-shop')?.addEventListener('click', () => this.showModal('shop'));
    document.getElementById('btn-open-settings')?.addEventListener('click', () => this.showModal('settings'));
    document.getElementById('btn-open-tutorial')?.addEventListener('click', () => this.showModal('tutorial'));
    document.getElementById('header-player-pill')?.addEventListener('click', () => this.showModal('profile'));

    // World Carousel Prev / Next
    document.getElementById('btn-world-prev')?.addEventListener('click', () => {
      const lm = window.gameEngine.levelManager;
      lm.currentWorldIndex = lm.currentWorldIndex > 1 ? lm.currentWorldIndex - 1 : 8;
      this.renderWorldsModal();
    });

    document.getElementById('btn-world-next')?.addEventListener('click', () => {
      const lm = window.gameEngine.levelManager;
      lm.currentWorldIndex = lm.currentWorldIndex < 8 ? lm.currentWorldIndex + 1 : 1;
      this.renderWorldsModal();
    });

    // Close Modal Buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => this.closeModals());
    });

    // Pause Controls
    document.getElementById('btn-hud-pause')?.addEventListener('click', () => window.gameEngine.pause());
    document.getElementById('btn-pause-resume')?.addEventListener('click', () => window.gameEngine.resume());
    document.getElementById('btn-pause-restart')?.addEventListener('click', () => {
      this.closeModals();
      if (window.gameEngine.mode === 'campaign') {
        const c = window.gameEngine.currentLevelConfig;
        window.gameEngine.startCampaignLevel(c.worldId, c.levelId);
      } else {
        window.gameEngine.startEndlessMode();
      }
    });
    document.getElementById('btn-pause-settings')?.addEventListener('click', () => this.showModal('settings'));
    document.getElementById('btn-pause-quit')?.addEventListener('click', () => {
      this.closeModals();
      this.showScreen('menu');
      window.gameEngine.state = 'MENU';
    });

    // Game Over & Victory Buttons
    document.getElementById('btn-go-retry')?.addEventListener('click', () => {
      this.closeModals();
      if (window.gameEngine.mode === 'campaign') {
        const c = window.gameEngine.currentLevelConfig;
        window.gameEngine.startCampaignLevel(c.worldId, c.levelId);
      } else {
        window.gameEngine.startEndlessMode();
      }
    });

    document.getElementById('btn-go-home')?.addEventListener('click', () => {
      this.closeModals();
      this.showScreen('menu');
      window.gameEngine.state = 'MENU';
    });

    document.getElementById('btn-go-share')?.addEventListener('click', () => {
      const cardUrl = ShareCardGenerator.generateCard({
        username: window.storageManager.state.user.username,
        score: window.gameEngine.score,
        distance: Math.floor(window.gameEngine.distance),
        coins: window.gameEngine.coinsCollected,
        maxCombo: window.gameEngine.comboManager.maxCombo,
        skin: window.storageManager.getEquippedSkin()
      });

      const previewImg = document.getElementById('share-card-preview-img');
      if (previewImg) previewImg.src = cardUrl;

      const downloadLink = document.getElementById('btn-download-share-card');
      if (downloadLink) {
        downloadLink.href = cardUrl;
        downloadLink.download = `skyrush_score_${window.gameEngine.score}.png`;
      }

      this.showModal('share');
    });

    document.getElementById('btn-vic-next')?.addEventListener('click', () => {
      this.closeModals();
      const lm = window.gameEngine.levelManager;
      let nextW = lm.currentWorldIndex;
      let nextL = lm.currentLevelIndex + 1;
      if (nextL > 5) { nextW = Math.min(8, nextW + 1); nextL = 1; }
      window.gameEngine.startCampaignLevel(nextW, nextL);
    });

    document.getElementById('btn-vic-home')?.addEventListener('click', () => {
      this.closeModals();
      this.showScreen('menu');
      window.gameEngine.state = 'MENU';
    });

    // Fullscreen Toggle
    document.getElementById('btn-fullscreen-toggle')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Shop Tabs
    document.querySelectorAll('.shop-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.shop-tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentShopTab = e.target.getAttribute('data-tab');
        this.renderShopModal();
      });
    });

    // Settings inputs
    document.getElementById('setting-music-slider')?.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      window.soundManager.setMusicVolume(vol);
      window.storageManager.updateSettings({ music_volume: vol });
    });

    document.getElementById('setting-sfx-slider')?.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      window.soundManager.setSfxVolume(vol);
      window.storageManager.updateSettings({ sfx_volume: vol });
    });

    document.getElementById('setting-shake-toggle')?.addEventListener('change', (e) => {
      window.storageManager.updateSettings({ screen_shake: e.target.checked ? 1 : 0 });
    });

    document.getElementById('setting-particles-toggle')?.addEventListener('change', (e) => {
      window.storageManager.updateSettings({ particles: e.target.checked ? 1 : 0 });
    });

    document.getElementById('setting-motion-toggle')?.addEventListener('change', (e) => {
      window.storageManager.updateSettings({ reduced_motion: e.target.checked ? 1 : 0 });
    });

    // Profile Actions: Username edit, Password change, Logout
    this.bindAuthAndProfileActions();
  }

  bindAuthAndProfileActions() {
    // Auth Tab switching
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const formType = e.target.getAttribute('data-form');
        document.getElementById('auth-form-login').style.display = formType === 'login' ? 'flex' : 'none';
        document.getElementById('auth-form-register').style.display = formType === 'register' ? 'flex' : 'none';
      });
    });

    // Register Form Submit
    document.getElementById('btn-submit-register')?.addEventListener('click', async () => {
      const u = document.getElementById('reg-username').value;
      const em = document.getElementById('reg-email').value;
      const p1 = document.getElementById('reg-pass').value;
      const p2 = document.getElementById('reg-pass-confirm').value;

      try {
        const res = await window.apiClient.register(u, em, p1, p2);
        window.storageManager.state.user = res.user;
        window.storageManager.state.isGuest = false;
        window.storageManager.saveLocalState();
        window.toastManager.success(`Welcome to SkyRush, ${res.user.username}!`);
        this.closeModals();
        this.updateUserHeader();
      } catch (err) {
        window.toastManager.error(err.message);
      }
    });

    // Login Form Submit
    document.getElementById('btn-submit-login')?.addEventListener('click', async () => {
      const ident = document.getElementById('login-ident').value;
      const pass = document.getElementById('login-pass').value;

      try {
        const res = await window.apiClient.login(ident, pass);
        window.storageManager.state.user = res.user;
        window.storageManager.state.profile = res.profile;
        window.storageManager.state.isGuest = false;
        window.storageManager.saveLocalState();
        window.toastManager.success(`Welcome back, ${res.user.username}!`);
        this.closeModals();
        this.updateUserHeader();
      } catch (err) {
        window.toastManager.error(err.message);
      }
    });

    // Open Auth Modal from Profile if guest
    document.getElementById('btn-profile-login-link')?.addEventListener('click', () => {
      this.showModal('auth');
    });

    // Change Username in Profile
    document.getElementById('btn-change-username')?.addEventListener('click', async () => {
      const newName = prompt('Enter new pilot username:');
      if (newName && newName.trim().length >= 3) {
        try {
          const res = await window.apiClient.updateProfile({ username: newName.trim() });
          window.storageManager.state.user.username = res.user.username;
          window.storageManager.saveLocalState();
          window.toastManager.success('Username updated!');
          this.renderProfileModal();
          this.updateUserHeader();
        } catch (e) {
          window.toastManager.error(e.message || 'Error updating username');
        }
      }
    });

    // Logout
    document.getElementById('btn-profile-logout')?.addEventListener('click', () => {
      window.apiClient.setToken(null);
      window.storageManager.state.isGuest = true;
      window.storageManager.state.user = window.storageManager.getDefaultState().user;
      window.storageManager.saveLocalState();
      window.toastManager.success('Logged out successfully.');
      this.closeModals();
      this.updateUserHeader();
    });
  }
}

window.UIManager = UIManager;
