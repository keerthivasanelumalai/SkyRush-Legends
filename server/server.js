const express = require('express');
const cors = require('cors');
const path = require('path');
require('./db'); // Ensure DB tables are initialized

const authRoutes = require('./routes/authRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const progressRoutes = require('./routes/progressRoutes');
const missionRoutes = require('./routes/missionRoutes');
const shopRoutes = require('./routes/shopRoutes');
const dailyRoutes = require('./routes/dailyRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/daily', dailyRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    game: 'SkyRush Legends',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static assets
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Fallback to index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error occurred' });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` SkyRush Legends Game Server Running!`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(` Environment: Production-Ready`);
  console.log(`===============================================`);
});
