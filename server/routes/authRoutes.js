const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { hashPassword, comparePassword, generateToken, authMiddleware } = require('../auth');

// Register
router.post('/register', (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  if (username.trim().length < 3 || username.trim().length > 20) {
    return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username.trim(), email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'Username or email is already registered' });
  }

  const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
  const passwordHash = hashPassword(password);
  const cleanUsername = username.trim();
  const cleanEmail = email.toLowerCase().trim();

  const registerTx = db.transaction(() => {
    db.prepare('INSERT INTO users (id, username, email, password_hash, avatar) VALUES (?, ?, ?, ?, ?)').run(
      userId,
      cleanUsername,
      cleanEmail,
      passwordHash,
      'falcon_classic'
    );

    db.prepare(`
      INSERT INTO profiles (user_id, level, xp, coins, gems, best_score, equipped_skin, equipped_trail, equipped_particle)
      VALUES (?, 1, 0, 150, 15, 0, 'classic', 'starlight', 'sparks')
    `).run(userId);

    db.prepare(`
      INSERT INTO settings (user_id, music_volume, sfx_volume, screen_shake, particles, reduced_motion, quality)
      VALUES (?, 0.7, 0.8, 1, 1, 0, 'high')
    `).run(userId);

    // Default owned items
    db.prepare('INSERT INTO inventory (user_id, item_type, item_id) VALUES (?, ?, ?)').run(userId, 'skin', 'classic');
    db.prepare('INSERT INTO inventory (user_id, item_type, item_id) VALUES (?, ?, ?)').run(userId, 'trail', 'starlight');
  });

  try {
    registerTx();
    const user = { id: userId, username: cleanUsername, email: cleanEmail };
    const token = generateToken(user);
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: userId,
        username: cleanUsername,
        email: cleanEmail,
        avatar: 'falcon_classic'
      },
      profile
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  const user = db.prepare(`
    SELECT * FROM users WHERE username = ? OR email = ?
  `).get(usernameOrEmail.trim(), usernameOrEmail.toLowerCase().trim());

  if (!user || !comparePassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username/email or password' });
  }

  const token = generateToken(user);
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
  const settings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(user.id) || {};

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.created_at
    },
    profile,
    settings
  });
});

// Get current user details
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
  const settings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(user.id) || {};
  const inventory = db.prepare('SELECT item_type, item_id FROM inventory WHERE user_id = ?').all(user.id);

  res.json({
    user,
    profile,
    settings,
    inventory
  });
});

// Update profile (username, avatar)
router.put('/profile', authMiddleware, (req, res) => {
  const { username, avatar } = req.body;
  const updates = [];
  const params = [];

  if (username) {
    if (username.trim().length < 3 || username.trim().length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username.trim(), req.user.id);
    if (existing) {
      return res.status(409).json({ error: 'Username is already taken' });
    }
    updates.push('username = ?');
    params.push(username.trim());
  }

  if (avatar) {
    updates.push('avatar = ?');
    params.push(avatar);
  }

  if (updates.length > 0) {
    params.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const updatedUser = db.prepare('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ message: 'Profile updated successfully', user: updatedUser });
});

// Update password
router.put('/password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!user || !comparePassword(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Current password does not match' });
  }

  const newHash = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

  res.json({ message: 'Password updated successfully' });
});

// Delete account
router.delete('/account', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  res.json({ message: 'Account permanently deleted' });
});

// Sync guest progress to user account
router.post('/sync-guest', authMiddleware, (req, res) => {
  const { guestProfile, guestProgress } = req.body;
  if (!guestProfile && !guestProgress) {
    return res.status(400).json({ error: 'No guest data provided' });
  }

  const userProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  if (!userProfile) return res.status(404).json({ error: 'Profile not found' });

  const syncTx = db.transaction(() => {
    if (guestProfile) {
      const mergedScore = Math.max(userProfile.best_score || 0, guestProfile.bestScore || 0);
      const mergedCoins = (userProfile.coins || 0) + (guestProfile.coinsEarned || 0);
      const mergedDistance = (userProfile.total_distance || 0) + (guestProfile.totalDistance || 0);
      const mergedFlights = (userProfile.total_flights || 0) + (guestProfile.totalFlights || 0);

      db.prepare(`
        UPDATE profiles SET
          best_score = ?,
          coins = ?,
          total_distance = ?,
          total_flights = ?
        WHERE user_id = ?
      `).run(mergedScore, mergedCoins, mergedDistance, mergedFlights, req.user.id);
    }

    if (Array.isArray(guestProgress)) {
      const insertOrUpdateProg = db.prepare(`
        INSERT INTO game_progress (user_id, level_id, stars, high_score, completed)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, level_id) DO UPDATE SET
          stars = MAX(stars, excluded.stars),
          high_score = MAX(high_score, excluded.high_score),
          completed = MAX(completed, excluded.completed)
      `);

      for (const prog of guestProgress) {
        insertOrUpdateProg.run(req.user.id, prog.levelId, prog.stars || 0, prog.highScore || 0, prog.completed ? 1 : 0);
      }
    }
  });

  syncTx();
  const updatedProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  res.json({ message: 'Guest progress merged successfully', profile: updatedProfile });
});

module.exports = router;
