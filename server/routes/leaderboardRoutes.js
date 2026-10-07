const express = require('express');
const router = express.Router();
const db = require('../db');
const { optionalAuth } = require('../auth');

router.get('/', optionalAuth, (req, res) => {
  const category = req.query.category || 'global'; // global, weekly, daily
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
  const currentUserId = req.user ? req.user.id : null;

  let timeFilter = '';
  if (category === 'daily') {
    timeFilter = `AND s.created_at >= datetime('now', '-1 day')`;
  } else if (category === 'weekly') {
    timeFilter = `AND s.created_at >= datetime('now', '-7 days')`;
  }

  // Get highest score per user within the time range
  const query = `
    SELECT 
      u.id as user_id,
      u.username,
      u.avatar,
      p.level,
      p.equipped_skin,
      MAX(s.score) as high_score,
      MAX(s.distance) as best_distance,
      MAX(s.created_at) as achieved_at
    FROM scores s
    JOIN users u ON s.user_id = u.id
    JOIN profiles p ON u.id = p.user_id
    WHERE s.validated = 1 ${timeFilter}
    GROUP BY u.id
    ORDER BY high_score DESC, best_distance DESC
    LIMIT ?
  `;

  try {
    const rows = db.prepare(query).all(limit);

    let currentUserRank = null;
    let currentUserRow = null;

    const leaderboard = rows.map((row, index) => {
      const isCurrent = currentUserId === row.user_id;
      if (isCurrent) {
        currentUserRank = index + 1;
        currentUserRow = {
          rank: currentUserRank,
          userId: row.user_id,
          username: row.username,
          avatar: row.avatar,
          level: row.level,
          skin: row.equipped_skin,
          score: row.high_score,
          distance: row.best_distance,
          isCurrentUser: true
        };
      }
      return {
        rank: index + 1,
        userId: row.user_id,
        username: row.username,
        avatar: row.avatar,
        level: row.level,
        skin: row.equipped_skin,
        score: row.high_score,
        distance: row.best_distance,
        isCurrentUser: isCurrent
      };
    });

    // If current user is logged in but not in the top list, query their stats
    if (currentUserId && !currentUserRow) {
      const userStat = db.prepare(`
        SELECT u.id as user_id, u.username, u.avatar, p.level, p.equipped_skin, p.best_score, p.total_distance
        FROM users u
        JOIN profiles p ON u.id = p.user_id
        WHERE u.id = ?
      `).get(currentUserId);

      if (userStat) {
        // Calculate user's rank count
        const rankCount = db.prepare(`
          SELECT COUNT(DISTINCT user_id) as higher_count
          FROM scores
          WHERE score > ? AND validated = 1
        `).get(userStat.best_score || 0).higher_count;

        currentUserRow = {
          rank: rankCount + 1,
          userId: userStat.user_id,
          username: userStat.username,
          avatar: userStat.avatar,
          level: userStat.level,
          skin: userStat.equipped_skin,
          score: userStat.best_score,
          distance: userStat.total_distance,
          isCurrentUser: true
        };
      }
    }

    res.json({
      category,
      total: leaderboard.length,
      leaderboard,
      currentUser: currentUserRow
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
});

module.exports = router;
