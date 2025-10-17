const express = require('express');
const router = express.Router();
const rewardsController = require('../controllers/rewardsController');
const authMiddleware = require('../middleware/auth');

// All rewards routes require authentication
router.get('/stats', authMiddleware, rewardsController.getRewardsStats);
router.post('/claim', authMiddleware, rewardsController.claimRewards);
router.post('/claim-vested', authMiddleware, rewardsController.claimVested);

module.exports = router;
