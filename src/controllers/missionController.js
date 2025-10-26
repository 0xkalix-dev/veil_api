const Mission = require('../models/Mission');
const MissionParticipation = require('../models/MissionParticipation');
const User = require('../models/User');
const twitterVerificationService = require('../services/twitterVerificationService');

// Create a new mission (admin only)
exports.createMission = async (req, res) => {
  try {
    const missionData = {
      ...req.body,
      createdBy: req.user._id
    };

    const mission = new Mission(missionData);
    await mission.save();

    res.status(201).json({
      success: true,
      data: mission
    });
  } catch (error) {
    console.error('Create mission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create mission'
    });
  }
};

// Get all missions with filters
exports.getMissions = async (req, res) => {
  try {
    const {
      type,
      difficulty,
      status = 'ACTIVE',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;
    if (status) query.status = status;

    // Filter out expired missions
    query.endDate = { $gt: new Date() };

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [missions, total] = await Promise.all([
      Mission.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-createdBy -__v'),
      Mission.countDocuments(query)
    ]);

    // Add user participation status to each mission if user is authenticated
    let missionsWithStatus = missions;
    if (req.user) {
      const user = await User.findOne({ walletAddress: req.user.walletAddress });
      if (user) {
        // Get all participations for this user for these missions
        const missionIds = missions.map(m => m._id);
        const participations = await MissionParticipation.find({
          user: user._id,
          mission: { $in: missionIds }
        });

        // Create a map of mission ID to participation
        const participationMap = {};
        participations.forEach(p => {
          participationMap[p.mission.toString()] = p;
        });

        // Add participation status to each mission
        missionsWithStatus = missions.map(mission => {
          const missionObj = mission.toObject();
          const participation = participationMap[mission._id.toString()];
          missionObj.userParticipation = participation ? {
            status: participation.status,
            progress: participation.progress
          } : null;
          return missionObj;
        });
      }
    }

    res.json({
      success: true,
      data: {
        missions: missionsWithStatus,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get missions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get missions'
    });
  }
};

// Get mission by ID
exports.getMissionById = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);

    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }

    // Check if user has participated
    let participation = null;
    if (req.user) {
      const user = await User.findOne({ walletAddress: req.user.walletAddress });
      if (user) {
        participation = await MissionParticipation.findOne({
          user: user._id,
          mission: mission._id
        });
      }
    }

    res.json({
      success: true,
      data: {
        mission,
        participation
      }
    });
  } catch (error) {
    console.error('Get mission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mission'
    });
  }
};

// Update mission (admin only)
exports.updateMission = async (req, res) => {
  try {
    const mission = await Mission.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }

    res.json({
      success: true,
      data: mission
    });
  } catch (error) {
    console.error('Update mission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update mission'
    });
  }
};

// Delete mission (admin only)
exports.deleteMission = async (req, res) => {
  try {
    const mission = await Mission.findByIdAndDelete(req.params.id);

    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }

    // Optionally delete all participations
    await MissionParticipation.deleteMany({ mission: mission._id });

    res.json({
      success: true,
      message: 'Mission deleted successfully'
    });
  } catch (error) {
    console.error('Delete mission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete mission'
    });
  }
};

// Start mission (user)
exports.startMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);

    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }

    // Check if mission is active
    if (mission.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Mission is not active'
      });
    }

    // Check if expired
    if (new Date() > mission.endDate) {
      return res.status(400).json({
        success: false,
        error: 'Mission has expired'
      });
    }

    // Check if max participants reached
    if (mission.participants >= mission.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Mission is full'
      });
    }

    const user = await User.findOne({ walletAddress: req.user.walletAddress });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already participating
    const existing = await MissionParticipation.findOne({
      user: user._id,
      mission: mission._id
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Already participating in this mission',
        data: existing
      });
    }

    // Create participation
    const participation = new MissionParticipation({
      user: user._id,
      mission: mission._id,
      status: 'IN_PROGRESS'
    });

    await participation.save();

    // Note: participants count is updated only when mission is COMPLETED (in submitMission)

    res.json({
      success: true,
      data: participation
    });
  } catch (error) {
    console.error('Start mission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start mission'
    });
  }
};

// Record follow attempt (when user clicks Follow button)
// This is where SNS mission participation is FIRST CREATED (user actually starts the mission)
exports.recordFollowAttempt = async (req, res) => {
  try {
    const user = await User.findOne({ walletAddress: req.user.walletAddress });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find or create participation
    let participation = await MissionParticipation.findOne({
      user: user._id,
      mission: req.params.id
    });

    if (!participation) {
      // 🎯 Create new participation - this is when user ACTUALLY starts SNS mission
      // (Not when modal opens, but when they click Follow button)
      participation = new MissionParticipation({
        user: user._id,
        mission: req.params.id,
        status: 'IN_PROGRESS',
        proof: {
          type: 'URL',
          value: req.body.targetUrl || '',
          metadata: {
            attemptedFollow: true,
            attemptedAt: new Date()
          }
        }
      });

      // Note: participants count is updated only when mission is COMPLETED (in submitMission)
    } else {
      // Update existing participation
      if (!participation.proof) {
        participation.proof = { metadata: {} };
      }
      if (!participation.proof.metadata) {
        participation.proof.metadata = {};
      }
      participation.proof.metadata.attemptedFollow = true;
      participation.proof.metadata.attemptedAt = new Date();
    }

    await participation.save();

    res.json({
      success: true,
      data: participation
    });
  } catch (error) {
    console.error('Record follow attempt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record follow attempt'
    });
  }
};

