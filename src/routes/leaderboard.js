const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const authMiddleware = require('../middleware/auth');

// Public leaderboard endpoints
router.get('/points', leaderboardController.getPointsLeaderboard);
router.get('/referrals', leaderboardController.getReferralsLeaderboard);
router.get('/missions', leaderboardController.getMissionsLeaderboard);

// User-specific rank (requires auth)
router.get('/my-ranks', authMiddleware, leaderboardController.getUserRanks);

module.exports = router;
