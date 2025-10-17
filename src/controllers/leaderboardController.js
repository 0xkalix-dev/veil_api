const User = require('../models/User');
const MissionParticipation = require('../models/MissionParticipation');

// Get top users by points
exports.getPointsLeaderboard = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const leaderboard = await User.find()
      .select('walletAddress points tier createdAt')
      .sort({ points: -1 })
      .limit(parseInt(limit))
      .lean();

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      walletAddress: user.walletAddress,
      points: user.points,
      tier: user.tier,
      createdAt: user.createdAt
    }));

    res.json({
      success: true,
      data: {
        type: 'points',
        leaderboard: rankedLeaderboard,
        total: rankedLeaderboard.length
      }
    });
  } catch (error) {
    console.error('❌ Get points leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch points leaderboard'
    });
  }
};

// Get top users by referral count
exports.getReferralsLeaderboard = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const leaderboard = await User.find()
      .select('walletAddress referralCount referralPoints tier createdAt')
      .sort({ referralCount: -1 })
      .limit(parseInt(limit))
      .lean();

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      walletAddress: user.walletAddress,
      referralCount: user.referralCount,
      referralPoints: user.referralPoints,
      tier: user.tier,
      createdAt: user.createdAt
    }));

    res.json({
      success: true,
      data: {
        type: 'referrals',
        leaderboard: rankedLeaderboard,
        total: rankedLeaderboard.length
      }
    });
  } catch (error) {
    console.error('❌ Get referrals leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch referrals leaderboard'
    });
  }
};

// Get top users by completed missions
exports.getMissionsLeaderboard = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    // Aggregate completed missions count per user
    const missionCounts = await MissionParticipation.aggregate([
      {
        $match: {
          status: 'COMPLETED'
        }
      },
      {
        $group: {
          _id: '$user',
          completedMissions: { $sum: 1 }
        }
      },
      {
        $sort: { completedMissions: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          walletAddress: '$userInfo.walletAddress',
          completedMissions: 1,
          points: '$userInfo.points',
          tier: '$userInfo.tier',
          createdAt: '$userInfo.createdAt'
        }
      }
    ]);

    // Add rank to each user
    const rankedLeaderboard = missionCounts.map((user, index) => ({
      rank: index + 1,
      walletAddress: user.walletAddress,
      completedMissions: user.completedMissions,
      points: user.points,
      tier: user.tier,
      createdAt: user.createdAt
    }));

    res.json({
      success: true,
      data: {
        type: 'missions',
        leaderboard: rankedLeaderboard,
        total: rankedLeaderboard.length
      }
    });
  } catch (error) {
    console.error('❌ Get missions leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch missions leaderboard'
    });
  }
};

// Get user's rank in all leaderboards
exports.getUserRanks = async (req, res) => {
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

    // Get points rank
    const pointsRank = await User.countDocuments({
      points: { $gt: user.points }
    }) + 1;

    // Get referrals rank
    const referralsRank = await User.countDocuments({
      referralCount: { $gt: user.referralCount }
    }) + 1;

    // Get completed missions count
    const completedMissions = await MissionParticipation.countDocuments({
      user: user._id,
      status: 'COMPLETED'
    });

    // Get missions rank
    const usersWithMoreMissions = await MissionParticipation.aggregate([
      {
        $match: {
          status: 'COMPLETED'
        }
      },
      {
        $group: {
          _id: '$user',
          completedMissions: { $sum: 1 }
        }
      },
      {
        $match: {
          completedMissions: { $gt: completedMissions }
        }
      },
      {
        $count: 'count'
      }
    ]);

    const missionsRank = usersWithMoreMissions.length > 0
      ? usersWithMoreMissions[0].count + 1
      : 1;

    res.json({
      success: true,
      data: {
        walletAddress: user.walletAddress,
        ranks: {
          points: {
            rank: pointsRank,
            value: user.points
          },
          referrals: {
            rank: referralsRank,
            value: user.referralCount
          },
          missions: {
            rank: missionsRank,
            value: completedMissions
          }
        },
        tier: user.tier
      }
    });
  } catch (error) {
    console.error('❌ Get user ranks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user ranks'
    });
  }
};