// Get mission participation status
exports.getMissionParticipation = async (req, res) => {
  try {
    const user = await User.findOne({ walletAddress: req.user.walletAddress });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const participation = await MissionParticipation.findOne({
      user: user._id,
      mission: req.params.id
    });

    res.json({
      success: true,
      data: participation
    });
  } catch (error) {
    console.error('Get participation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get participation'
    });
  }
};

// Submit mission completion
exports.submitMission = async (req, res) => {
  try {
    const { proof } = req.body;
    const user = await User.findOne({ walletAddress: req.user.walletAddress });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const participation = await MissionParticipation.findOne({
      user: user._id,
      mission: req.params.id,
      status: { $in: ['IN_PROGRESS', 'PENDING_VERIFICATION'] }
    });

    if (!participation) {
      return res.status(404).json({
        success: false,
        error: 'Mission participation not found or already completed'
      });
    }

    const mission = await Mission.findById(req.params.id);

    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }

    // Handle different mission types
    if (mission.type === 'QUIZ') {
      // Quiz submission handled separately
      return res.status(400).json({
        success: false,
        error: 'Use /submit-quiz endpoint for quiz missions'
      });
    }

    // Update participation with proof
    participation.proof = proof;
    participation.progress = 100;

    // Handle SNS missions with Twitter follow verification
    if (mission.type === 'SNS' && mission.snsConfig?.actionType === 'FOLLOW') {
      // Get user's Twitter username from connected accounts
      const twitterAccount = user.connectedAccounts?.twitter;

      if (!twitterAccount || !twitterAccount.username) {
        return res.status(400).json({
          success: false,
          error: 'Twitter account not connected. Please connect your Twitter account first.'
        });
      }

      const userTwitterHandle = twitterAccount.username;
      const targetTwitterHandle = mission.snsConfig.targetUsername;

      if (!targetTwitterHandle) {
        return res.status(500).json({
          success: false,
          error: 'Mission configuration error: target username not set'
        });
      }

      // Verify follow relationship using TwitterAPI.io
      console.log(`🔍 Verifying Twitter follow: ${userTwitterHandle} -> ${targetTwitterHandle}`);
      const verificationResult = await twitterVerificationService.verifyTwitterMission(
        userTwitterHandle,
        mission.snsConfig
      );

      if (!verificationResult.success) {
        // Reset attemptedFollow flag so user can try again
        if (participation.proof && participation.proof.metadata) {
          participation.proof.metadata.attemptedFollow = false;
          participation.proof.metadata.verificationFailed = true;
          participation.proof.metadata.lastVerificationAttempt = new Date();
          await participation.save();
        }

        return res.status(400).json({
          success: false,
          error: verificationResult.message || 'Failed to verify follow relationship',
          data: {
            canRetry: true,
            participation
          }
        });
      }

      // Follow verified! Auto-complete mission
      participation.status = 'COMPLETED';
      participation.verifiedAt = Date.now();
      participation.verifiedBy = 'AUTO_TWITTER_API';

      // Increment mission participants count (completed missions only)
      mission.participants += 1;
      await mission.save();

      // Update streak on mission completion
      const streakUpdated = user.updateStreak();
      if (streakUpdated) {
        await user.save();
        console.log(`🔥 Streak updated for user ${user.walletAddress}: ${user.streak.currentStreak} days`);
      }

      console.log(`✅ Twitter follow verified and mission completed for user ${user.walletAddress}`);
    }
    // Auto-complete other SNS missions if OAuth verified
    else if (mission.type === 'SNS' && proof.metadata?.oauthVerified) {
      participation.status = 'COMPLETED';
      participation.verifiedAt = Date.now();
      participation.verifiedBy = 'AUTO_OAUTH';

      // Increment mission participants count (completed missions only)
      mission.participants += 1;
      await mission.save();

      // Update streak on mission completion
      const streakUpdated = user.updateStreak();
      if (streakUpdated) {
        await user.save();
        console.log(`🔥 Streak updated for user ${user.walletAddress}: ${user.streak.currentStreak} days`);
      }

      console.log(`✅ SNS mission auto-completed for user ${user.walletAddress} (OAuth verified)`);
    } else {
      participation.status = 'PENDING_VERIFICATION';
    }

    await participation.save();

    res.json({
      success: true,
      data: participation
    });
  } catch (error) {
    console.error('Submit mission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit mission'
    });
  }
};

