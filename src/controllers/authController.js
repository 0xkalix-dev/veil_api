const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../utils/jwt');

// Login or register with wallet address
exports.login = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    // Find or create user
    let user = await User.findOne({ walletAddress });

    if (!user) {
      // Auto-register new user
      user = new User({ walletAddress });
      await user.save();
      console.log(`✨ New user registered: ${walletAddress}`);
    } else {
      // Update last login time
      user.lastLoginAt = Date.now();
    }

    // Generate tokens
    const accessToken = generateAccessToken(walletAddress);
    const refreshToken = generateRefreshToken(walletAddress);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        walletAddress: user.walletAddress,
        isNewUser: !user.createdAt || Date.now() - user.createdAt < 1000
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    // Clear refresh token
    await User.findOneAndUpdate(
      { walletAddress },
      { refreshToken: null }
    );

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

// Refresh access token
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user and validate stored refresh token
    const user = await User.findOne({
      walletAddress: decoded.walletAddress,
      refreshToken: refreshToken
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user.walletAddress);

    res.json({
      success: true,
      data: {
        accessToken,
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Token refresh failed'
    });
  }
};

// Get current user info (protected route example)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findOne({ walletAddress: req.user.walletAddress })
      .select('-refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
};
