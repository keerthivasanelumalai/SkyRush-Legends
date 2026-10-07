const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, optionalAuth } = require('../auth');

router.get('/', optionalAuth, (req, res) => {
  if (!req.user) {
    return res.json({
      settings: {
        music_volume: 0.7,
        sfx_volume: 0.8,
        screen_shake: 1,
        particles: 1,
        reduced_motion: 0,
        quality: 'high',
        controls_hint: 1
      }
    });
  }

  const row = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.user.id);
  res.json({ settings: row || {} });
});

router.put('/', authMiddleware, (req, res) => {
  const {
    music_volume = 0.7,
    sfx_volume = 0.8,
    screen_shake = 1,
    particles = 1,
    reduced_motion = 0,
    quality = 'high',
    controls_hint = 1
  } = req.body;

  db.prepare(`
    INSERT INTO settings (user_id, music_volume, sfx_volume, screen_shake, particles, reduced_motion, quality, controls_hint, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      music_volume = excluded.music_volume,
      sfx_volume = excluded.sfx_volume,
      screen_shake = excluded.screen_shake,
      particles = excluded.particles,
      reduced_motion = excluded.reduced_motion,
      quality = excluded.quality,
      controls_hint = excluded.controls_hint,
      updated_at = CURRENT_TIMESTAMP
  `).run(
    req.user.id,
    parseFloat(music_volume),
    parseFloat(sfx_volume),
    screen_shake ? 1 : 0,
    particles ? 1 : 0,
    reduced_motion ? 1 : 0,
    quality,
    controls_hint ? 1 : 0
  );

  const updated = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.user.id);
  res.json({ success: true, settings: updated });
});

module.exports = router;
