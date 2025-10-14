const mongoose = require('mongoose');

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
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
});

// Update lastLoginAt before saving
userSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('refreshToken')) {
    this.lastLoginAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
