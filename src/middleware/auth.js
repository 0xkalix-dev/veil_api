const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyAccessToken(token);

    // Find user
    const user = await User.findOne({ walletAddress: decoded.walletAddress });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Attach user info to request
    req.user = {
      walletAddress: user.walletAddress,
      userId: user._id
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message || 'Invalid token'
    });
  }
};

module.exports = authMiddleware;
