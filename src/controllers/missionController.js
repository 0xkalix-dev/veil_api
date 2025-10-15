const Mission = require('../models/Mission');
const MissionParticipation = require('../models/MissionParticipation');
const User = require('../models/User');

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

    res.json({
      success: true,
      data: {
        missions,
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

    // Update mission participants count
    mission.participants += 1;
    await mission.save();

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
      status: 'IN_PROGRESS'
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
    participation.status = 'PENDING_VERIFICATION';
    participation.progress = 100;

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

    const participation = await MissionParticipation.findOne({
      user: user._id,
      mission: req.params.id,
      status: 'IN_PROGRESS'
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

    // Calculate score
    let correctAnswers = 0;
    const questions = mission.quizConfig.questions;

    answers.forEach((answer, index) => {
      if (questions[index] && answer.selectedAnswer === questions[index].correctAnswer) {
        correctAnswers++;
      }
    });

    const score = (correctAnswers / questions.length) * 100;
    const passed = score >= mission.quizConfig.passingScore;

    // Update participation
    participation.quizAttempt = {
      answers,
      score,
      passed
    };
    participation.status = passed ? 'COMPLETED' : 'FAILED';
    participation.progress = 100;

    if (passed) {
      participation.verifiedAt = Date.now();
      participation.verifiedBy = 'AUTO';
    }

    await participation.save();

    res.json({
      success: true,
      data: {
        score,
        passed,
        correctAnswers,
        totalQuestions: questions.length,
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
