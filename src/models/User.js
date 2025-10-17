const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  refreshToken: {
    type: String,
    default: null
  },
  referralCode: {
    type: String,
    unique: true,
    index: true
  },
  referredBy: {
    type: String,
    default: null,
    index: true
  },
  referralCount: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  referralPoints: {
    type: Number,
    default: 0
  },
  tier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Diamond'],
    default: 'Bronze'
  },
  claimableTokens: {
    type: Number,
    default: 0
  },
  claimedTokens: {
    type: Number,
    default: 0
  },
  streak: {
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastActiveDate: {
      type: Date,
      default: null
    }
  },
  vesting: {
    lockedTokens: {
      type: Number,
      default: 0
    },
    vestingSchedule: [{
      amount: Number,
      unlockDate: Date,
      claimed: {
        type: Boolean,
        default: false
      }
    }]
  },
  connectedAccounts: {
    discord: {
      id: { type: String, default: null },
      username: { type: String, default: null },
      avatar: { type: String, default: null },
      connectedAt: { type: Date, default: null }
    },
    youtube: {
      id: { type: String, default: null },
      channelName: { type: String, default: null },
      avatar: { type: String, default: null },
      connectedAt: { type: Date, default: null }
    },
    twitter: {
      id: { type: String, default: null },
      username: { type: String, default: null },
      avatar: { type: String, default: null },
      connectedAt: { type: Date, default: null }
    },
    instagram: {
      id: { type: String, default: null },
      username: { type: String, default: null },
      avatar: { type: String, default: null },
      connectedAt: { type: Date, default: null }
    },
    tiktok: {
      id: { type: String, default: null },
      username: { type: String, default: null },
      avatar: { type: String, default: null },
      connectedAt: { type: Date, default: null }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique referral code
userSchema.methods.generateReferralCode = function() {
  const hash = crypto.createHash('sha256')
    .update(this.walletAddress + Date.now())
    .digest('hex');
  return hash.substring(0, 8).toUpperCase();
};

// Update lastLoginAt before saving
userSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate referral code for new users
    if (!this.referralCode) {
      let code = this.generateReferralCode();
      let attempts = 0;

      // Ensure uniqueness
      while (attempts < 5) {
        const existing = await mongoose.model('User').findOne({ referralCode: code });
        if (!existing) {
          this.referralCode = code;
          break;
        }
        code = this.generateReferralCode();
        attempts++;
      }
    }
    this.lastLoginAt = Date.now();
  } else if (this.isModified('refreshToken')) {
    this.lastLoginAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
