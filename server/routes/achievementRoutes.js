const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, optionalAuth } = require('../auth');

const ACHIEVEMENTS_LIST = [
  { id: 'first_flight', title: 'First Flight', desc: 'Take off into the celestial skies for the first time', icon: 'wing', coins: 50, gems: 2 },
  { id: 'first_100', title: 'Centurion', desc: 'Reach a score of 100 in a single flight', icon: 'trophy', coins: 100, gems: 5 },
  { id: 'sky_beginner', title: 'Sky Apprentice', desc: 'Reach a score of 500 in a single flight', icon: 'feather', coins: 200, gems: 10 },
  { id: 'coin_collector', title: 'Gilded Hoarder', desc: 'Gather a cumulative total of 100 sky coins', icon: 'coin', coins: 250, gems: 10 },
  { id: 'perfect_pilot', title: 'Near-Miss Virtuoso', desc: 'Perform 10 Perfect Passes near obstacle edges', icon: 'sparkle', coins: 300, gems: 15 },
  { id: 'speed_demon', title: 'Supersonic', desc: 'Achieve a score of 2,000 in Endless Mode', icon: 'bolt', coins: 500, gems: 25 },
  { id: 'high_flyer', title: 'Stratosphere Pioneer', desc: 'Fly a cumulative distance of 5,000 meters', icon: 'cloud', coins: 600, gems: 30 },
  { id: 'untouchable', title: 'Untouchable Grace', desc: 'Perform 5 Perfect Passes within a single run', icon: 'shield', coins: 400, gems: 20 },
  { id: 'millionaire', title: 'Sky Tycoon', desc: 'Accumulate 2,500 total coins in your vault', icon: 'vault', coins: 1000, gems: 35 },
  { id: 'world_explorer', title: 'World Voyager', desc: 'Clear 5 distinct campaign levels', icon: 'globe', coins: 500, gems: 25 },
  { id: 'level_master', title: 'Master of Winds', desc: 'Ascend to Player Level 5', icon: 'crown', coins: 750, gems: 35 },
  { id: 'cosmic_ascension', title: 'Cosmic Ascendant', desc: 'Unlock and visit World 8: Cosmic Flight', icon: 'star', coins: 1500, gems: 50 }
];

router.get('/', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : null;
  const unlockedMap = new Map();

  if (userId) {
    const rows = db.prepare('SELECT achievement_id, progress, unlocked, unlocked_at FROM user_achievements WHERE user_id = ?').all(userId);
    rows.forEach(r => unlockedMap.set(r.achievement_id, r));
  }

  const achievements = ACHIEVEMENTS_LIST.map(a => {
    const userAch = unlockedMap.get(a.id);
    return {
      ...a,
      unlocked: userAch ? !!userAch.unlocked : false,
      progress: userAch ? userAch.progress : 0,
      unlockedAt: userAch ? userAch.unlocked_at : null
    };
  });

  res.json({ achievements });
});

module.exports = router;
