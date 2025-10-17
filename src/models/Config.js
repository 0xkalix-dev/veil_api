const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ['global'] // Only one global config document
  },
  twitterLink: {
    type: String,
    default: ''
  },
  contractAddress: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Config', configSchema);
