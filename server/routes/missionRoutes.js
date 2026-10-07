const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../auth');

const MISSION_DEFINITIONS = [
  // Daily Missions
  {
    id: 'daily_fly_1000',
    type: 'daily',
    title: 'Wind Navigator',
    desc: 'Fly 1,000 meters in total',
    target: 1000,
    statKey: 'total_distance',
    reward: { coins: 150, xp: 75, gems: 2 }
  },
  {
    id: 'daily_coins_50',
    type: 'daily',
    title: 'Gilded Wings',
    desc: 'Collect 50 coins in flight',
    target: 50,
    statKey: 'total_coins',
    reward: { coins: 200, xp: 50, gems: 3 }
  },
  {
    id: 'daily_perfect_5',
    type: 'daily',
    title: 'Precision Ace',
    desc: 'Execute 5 near-miss Perfect Passes',
    target: 5,
    statKey: 'total_perfect_passes',
    reward: { coins: 250, xp: 100, gems: 4 }
  },
  {
    id: 'daily_play_3',
    type: 'daily',
    title: 'Sky Explorer',
    desc: 'Take flight 3 times today',
    target: 3,
    statKey: 'total_flights',
    reward: { coins: 120, xp: 50, gems: 1 }
  },

  // Lifetime Missions
  {
    id: 'life_dist_10k',
    type: 'lifetime',
    title: 'Odyssey of the Skies',
    desc: 'Accumulate 10,000 total meters flown',
    target: 10000,
    statKey: 'total_distance',
    reward: { coins: 500, xp: 300, gems: 10 }
  },
  {
    id: 'life_coins_1k',
    type: 'lifetime',
    title: 'Treasury Raider',
    desc: 'Collect 1,000 total coins across all flights',
    target: 1000,
    statKey: 'total_coins',
    reward: { coins: 800, xp: 400, gems: 15 }
  },
  {
    id: 'life_perfect_50',
    type: 'lifetime',
    title: 'Blade Dancer',
    desc: 'Perform 50 Perfect Passes near obstacle edges',
    target: 50,
    statKey: 'total_perfect_passes',
    reward: { coins: 1000, xp: 500, gems: 20 }
  },
  {
    id: 'life_score_5k',
    type: 'lifetime',
    title: 'Apex Sovereign',
    desc: 'Achieve a personal best score of 5,000 points',
    target: 500,
    statKey: 'best_score',
    reward: { coins: 1500, xp: 750, gems: 30 }
  }
];

// Get missions with current progress
router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const claimedRows = db.prepare('SELECT mission_id, claimed FROM user_missions WHERE user_id = ?').all(userId);
  const claimedMap = new Map();
  claimedRows.forEach(r => claimedMap.set(r.mission_id, r.claimed === 1));

  const missions = MISSION_DEFINITIONS.map(m => {
    const userVal = profile[m.statKey] || 0;
    const progress = Math.min(m.target, userVal);
    const completed = userVal >= m.target;
    const claimed = claimedMap.get(m.id) || false;

    return {
      id: m.id,
      type: m.type,
      title: m.title,
      desc: m.desc,
      progress,
      target: m.target,
      completed,
      claimed,
      reward: m.reward
    };
  });

  res.json({ missions });
});

// Claim a completed mission reward
router.post('/claim', authMiddleware, (req, res) => {
  const { missionId } = req.body;
  const userId = req.user.id;

  const missionDef = MISSION_DEFINITIONS.find(m => m.id === missionId);
  if (!missionDef) {
    return res.status(404).json({ error: 'Mission definition not found' });
  }

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const userVal = profile[missionDef.statKey] || 0;
  if (userVal < missionDef.target) {
    return res.status(400).json({ error: 'Mission requirements not yet fulfilled' });
  }

  const claimedRecord = db.prepare('SELECT claimed FROM user_missions WHERE user_id = ? AND mission_id = ?').get(userId, missionId);
  if (claimedRecord && claimedRecord.claimed === 1) {
    return res.status(400).json({ error: 'Mission reward already claimed' });
  }

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO user_missions (user_id, mission_id, progress, completed, claimed, date_assigned)
      VALUES (?, ?, ?, 1, 1, DATE('now'))
      ON CONFLICT(user_id, mission_id) DO UPDATE SET
        completed = 1,
        claimed = 1
    `).run(userId, missionId, userVal);

    db.prepare(`
      UPDATE profiles SET
        coins = coins + ?,
        gems = gems + ?,
        xp = xp + ?,
        level = (xp + ?) / 500 + 1
      WHERE user_id = ?
    `).run(missionDef.reward.coins, missionDef.reward.gems, missionDef.reward.xp, missionDef.reward.xp, userId);
  });

  try {
    tx();
    const updatedProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
    res.json({
      success: true,
      message: `Claimed reward for ${missionDef.title}!`,
      reward: missionDef.reward,
      profile: updatedProfile
    });
  } catch (err) {
    console.error('Mission claim error:', err);
    res.status(500).json({ error: 'Failed to claim mission reward' });
  }
});

module.exports = router;
