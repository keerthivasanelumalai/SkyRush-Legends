const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, optionalAuth } = require('../auth');

// Get all level progress for user
router.get('/', optionalAuth, (req, res) => {
  if (!req.user) {
    return res.json({ levels: [] });
  }

  const rows = db.prepare(`
    SELECT level_id, stars, high_score, completed, updated_at
    FROM game_progress
    WHERE user_id = ?
  `).all(req.user.id);

  res.json({ levels: rows });
});

// Submit completion for a specific level
router.post('/level', authMiddleware, (req, res) => {
  const { levelId, stars = 1, score = 0, coinsEarned = 0, perfectPasses = 0 } = req.body;

  if (!levelId) {
    return res.status(400).json({ error: 'Level ID is required' });
  }

  const validStars = Math.min(3, Math.max(1, parseInt(stars, 10)));
  const userId = req.user.id;

  // XP based on stars
  const xpReward = validStars * 150 + 50;

  const tx = db.transaction(() => {
    // Upsert level progress
    db.prepare(`
      INSERT INTO game_progress (user_id, level_id, stars, high_score, completed)
      VALUES (?, ?, ?, ?, 1)
      ON CONFLICT(user_id, level_id) DO UPDATE SET
        stars = MAX(stars, excluded.stars),
        high_score = MAX(high_score, excluded.high_score),
        completed = 1,
        updated_at = CURRENT_TIMESTAMP
    `).run(userId, levelId, validStars, score);

    // Update player profile with XP & Coins
    db.prepare(`
      UPDATE profiles SET
        coins = coins + ?,
        xp = xp + ?,
        level = (xp + ?) / 500 + 1,
        total_coins = total_coins + ?,
        total_perfect_passes = total_perfect_passes + ?,
        total_flights = total_flights + 1
      WHERE user_id = ?
    `).run(coinsEarned, xpReward, xpReward, coinsEarned, perfectPasses, userId);
  });

  try {
    tx();
    const updatedLevel = db.prepare('SELECT * FROM game_progress WHERE user_id = ? AND level_id = ?').get(userId, levelId);
    const updatedProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);

    res.json({
      success: true,
      level: updatedLevel,
      xpGained: xpReward,
      profile: updatedProfile
    });
  } catch (err) {
    console.error('Level progress update error:', err);
    res.status(500).json({ error: 'Failed to update level progress' });
  }
});

module.exports = router;
