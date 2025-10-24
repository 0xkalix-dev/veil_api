/**
 * Twitter Verification Service
 * Uses TwitterAPI.io to verify user actions (follow, like, retweet, etc.)
 */

const TWITTER_API_BASE_URL = 'https://api.twitterapi.io';
const TWITTER_API_KEY = process.env.TWITTERAPI_IO_KEY;

/**
 * Verify if a user follows another user on Twitter
 * @param {string} sourceUsername - User's Twitter handle (without @)
 * @param {string} targetUsername - Target Twitter handle to check (without @)
 * @returns {Promise<{success: boolean, following: boolean, message?: string}>}
 */
async function verifyFollowRelationship(sourceUsername, targetUsername) {
  try {
    // Clean handles (remove @ if present)
    const cleanSource = sourceUsername.replace('@', '').trim();
    const cleanTarget = targetUsername.replace('@', '').trim();

    if (!cleanSource || !cleanTarget) {
      return {
        success: false,
        following: false,
        message: 'Invalid usernames provided',
      };
    }

    // Build API URL
    const url = new URL(`${TWITTER_API_BASE_URL}/twitter/user/check_follow_relationship`);
    url.searchParams.append('source_user_name', cleanSource);
    url.searchParams.append('target_user_name', cleanTarget);

    // Make request to TwitterAPI.io
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': TWITTER_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TwitterAPI.io error:', response.status, errorText);

      return {
        success: false,
        following: false,
        message: `Twitter API error: ${response.status}`,
      };
    }

    const data = await response.json();

    // Check if API call was successful
    if (data.status !== 'success') {
      return {
        success: false,
        following: false,
        message: data.message || 'Failed to verify follow relationship',
      };
    }

    // Return follow status
    return {
      success: true,
      following: data.data.following === true,
      followed_by: data.data.followed_by === true,
      message: data.data.following
        ? `@${cleanSource} follows @${cleanTarget}`
        : `@${cleanSource} does not follow @${cleanTarget}`,
    };
  } catch (error) {
    console.error('Error verifying follow relationship:', error);
    return {
      success: false,
      following: false,
      message: 'Failed to verify follow relationship: ' + error.message,
    };
  }
}

/**
 * Get user information by username
 * @param {string} username - Twitter username (without @)
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
async function getUserInfo(username) {
  try {
    const cleanHandle = username.replace('@', '').trim();
    const url = `${TWITTER_API_BASE_URL}/twitter/user?userName=${cleanHandle}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': TWITTER_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to get user info: ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.status === 'success') {
      return {
        success: true,
        data: data.data,
      };
    } else {
      return {
        success: false,
        message: data.message || 'User not found',
      };
    }
  } catch (error) {
    console.error('Error getting user info:', error);
    return {
      success: false,
      message: 'Failed to get user info: ' + error.message,
    };
  }
}

/**
 * Get remaining API credits
 * @returns {Promise<{success: boolean, credits?: number, usd?: number, message?: string}>}
 */
async function getAccountCredits() {
  try {
    const url = `${TWITTER_API_BASE_URL}/oapi/my/info`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': TWITTER_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to get account info: ${response.status}`,
      };
    }

    const data = await response.json();

    // 100,000 credits = $1 USD
    const usd = data.recharge_credits / 100000;

    return {
      success: true,
      credits: data.recharge_credits,
      usd: usd,
      message: `Remaining balance: ${data.recharge_credits} credits ($${usd.toFixed(2)} USD)`,
    };
  } catch (error) {
    console.error('Error getting account credits:', error);
    return {
      success: false,
      message: 'Failed to get account credits: ' + error.message,
    };
  }
}

/**
 * Verify Twitter mission based on action type
 * @param {string} userTwitterHandle - User's Twitter handle
 * @param {object} snsConfig - Mission SNS configuration
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function verifyTwitterMission(userTwitterHandle, snsConfig) {
  const { actionType, targetUsername } = snsConfig;

  switch (actionType) {
    case 'FOLLOW':
      if (!targetUsername) {
        return {
          success: false,
          message: 'Target username not configured',
        };
      }

      const result = await verifyFollowRelationship(userTwitterHandle, targetUsername);

      if (!result.success) {
        return {
          success: false,
          message: result.message || 'Failed to verify follow',
        };
      }

      if (!result.following) {
        return {
          success: false,
          message: `You must follow @${targetUsername} to complete this mission`,
        };
      }

      return {
        success: true,
        message: `Successfully verified! You are following @${targetUsername}`,
      };

    case 'LIKE':
    case 'REPOST':
    case 'COMMENT':
      // TODO: Implement these verification types
      return {
        success: false,
        message: `${actionType} verification is not yet implemented`,
      };

    default:
      return {
        success: false,
        message: 'Unknown action type',
      };
  }
}

module.exports = {
  verifyFollowRelationship,
  getUserInfo,
  getAccountCredits,
  verifyTwitterMission,
};
