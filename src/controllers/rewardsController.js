const User = require('../models/User');
const MissionParticipation = require('../models/MissionParticipation');

// Get user rewards statistics
exports.getRewardsStats = async (req, res) => {
  try {
    const { walletAddress } = req.user;

    // Get user
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get completed missions count
    const completedMissions = await MissionParticipation.countDocuments({
      user: user._id,
      status: 'COMPLETED'
    });

    // Get pending verification missions
    const pendingMissions = await MissionParticipation.find({
      user: user._id,
      status: 'PENDING_VERIFICATION'
    }).populate('mission');

    // Calculate estimated pending rewards
    const estimatedRewards = pendingMissions.reduce((total, participation) => {
      return total + (participation.mission?.reward || 0);
    }, 0);

    // Get mission success rate
    const totalAttempts = await MissionParticipation.countDocuments({
      user: user._id,
      status: { $in: ['COMPLETED', 'FAILED', 'REJECTED'] }
    });
    const successRate = totalAttempts > 0
      ? ((completedMissions / totalAttempts) * 100).toFixed(1)
      : 0;

    // Calculate average completion time
    const completedWithTime = await MissionParticipation.find({
      user: user._id,
      status: 'COMPLETED',
      startedAt: { $exists: true },
      completedAt: { $exists: true }
    });

    let avgCompletionHours = 0;
    if (completedWithTime.length > 0) {
      const totalHours = completedWithTime.reduce((total, m) => {
        const hours = (m.completedAt - m.startedAt) / (1000 * 60 * 60);
        return total + hours;
      }, 0);
      avgCompletionHours = (totalHours / completedWithTime.length).toFixed(1);
    }

    // Calculate next unlock for vesting
    let nextUnlock = null;
    let nextUnlockAmount = 0;
    if (user.vesting && user.vesting.vestingSchedule) {
      const upcomingUnlocks = user.vesting.vestingSchedule
        .filter(v => !v.claimed && new Date(v.unlockDate) > new Date())
        .sort((a, b) => new Date(a.unlockDate) - new Date(b.unlockDate));

      if (upcomingUnlocks.length > 0) {
        nextUnlock = upcomingUnlocks[0].unlockDate;
        nextUnlockAmount = upcomingUnlocks[0].amount;
      }
    }

    // Calculate time until next unlock
    let nextUnlockTime = null;
    if (nextUnlock) {
      const now = new Date();
      const unlock = new Date(nextUnlock);
      const diffMs = unlock - now;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      nextUnlockTime = `${diffDays}d ${diffHours}h`;
    }

    // Calculate streak bonus
    const streakBonus = user.streak?.currentStreak >= 7 ? 50 :
                       user.streak?.currentStreak >= 3 ? 20 : 0;

    // Calculate next referral tier
    const referralTiers = [
      { count: 10, bonus: 500 },
      { count: 25, bonus: 1500 },
      { count: 50, bonus: 3500 },
      { count: 100, bonus: 10000 }
    ];

    const nextTier = referralTiers.find(t => t.count > user.referralCount);
    const nextTierCount = nextTier ? nextTier.count : null;

    res.json({
      success: true,
      data: {
        // Claimable rewards
        claimable: {
          tokens: user.claimableTokens || 0,
          points: user.points || 0
        },

        // Pending verification
        pending: {
          tasksCount: pendingMissions.length,
          estimatedRewards: estimatedRewards
        },

        // Streak
        streak: {
          currentStreak: user.streak?.currentStreak || 0,
          longestStreak: user.streak?.longestStreak || 0,
          bonusPercentage: streakBonus,
          nextBonus: user.streak?.currentStreak >= 7 ? 100 : 50
        },

        // Referrals
        referrals: {
          totalInvited: user.referralCount || 0,
          bonusEarned: user.referralPoints || 0,
          nextTier: nextTierCount,
          currentTier: user.tier
        },

        // Vesting
        vesting: {
          lockedTokens: user.vesting?.lockedTokens || 0,
          nextUnlock: nextUnlockTime,
          nextUnlockAmount: nextUnlockAmount,
          totalVestingSchedules: user.vesting?.vestingSchedule?.length || 0
        },

        // Analytics
        analytics: {
          missionsCompleted: completedMissions,
          successRate: parseFloat(successRate),
          avgCompletionTime: avgCompletionHours + 'h',
          totalAttempts: totalAttempts
        }
      }
    });
  } catch (error) {
    console.error('❌ Get rewards stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rewards statistics'
    });
  }
};

// Claim rewards
exports.claimRewards = async (req, res) => {
  try {
    const { walletAddress } = req.user;

    // Get user
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if there are claimable rewards
    if (user.claimableTokens <= 0 && user.points <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No rewards available to claim'
      });
    }

    const claimedTokens = user.claimableTokens || 0;
    const claimedPoints = user.points || 0;

    // Update user - move claimable to claimed
    user.claimedTokens = (user.claimedTokens || 0) + claimedTokens;
    user.claimableTokens = 0;
    // Note: In real implementation, points might stay or be converted
    // For now, we'll keep them as they represent total earned points

    await user.save();

    console.log('✅ Rewards claimed:', {
      walletAddress,
      tokens: claimedTokens,
      points: claimedPoints
    });

    res.json({
      success: true,
      data: {
        message: 'Rewards claimed successfully',
        claimed: {
          tokens: claimedTokens,
          points: claimedPoints
        },
        newTotals: {
          claimedTokens: user.claimedTokens,
          claimableTokens: user.claimableTokens,
          points: user.points
        }
      }
    });
  } catch (error) {
    console.error('❌ Claim rewards error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim rewards'
    });
  }
};

// Claim vested tokens
exports.claimVested = async (req, res) => {
  try {
    const { walletAddress } = req.user;
    const { vestingId } = req.body;

    // Get user
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find vesting schedule
    if (!user.vesting || !user.vesting.vestingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'No vesting schedule found'
      });
    }

    const vestingSchedule = user.vesting.vestingSchedule.id(vestingId);
    if (!vestingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Vesting schedule not found'
      });
    }

    // Check if already claimed
    if (vestingSchedule.claimed) {
      return res.status(400).json({
        success: false,
        error: 'Vesting already claimed'
      });
    }

    // Check if unlock date has passed
    if (new Date() < new Date(vestingSchedule.unlockDate)) {
      return res.status(400).json({
        success: false,
        error: 'Tokens are still locked'
      });
    }

    // Claim vested tokens
    const amount = vestingSchedule.amount;
    vestingSchedule.claimed = true;
    user.vesting.lockedTokens -= amount;
    user.claimableTokens += amount;

    await user.save();

    console.log('✅ Vested tokens claimed:', {
      walletAddress,
      amount,
      vestingId
    });

    res.json({
      success: true,
      data: {
        message: 'Vested tokens unlocked',
        amount: amount,
        newBalance: {
          lockedTokens: user.vesting.lockedTokens,
          claimableTokens: user.claimableTokens
        }
      }
    });
  } catch (error) {
    console.error('❌ Claim vested error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim vested tokens'
    });
  }
};
