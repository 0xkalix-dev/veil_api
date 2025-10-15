const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['SNS', 'ONCHAIN', 'QUIZ'],
    required: true,
    index: true
  },
  platform: {
    type: String,
    enum: ['X', 'YouTube', 'Discord', 'Instagram', 'TikTok', null],
    default: null
  },
  difficulty: {
    type: String,
    enum: ['EASY', 'MEDIUM', 'HARD'],
    required: true
  },
  reward: {
    tokens: {
      type: Number,
      required: true,
      min: 0
    },
    points: {
      type: Number,
      required: true,
      min: 0
    },
    symbol: {
      type: String,
      default: 'VEIL'
    }
  },
  maxParticipants: {
    type: Number,
    default: 10000
  },
  participants: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'EXPIRED'],
    default: 'DRAFT',
    index: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  // SNS specific fields
  snsConfig: {
    actionType: {
      type: String,
      enum: ['FOLLOW', 'LIKE', 'REPOST', 'COMMENT', 'SUBSCRIBE', null],
      default: null
    },
    targetUrl: {
      type: String,
      default: null
    },
    targetUsername: {
      type: String,
      default: null
    }
  },
  // ONCHAIN specific fields
  onchainConfig: {
    chain: {
      type: String,
      enum: ['BSC', 'ETHEREUM', 'SOLANA', 'POLYGON', null],
      default: null
    },
    actionType: {
      type: String,
      enum: ['STAKE', 'SWAP', 'MINT', 'TRANSFER', 'PROVIDE_LIQUIDITY', null],
      default: null
    },
    contractAddress: {
      type: String,
      default: null
    },
    minAmount: {
      type: Number,
      default: null
    },
    tokenSymbol: {
      type: String,
      default: null
    }
  },
  // QUIZ specific fields
  quizConfig: {
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      points: Number
    }],
    passingScore: {
      type: Number,
      default: 70
    }
  },
  // Anti-cheat settings
  antiCheat: {
    minAccountAge: {
      type: Number,
      default: 0 // days
    },
    requireVerification: {
      type: Boolean,
      default: false
    },
    cooldownPeriod: {
      type: Number,
      default: 0 // hours
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
missionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate time remaining
missionSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diff = end - now;

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return `${days}d ${hours}h`;
});

// Calculate completion percentage
missionSchema.virtual('completionPercentage').get(function() {
  return (this.participants / this.maxParticipants * 100).toFixed(1);
});

// Enable virtuals in JSON
missionSchema.set('toJSON', { virtuals: true });
missionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Mission', missionSchema);