// Submit quiz answers
exports.submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;
    const user = await User.findOne({ walletAddress: req.user.walletAddress });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find participation - allow retries for IN_PROGRESS or FAILED status
    const participation = await MissionParticipation.findOne({
      user: user._id,
      mission: req.params.id,
      status: { $in: ['IN_PROGRESS', 'FAILED'] }
    });

    if (!participation) {
      return res.status(404).json({
        success: false,
        error: 'Mission participation not found'
      });
    }

    const mission = await Mission.findById(req.params.id);

    if (!mission || mission.type !== 'QUIZ') {
      return res.status(400).json({
        success: false,
        error: 'Not a quiz mission'
      });
    }

    // Check attempt limit (max 3 attempts)
    if (participation.quizAttemptCount >= 3) {
      return res.status(400).json({
        success: false,
        error: 'Maximum attempt limit reached (3 attempts)',
        data: {
          attemptsUsed: participation.quizAttemptCount,
          attemptsRemaining: 0
        }
      });
    }

    // Calculate score and track per-question results
    let correctAnswers = 0;
    const questions = mission.quizConfig.questions;
    const questionResults = [];

    answers.forEach((answer, index) => {
      const question = questions[index];
      const isCorrect = question && answer.selectedAnswer === question.correctAnswer;

      if (isCorrect) {
        correctAnswers++;
      }

      // Store result for each question
      questionResults.push({
        questionIndex: index,
        userAnswer: answer.selectedAnswer,
        correctAnswer: question ? question.correctAnswer : null,
        isCorrect
      });
    });

    const score = (correctAnswers / questions.length) * 100;
    const passed = score >= mission.quizConfig.passingScore;

    // Increment attempt count
    participation.quizAttemptCount += 1;

    // Update participation
    participation.quizAttempt = {
      answers,
      score,
      passed
    };

    if (passed) {
      // Perfect score - mission completed
      participation.status = 'COMPLETED';
      participation.progress = 100;
      participation.verifiedAt = Date.now();
      participation.verifiedBy = 'AUTO';

      // Increment mission participants count (completed missions only)
      mission.participants += 1;
      await mission.save();

      // Update streak on quiz completion
      const streakUpdated = user.updateStreak();
      if (streakUpdated) {
        await user.save();
        console.log(`🔥 Streak updated for user ${user.walletAddress}: ${user.streak.currentStreak} days`);
      }
    } else {
      // Failed this attempt
      if (participation.quizAttemptCount >= 3) {
        // Last attempt used - permanent failure
        participation.status = 'FAILED';
        participation.progress = 100;
      } else {
        // Still has attempts remaining - keep IN_PROGRESS
        participation.status = 'IN_PROGRESS';
        participation.progress = 50;
      }
    }

    await participation.save();

    const attemptsRemaining = 3 - participation.quizAttemptCount;

    res.json({
      success: true,
      data: {
        score,
        passed,
        correctAnswers,
        totalQuestions: questions.length,
        questionResults,
        attemptsUsed: participation.quizAttemptCount,
        attemptsRemaining,
        canRetry: !passed && attemptsRemaining > 0,
        participation
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit quiz'
    });
  }
};

// Claim rewards
exports.claimRewards = async (req, res) => {
  try {
    const user = await User.findOne({ walletAddress: req.user.walletAddress });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const participation = await MissionParticipation.findOne({
      user: user._id,
      mission: req.params.id,
      status: 'COMPLETED',
      rewardClaimed: false
    }).populate('mission');

    if (!participation) {
      return res.status(404).json({
        success: false,
        error: 'No unclaimed rewards for this mission'
      });
    }

    // Update user points
    const mission = participation.mission;
    user.points += mission.reward.points;
    await user.save();

    // Mark reward as claimed
    participation.rewardClaimed = true;
    participation.rewardClaimedAt = Date.now();
    await participation.save();

    res.json({
      success: true,
      data: {
        rewards: mission.reward,
        newBalance: user.points
      }
    });
  } catch (error) {
    console.error('Claim rewards error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim rewards'
    });
  }
};

// Get user's mission history
exports.getMyMissions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const user = await User.findOne({ walletAddress: req.user.walletAddress });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const query = { user: user._id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [participations, total] = await Promise.all([
      MissionParticipation.find(query)
        .populate('mission')
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      MissionParticipation.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        participations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my missions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mission history'
    });
  }
};

// Get mission stats
exports.getMissionStats = async (req, res) => {
  try {
    const [totalMissions, activeMissions, totalParticipations] = await Promise.all([
      Mission.countDocuments(),
      Mission.countDocuments({ status: 'ACTIVE', endDate: { $gt: new Date() } }),
      MissionParticipation.countDocuments()
    ]);

    const missionsByType = await Mission.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const missionsByDifficulty = await Mission.aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalMissions,
        activeMissions,
        totalParticipations,
        byType: missionsByType,
        byDifficulty: missionsByDifficulty
      }
    });
  } catch (error) {
    console.error('Get mission stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mission stats'
    });
  }
};
