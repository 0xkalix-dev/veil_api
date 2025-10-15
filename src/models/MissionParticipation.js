const mongoose = require('mongoose');

const missionParticipationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['IN_PROGRESS', 'PENDING_VERIFICATION', 'COMPLETED', 'FAILED', 'REJECTED'],
    default: 'IN_PROGRESS',
    index: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Proof of completion
  proof: {
    type: {
      type: String,
      enum: ['URL', 'TRANSACTION_HASH', 'SCREENSHOT', 'QUIZ_ANSWERS', null],
      default: null
    },
    value: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  // Quiz specific
  quizAttempt: {
    answers: [{
      questionIndex: Number,
      selectedAnswer: Number
    }],
    score: {
      type: Number,
      default: null
    },
    passed: {
      type: Boolean,
      default: null
    }
  },
  // Verification
  verifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: String, // 'AUTO' or admin ID
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  // Rewards
  rewardClaimed: {
    type: Boolean,
    default: false
  },
  rewardClaimedAt: {
    type: Date,
    default: null
  },
  startedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: {
    type: Date,
    default: null,
    index: true
  }
});

// Compound index for unique participation
missionParticipationSchema.index({ user: 1, mission: 1 }, { unique: true });

// Update completedAt when status changes to COMPLETED
missionParticipationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'COMPLETED' && !this.completedAt) {
    this.completedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('MissionParticipation', missionParticipationSchema);
