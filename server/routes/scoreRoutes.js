const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { optionalAuth } = require('../auth');
const { createRunSession, validateScoreSubmission } = require('../antiCheat');

// Start a game run session and get token
router.post('/start', optionalAuth, (req, res) => {
  const { mode = 'endless', levelId = null } = req.body;
  const userId = req.user ? req.user.id : 'guest';
  const session = createRunSession({ userId, mode, levelId });
  res.json(session);
});

// Submit a game score
router.post('/submit', optionalAuth, (req, res) => {
  const {
    runToken,
    mode = 'endless',
    score = 0,
    distance = 0,
    coins = 0,
    flaps = 0,
    obstaclesPassed = 0,
    perfectPasses = 0,
    durationMs = 0
  } = req.body;

  // Validation
  const validation = validateScoreSubmission({
    runToken,
    score,
    distance,
    coins,
    flaps,
    obstaclesPassed,
    perfectPasses,
    durationMs
  });

  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  const userId = req.user ? req.user.id : null;
  const scoreId = 'sc_' + crypto.randomBytes(8).toString('hex');
  let newRecord = false;
  let xpGained = Math.floor(score * 0.5) + (coins * 2) + (perfectPasses * 10) + 15;
  let newAchievements = [];
  let updatedProfile = null;

  if (userId) {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
    if (profile) {
      if (score > (profile.best_score || 0)) {
        newRecord = true;
      }

      const totalXp = (profile.xp || 0) + xpGained;
      // Level formula: level = Math.floor(totalXp / 500) + 1
      const newLevel = Math.floor(totalXp / 500) + 1;
      const newCoins = (profile.coins || 0) + coins;
      const newDistance = (profile.total_distance || 0) + distance;
      const newFlights = (profile.total_flights || 0) + 1;
      const newTotalCoins = (profile.total_coins || 0) + coins;
      const newPerfect = (profile.total_perfect_passes || 0) + perfectPasses;
      const newObstacles = (profile.total_obstacles || 0) + obstaclesPassed;
      const bestScore = Math.max(profile.best_score || 0, score);

      db.prepare(`
        UPDATE profiles SET
          best_score = ?,
          level = ?,
          xp = ?,
          coins = ?,
          total_flights = ?,
          total_distance = ?,
          total_coins = ?,
          total_perfect_passes = ?,
          total_obstacles = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
        bestScore,
        newLevel,
        totalXp,
        newCoins,
        newFlights,
        newDistance,
        newTotalCoins,
        newPerfect,
        newObstacles,
        userId
      );

      // Save score record
      db.prepare(`
        INSERT INTO scores (id, user_id, mode, score, distance, coins, run_token, validated)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).run(scoreId, userId, mode, score, distance, coins, runToken);

      // Check achievement conditions
      const achievementDefs = [
        { id: 'first_flight', condition: newFlights >= 1, reward: { coins: 50, gems: 2 } },
        { id: 'first_100', condition: bestScore >= 100, reward: { coins: 100, gems: 5 } },
        { id: 'sky_beginner', condition: bestScore >= 500, reward: { coins: 200, gems: 10 } },
        { id: 'coin_collector', condition: newTotalCoins >= 100, reward: { coins: 250, gems: 10 } },
        { id: 'perfect_pilot', condition: newPerfect >= 10, reward: { coins: 300, gems: 15 } },
        { id: 'speed_demon', condition: bestScore >= 2000, reward: { coins: 500, gems: 25 } },
        { id: 'high_flyer', condition: newDistance >= 5000, reward: { coins: 600, gems: 30 } },
        { id: 'untouchable', condition: perfectPasses >= 5, reward: { coins: 400, gems: 20 } },
        { id: 'level_master', condition: newLevel >= 5, reward: { coins: 750, gems: 35 } }
      ];

      const checkAch = db.prepare('SELECT unlocked FROM user_achievements WHERE user_id = ? AND achievement_id = ?');
      const insertAch = db.prepare(`
        INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked, unlocked_at)
        VALUES (?, ?, 100, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, achievement_id) DO UPDATE SET unlocked = 1, unlocked_at = CURRENT_TIMESTAMP
      `);

      for (const ach of achievementDefs) {
        const row = checkAch.get(userId, ach.id);
        if ((!row || !row.unlocked) && ach.condition) {
          insertAch.run(userId, ach.id);
          newAchievements.push(ach);
          // Grant reward
          db.prepare('UPDATE profiles SET coins = coins + ?, gems = gems + ? WHERE user_id = ?').run(
            ach.reward.coins,
            ach.reward.gems,
            userId
          );
        }
      }

      updatedProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
    }
  }

  res.json({
    success: true,
    score,
    distance,
    coins,
    xpGained,
    newRecord,
    newAchievements,
    profile: updatedProfile
  });
});

module.exports = router;
