const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, optionalAuth } = require('../auth');

function getTodayKey() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Generate challenge parameters based on date seed
function getDailyChallengeConfig(dateKey) {
  // Simple deterministic hash of dateKey
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);

  const modifiers = [
    { id: 'gravity_surge', name: 'Gravity Surge', desc: 'Heavy gravitational pull, requiring quicker flaps', gravityMod: 1.25, speedMod: 1.0 },
    { id: 'storm_gale', name: 'Tempest Gale', desc: 'Fierce cross-winds and dynamic turbulent drafts', gravityMod: 1.0, speedMod: 1.15 },
    { id: 'golden_harvest', name: 'Golden Harvest', desc: 'Abundance of sparkling sky coins and gems', coinDensity: 2.0, speedMod: 1.0 },
    { id: 'narrow_corridor', name: 'Crystalline Ruin', desc: 'Narrower ancient celestial arches', gapMod: 0.85, speedMod: 1.05 },
    { id: 'speed_rush', name: 'Sonic Velocity', desc: 'Increased baseline flight velocity', speedMod: 1.3, gravityMod: 1.0 }
  ];

  const modifier = modifiers[hash % modifiers.length];
  const targetScore = 1500 + (hash % 10) * 150; // 1500 - 3000
  const targetCoins = 25 + (hash % 6) * 5;      // 25 - 50

  return {
    dateKey,
    title: `Daily Trial: ${modifier.name}`,
    description: `Surpass ${targetScore} points and collect ${targetCoins} coins under celestial conditions!`,
    targetScore,
    targetCoins,
    modifier,
    reward: {
      coins: 500,
      gems: 5,
      xp: 350,
      badge: 'daily_conqueror'
    }
  };
}

// Get today's challenge
router.get('/', optionalAuth, (req, res) => {
  const dateKey = getTodayKey();
  const challenge = getDailyChallengeConfig(dateKey);
  let completed = false;
  let userScore = 0;

  if (req.user) {
    const record = db.prepare('SELECT score, completed_at FROM user_daily_completions WHERE user_id = ? AND date_key = ?').get(req.user.id, dateKey);
    if (record) {
      completed = true;
      userScore = record.score;
    }
  }

  res.json({
    challenge,
    completed,
    userScore
  });
});

// Complete today's challenge
router.post('/complete', authMiddleware, (req, res) => {
  const { score = 0, coins = 0 } = req.body;
  const dateKey = getTodayKey();
  const challenge = getDailyChallengeConfig(dateKey);
  const userId = req.user.id;

  if (score < challenge.targetScore || coins < challenge.targetCoins) {
    return res.status(400).json({
      error: 'Daily challenge conditions not met',
      targetScore: challenge.targetScore,
      currentScore: score,
      targetCoins: challenge.targetCoins,
      currentCoins: coins
    });
  }

  const existing = db.prepare('SELECT 1 FROM user_daily_completions WHERE user_id = ? AND date_key = ?').get(userId, dateKey);
  if (existing) {
    return res.status(400).json({ error: 'Today’s daily challenge has already been completed' });
  }

  const tx = db.transaction(() => {
    db.prepare('INSERT INTO user_daily_completions (user_id, date_key, score) VALUES (?, ?, ?)').run(userId, dateKey, score);
    db.prepare(`
      UPDATE profiles SET
        coins = coins + ?,
        gems = gems + ?,
        xp = xp + ?,
        level = (xp + ?) / 500 + 1
      WHERE user_id = ?
    `).run(challenge.reward.coins, challenge.reward.gems, challenge.reward.xp, challenge.reward.xp, userId);
  });

  try {
    tx();
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
    res.json({
      success: true,
      message: 'Daily Challenge Completed!',
      reward: challenge.reward,
      profile
    });
  } catch (err) {
    console.error('Daily completion error:', err);
    res.status(500).json({ error: 'Failed to record daily completion' });
  }
});

module.exports = router;
