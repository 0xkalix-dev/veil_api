const User = require('../models/User');

/**
 * Add points to a user and give 10% bonus to their referrer if they have one
 * This is an internal service function, not exposed as an API endpoint
 *
 * @param {string} walletAddress - The wallet address of the user receiving points
 * @param {number} points - The amount of points to add
 * @returns {Promise<Object>} Result object with points added and referrer bonus info
 */
async function addPoints(walletAddress, points) {
  try {
    if (!points || points <= 0) {
      throw new Error('Invalid points amount');
    }

    const user = await User.findOne({ walletAddress });

    if (!user) {
      throw new Error('User not found');
    }

    // Add points to user
    user.points += points;
    await user.save();

    let referrerBonus = 0;
    let referrerWallet = null;

    // If user has a referrer, give them 10% bonus
    if (user.referredBy) {
      const referrer = await User.findOne({ referralCode: user.referredBy });

      if (referrer) {
        referrerBonus = Math.floor(points * 0.1);
        referrer.points += referrerBonus;
        referrer.referralPoints += referrerBonus;
        await referrer.save();

        referrerWallet = referrer.walletAddress;

        console.log(`✨ Referrer bonus: ${referrerBonus} points to ${referrer.walletAddress}`);
      }
    }

    return {
      success: true,
      pointsAdded: points,
      totalPoints: user.points,
      referrerBonus: referrerBonus > 0 ? {
        amount: referrerBonus,
        wallet: referrerWallet
      } : null
    };
  } catch (error) {
    console.error('Add points error:', error);
    throw error;
  }
}

module.exports = {
  addPoints
};
