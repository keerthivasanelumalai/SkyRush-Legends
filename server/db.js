const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'skyrush.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance concurrency
db.pragma('journal_mode = WAL');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT DEFAULT 'falcon_classic',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      coins INTEGER DEFAULT 100,
      gems INTEGER DEFAULT 10,
      best_score INTEGER DEFAULT 0,
      total_flights INTEGER DEFAULT 0,
      total_distance INTEGER DEFAULT 0,
      total_coins INTEGER DEFAULT 0,
      total_perfect_passes INTEGER DEFAULT 0,
      total_obstacles INTEGER DEFAULT 0,
      equipped_skin TEXT DEFAULT 'classic',
      equipped_trail TEXT DEFAULT 'starlight',
      equipped_particle TEXT DEFAULT 'sparks',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS game_progress (
      user_id TEXT,
      level_id TEXT,
      stars INTEGER DEFAULT 0,
      high_score INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id, level_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scores (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      mode TEXT NOT NULL,
      score INTEGER NOT NULL,
      distance INTEGER NOT NULL,
      coins INTEGER NOT NULL,
      run_token TEXT,
      validated INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      user_id TEXT,
      achievement_id TEXT,
      progress INTEGER DEFAULT 0,
      unlocked INTEGER DEFAULT 0,
      unlocked_at DATETIME,
      PRIMARY KEY(user_id, achievement_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_missions (
      user_id TEXT,
      mission_id TEXT,
      progress INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      claimed INTEGER DEFAULT 0,
      date_assigned TEXT,
      PRIMARY KEY(user_id, mission_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventory (
      user_id TEXT,
      item_type TEXT,
      item_id TEXT,
      acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id, item_type, item_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_daily_completions (
      user_id TEXT,
      date_key TEXT,
      score INTEGER DEFAULT 0,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id, date_key),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      user_id TEXT PRIMARY KEY,
      music_volume REAL DEFAULT 0.7,
      sfx_volume REAL DEFAULT 0.8,
      screen_shake INTEGER DEFAULT 1,
      particles INTEGER DEFAULT 1,
      reduced_motion INTEGER DEFAULT 0,
      quality TEXT DEFAULT 'high',
      controls_hint INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed default leaderboard champions if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM scores').get().count;
  if (count === 0) {
    seedInitialData();
  }
}

function seedInitialData() {
  const seedUsers = [
    { id: 'usr_sky_ace', username: 'AeroZephyr', email: 'aero@skyrush.game', avatar: 'falcon_golden', score: 12450, dist: 6200, coins: 540, skin: 'golden' },
    { id: 'usr_nebula_fox', username: 'VortexValkyrie', email: 'valk@skyrush.game', avatar: 'falcon_galaxy', score: 9820, dist: 4900, coins: 410, skin: 'galaxy' },
    { id: 'usr_blaze_talon', username: 'SolarFlare_99', email: 'flare@skyrush.game', avatar: 'falcon_fire', score: 7650, dist: 3800, coins: 330, skin: 'fire' },
    { id: 'usr_neon_drift', username: 'CyberGale', email: 'cyber@skyrush.game', avatar: 'falcon_neon', score: 6200, dist: 3100, coins: 280, skin: 'neon' },
    { id: 'usr_frost_wing', username: 'FrostPhoenix', email: 'frost@skyrush.game', avatar: 'falcon_ice', score: 4890, dist: 2450, coins: 210, skin: 'ice' }
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, email, password_hash, avatar)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertProfile = db.prepare(`
    INSERT OR IGNORE INTO profiles (user_id, level, xp, coins, gems, best_score, total_flights, total_distance, total_coins, equipped_skin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertScore = db.prepare(`
    INSERT INTO scores (id, user_id, mode, score, distance, coins, validated, created_at)
    VALUES (?, ?, 'endless', ?, ?, ?, 1, datetime('now', ?))
  `);

  const seedTx = db.transaction(() => {
    seedUsers.forEach((u, idx) => {
      // Mock hash for seed users
      insertUser.run(u.id, u.username, u.email, 'SEED_LOCKED_ACCOUNT', u.avatar);
      insertProfile.run(u.id, 15 - idx * 2, 4500 - idx * 700, 2500 - idx * 400, 150 - idx * 25, u.score, 45 - idx * 5, u.dist * 3, u.coins * 4, u.skin);
      insertScore.run(`score_seed_${idx}`, u.id, u.score, u.dist, u.coins, `-${idx * 2} hours`);
    });
  });

  seedTx();
}

initDb();

module.exports = db;
