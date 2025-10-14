const User = require('../models/User');
const { calculateTier } = require('../utils/tierUtil');

// Get referral stats
exports.getReferralStats = async (req, res) => {
  try {
    const user = await User.findOne({ walletAddress: req.user.walletAddress });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get active referrals (users who logged in within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeReferrals = await User.countDocuments({
      referredBy: user.referralCode,
      lastLoginAt: { $gte: thirtyDaysAgo }
    });

    // Get tier from user model (already calculated and stored)
    const tier = user.tier;

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        invitedCount: user.referralCount,
        activeCount: activeReferrals,
        pointsEarned: user.points,
        tier: tier
      }
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get referral stats'
    });
  }
};

// Apply referral code
exports.applyReferralCode = async (req, res) => {
  try {
    const { referralCode } = req.body;
    const user = await User.findOne({ walletAddress: req.user.walletAddress });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user already has a referrer
    if (user.referredBy) {
      return res.status(400).json({
        success: false,
        error: 'You have already applied a referral code'
      });
    }

    // Check if trying to use own code
    if (user.referralCode === referralCode) {
      return res.status(400).json({
        success: false,
        error: 'Cannot use your own referral code'
      });
    }

    // Find referrer
    const referrer = await User.findOne({ referralCode });

    if (!referrer) {
      return res.status(404).json({
        success: false,
        error: 'Invalid referral code'
      });
    }

    // Apply referral
    user.referredBy = referralCode;
    user.points += 50; // Bonus points for being invited
    await user.save();

    // Update referrer
    referrer.referralCount += 1;
    referrer.points += 100; // Bonus points for inviting

    // Calculate and update tier based on referral count
    referrer.tier = calculateTier(referrer.referralCount);
    await referrer.save();

    res.json({
      success: true,
      data: {
        message: 'Referral code applied successfully',
        bonusPoints: 50,
        referredBy: referrer.walletAddress.substring(0, 6) + '...' + referrer.walletAddress.substring(38)
      }
    });
  } catch (error) {
    console.error('Apply referral code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply referral code'
    });
  }
};

// Get my referrals list
exports.getMyReferrals = async (req, res) => {
  try {
    const user = await User.findOne({ walletAddress: req.user.walletAddress });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get all users referred by this user
    const referrals = await User.find({ referredBy: user.referralCode })
      .select('walletAddress points createdAt lastLoginAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: referrals.map(ref => ({
        walletAddress: ref.walletAddress.substring(0, 6) + '...' + ref.walletAddress.substring(38),
        points: ref.points,
        joinedAt: ref.createdAt,
        lastActive: ref.lastLoginAt
      }))
    });
  } catch (error) {
    console.error('Get my referrals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get referrals'
    });
  }
};
