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

// Update streak on mission completion
userSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day for comparison

  const lastActive = this.streak?.lastActiveDate ? new Date(this.streak.lastActiveDate) : null;

  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day - no streak update
      return false;
    } else if (daysDiff === 1) {
      // Consecutive day - increment streak
      this.streak.currentStreak += 1;
      this.streak.lastActiveDate = new Date();

      // Update longest streak if needed
      if (this.streak.currentStreak > this.streak.longestStreak) {
        this.streak.longestStreak = this.streak.currentStreak;
      }
      return true;
    } else {
      // Missed days - reset streak to 1
      this.streak.currentStreak = 1;
      this.streak.lastActiveDate = new Date();
      return true;
    }
  } else {
    // First time - initialize streak
    this.streak = {
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: new Date()
    };
    return true;
  }
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
