const User = require('../models/User');
const axios = require('axios');

// OAuth 설정
const OAUTH_CONFIG = {
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    redirectUri: process.env.DISCORD_REDIRECT_URI || `${process.env.API_URL}/api/oauth/discord/callback`,
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userUrl: 'https://discord.com/api/users/@me',
    scope: 'identify email'
  },
  youtube: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.API_URL}/api/oauth/youtube/callback`,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userUrl: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    scope: 'https://www.googleapis.com/auth/youtube.readonly'
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    redirectUri: process.env.TWITTER_REDIRECT_URI || `${process.env.API_URL}/api/oauth/twitter/callback`,
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userUrl: 'https://api.twitter.com/2/users/me',
    scope: 'users.read tweet.read'
  }
};

// OAuth 시작 - 인증 URL 생성
exports.startOAuth = async (req, res) => {
  try {
    const { provider } = req.params;
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    const config = OAUTH_CONFIG[provider];
    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OAuth provider'
      });
    }

    // state에 walletAddress 인코딩 (보안을 위해 실제로는 JWT나 암호화 사용 권장)
    const state = Buffer.from(JSON.stringify({ walletAddress, provider })).toString('base64');

    // OAuth URL 생성
    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.append('client_id', config.clientId);
    authUrl.searchParams.append('redirect_uri', config.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', config.scope);
    authUrl.searchParams.append('state', state);

    res.json({
      success: true,
      data: {
        authUrl: authUrl.toString()
      }
    });
  } catch (error) {
    console.error('OAuth start error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start OAuth flow'
    });
  }
};

// OAuth 콜백 처리
exports.handleCallback = async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/dapp/mypage?oauth=error&message=missing_params`);
    }

    // state 디코딩
    const { walletAddress } = JSON.parse(Buffer.from(state, 'base64').toString());

    const config = OAUTH_CONFIG[provider];
    if (!config) {
      return res.redirect(`${process.env.FRONTEND_URL}/dapp/mypage?oauth=error&message=invalid_provider`);
    }

    // Access token 교환
    const tokenResponse = await axios.post(config.tokenUrl, {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token } = tokenResponse.data;

    // 사용자 정보 가져오기
    let userData;
    if (provider === 'discord') {
      const userResponse = await axios.get(config.userUrl, {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });
      userData = {
        id: userResponse.data.id,
        username: `${userResponse.data.username}#${userResponse.data.discriminator}`,
        avatar: userResponse.data.avatar
          ? `https://cdn.discordapp.com/avatars/${userResponse.data.id}/${userResponse.data.avatar}.png`
          : null
      };
    } else if (provider === 'youtube') {
      const userResponse = await axios.get(config.userUrl, {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });
      const channel = userResponse.data.items[0];
      userData = {
        id: channel.id,
        channelName: channel.snippet.title,
        avatar: channel.snippet.thumbnails?.default?.url || null
      };
    } else if (provider === 'twitter') {
      const userResponse = await axios.get(config.userUrl, {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });
      userData = {
        id: userResponse.data.data.id,
        username: userResponse.data.data.username,
        avatar: userResponse.data.data.profile_image_url || null
      };
    }

    // DB 업데이트
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/dapp/mypage?oauth=error&message=user_not_found`);
    }

    // 중복 체크: 같은 SNS ID가 다른 지갑에 연결되어 있는지 확인
    const duplicateQuery = {};
    duplicateQuery[`connectedAccounts.${provider}.id`] = userData.id;

    const existingUser = await User.findOne(duplicateQuery);
    if (existingUser && existingUser.walletAddress !== walletAddress) {
      return res.redirect(`${process.env.FRONTEND_URL}/dapp/mypage?oauth=error&message=account_already_connected`);
    }

    // connectedAccounts 업데이트
    if (provider === 'youtube') {
      user.connectedAccounts.youtube = {
        id: userData.id,
        channelName: userData.channelName,
        avatar: userData.avatar,
        connectedAt: new Date()
      };
    } else {
      user.connectedAccounts[provider] = {
        id: userData.id,
        username: userData.username,
        avatar: userData.avatar,
        connectedAt: new Date()
      };
    }

    await user.save();

    // 성공 리다이렉트
    res.redirect(`${process.env.FRONTEND_URL}/dapp/mypage?oauth=success&provider=${provider}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dapp/mypage?oauth=error&message=callback_failed`);
  }
};

// 계정 연결 해제
exports.disconnect = async (req, res) => {
  try {
    const { provider } = req.params;
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // connectedAccounts에서 해당 플랫폼 정보 제거
    if (user.connectedAccounts[provider]) {
      user.connectedAccounts[provider] = {
        id: null,
        username: provider === 'youtube' ? undefined : null,
        channelName: provider === 'youtube' ? null : undefined,
        avatar: null,
        connectedAt: null
      };
      await user.save();
    }

    res.json({
      success: true,
      message: `${provider} account disconnected successfully`
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect account'
    });
  }
};

// 연결된 계정 목록 조회
exports.getConnectedAccounts = async (req, res) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    const user = await User.findOne({ walletAddress }).select('connectedAccounts');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.connectedAccounts
    });
  } catch (error) {
    console.error('Get connected accounts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get connected accounts'
    });
  }
};
