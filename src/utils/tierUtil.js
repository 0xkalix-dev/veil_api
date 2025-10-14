/**
 * Tier system utility for referral program
 * Defines tier ranges and bonus multipliers
 */

const TIER_RANGES = {
  Bronze: { min: 0, max: 9, bonus: 0.10 },
  Silver: { min: 10, max: 24, bonus: 0.15 },
  Gold: { min: 25, max: 49, bonus: 0.18 },
  Diamond: { min: 50, max: Infinity, bonus: 0.20 }
};

/**
 * Calculate tier based on referral count
 * @param {number} referralCount - Number of referrals
 * @returns {string} Tier name (Bronze, Silver, Gold, Diamond)
 */
function calculateTier(referralCount) {
  if (referralCount >= TIER_RANGES.Diamond.min) return 'Diamond';
  if (referralCount >= TIER_RANGES.Gold.min) return 'Gold';
  if (referralCount >= TIER_RANGES.Silver.min) return 'Silver';
  return 'Bronze';
}

/**
 * Get bonus multiplier for a tier
 * @param {string} tier - Tier name
 * @returns {number} Bonus multiplier (0.10 to 0.20)
 */
function getTierBonus(tier) {
  return TIER_RANGES[tier]?.bonus || 0;
}

/**
 * Get tier information
 * @param {string} tier - Tier name
 * @returns {object} Tier details with min, max, and bonus
 */
function getTierInfo(tier) {
  return TIER_RANGES[tier] || TIER_RANGES.Bronze;
}

/**
 * Get all tier ranges
 * @returns {object} All tier ranges
 */
function getAllTiers() {
  return TIER_RANGES;
}

module.exports = {
  calculateTier,
  getTierBonus,
  getTierInfo,
  getAllTiers,
  TIER_RANGES
};
