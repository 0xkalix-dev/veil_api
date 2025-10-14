const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const authMiddleware = require('../middleware/auth');

// All referral routes require authentication
router.use(authMiddleware);

// Get referral stats
router.get('/stats', referralController.getReferralStats);

// Apply referral code
router.post('/apply', referralController.applyReferralCode);

// Get my referrals list
router.get('/list', referralController.getMyReferrals);

module.exports = router;
