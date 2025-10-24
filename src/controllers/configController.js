const Config = require('../models/Config');

// Get global config
exports.getConfig = async (req, res) => {
  try {
    let config = await Config.findOne({ key: 'global' });

    // If no config exists, create default one
    if (!config) {
      config = await Config.create({
        key: 'global',
        twitterLink: '',
        contractAddress: '',
        buyLinkUrl: ''
      });
    }

    res.json({
      success: true,
      data: {
        twitterLink: config.twitterLink,
        contractAddress: config.contractAddress,
        buyLinkUrl: config.buyLinkUrl
      }
    });
  } catch (error) {
    console.error('❌ Get config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch config'
    });
  }
};

// Update global config (admin only - you can add auth middleware later)
exports.updateConfig = async (req, res) => {
  try {
    const { twitterLink, contractAddress, buyLinkUrl } = req.body;

    let config = await Config.findOne({ key: 'global' });

    if (!config) {
      config = await Config.create({
        key: 'global',
        twitterLink: twitterLink || '',
        contractAddress: contractAddress || '',
        buyLinkUrl: buyLinkUrl || ''
      });
    } else {
      if (twitterLink !== undefined) config.twitterLink = twitterLink;
      if (contractAddress !== undefined) config.contractAddress = contractAddress;
      if (buyLinkUrl !== undefined) config.buyLinkUrl = buyLinkUrl;
      await config.save();
    }

    console.log('✅ Config updated:', {
      twitterLink: config.twitterLink,
      contractAddress: config.contractAddress,
      buyLinkUrl: config.buyLinkUrl
    });

    res.json({
      success: true,
      data: {
        twitterLink: config.twitterLink,
        contractAddress: config.contractAddress,
        buyLinkUrl: config.buyLinkUrl
      }
    });
  } catch (error) {
    console.error('❌ Update config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update config'
    });
  }
};
