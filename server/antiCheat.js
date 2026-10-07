const crypto = require('crypto');

// In-memory active game runs cache with expiration
const activeRuns = new Map();

// Clean up expired runs every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, run] of activeRuns.entries()) {
    if (now - run.startTime > 30 * 60 * 1000) { // 30 minutes max per run
      activeRuns.delete(token);
    }
  }
}, 10 * 60 * 1000);

function createRunSession({ userId = 'guest', mode = 'endless', levelId = null }) {
  const token = 'run_' + crypto.randomBytes(16).toString('hex');
  const seed = Math.floor(Math.random() * 1000000);
  const startTime = Date.now();

  activeRuns.set(token, {
    token,
    userId,
    mode,
    levelId,
    seed,
    startTime,
    used: false
  });

  return { token, seed, startTime };
}

function validateScoreSubmission({
  runToken,
  score,
  distance,
  coins,
  flaps = 0,
  obstaclesPassed = 0,
  perfectPasses = 0,
  durationMs = 0
}) {
  // If run token provided, check session
  if (runToken && activeRuns.has(runToken)) {
    const run = activeRuns.get(runToken);
    if (run.used) {
      return { valid: false, reason: 'Run session token already consumed' };
    }
    run.used = true;

    const elapsedMs = Math.max(Date.now() - run.startTime, durationMs);
    // Allow margin for speed boosts (cannot exceed physical sonic boost velocity)
    const minPossibleMs = Math.max(800, distance * 1.5);
    if (elapsedMs < minPossibleMs && score > 200) {
      return { valid: false, reason: 'Speed anomaly: distance completed impossibly fast' };
    }
  }

  // Physical feasibility bounds
  // Score cannot massively exceed distance + coins*15 + perfectPasses*50
  const maxFeasibleScore = (distance * 3) + (coins * 50) + (perfectPasses * 150) + 1000;
  if (score > maxFeasibleScore && score > 100) {
    return { valid: false, reason: `Score ${score} exceeds physical game mechanics limit ${maxFeasibleScore}` };
  }

  // Coin rate check: cannot collect more coins than distance / 10
  if (coins > Math.max(15, distance / 5)) {
    return { valid: false, reason: 'Coin density exceeds procedural generation capacity' };
  }

  // Flap count feasibility: cannot complete run without flaps unless score is 0
  if (score > 100 && flaps < 1) {
    return { valid: false, reason: 'Flight physics anomaly: zero aerodynamic flaps recorded' };
  }

  return { valid: true };
}

module.exports = {
  createRunSession,
  validateScoreSubmission
};
