const mongoose = require('mongoose');
const Mission = require('../models/Mission');
const User = require('../models/User');

const sampleMissions = [
  // SNS Missions
  {
    title: 'Follow @VeilProtocol',
    description: 'Follow our official X account and help spread the word about the corrupted reality',
    type: 'SNS',
    platform: 'X',
    difficulty: 'EASY',
    reward: {
      tokens: 50,
      points: 100,
      symbol: 'VEIL'
    },
    maxParticipants: 5000,
    participants: 1247,
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    snsConfig: {
      actionType: 'FOLLOW',
      targetUsername: 'VeilProtocol',
      targetUrl: 'https://x.com/VeilProtocol'
    },
    antiCheat: {
      minAccountAge: 7,
      requireVerification: true,
      cooldownPeriod: 0
    }
  },
  {
    title: 'Repost Glitch Art',
    description: 'Share our latest glitch art NFT collection with #VeilCorruption hashtag',
    type: 'SNS',
    platform: 'X',
    difficulty: 'EASY',
    reward: {
      tokens: 75,
      points: 150,
      symbol: 'VEIL'
    },
    maxParticipants: 2000,
    participants: 892,
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    snsConfig: {
      actionType: 'REPOST',
      targetUrl: 'https://x.com/VeilProtocol/status/123456'
    },
    antiCheat: {
      minAccountAge: 7,
      requireVerification: true,
      cooldownPeriod: 24
    }
  },
  {
    title: 'Join Discord Community',
    description: 'Join our Discord server and verify your account to access exclusive channels',
    type: 'SNS',
    platform: 'Discord',
    difficulty: 'EASY',
    reward: {
      tokens: 100,
      points: 200,
      symbol: 'VEIL'
    },
    maxParticipants: 10000,
    participants: 3456,
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    snsConfig: {
      actionType: 'FOLLOW',
      targetUrl: 'https://discord.gg/veilprotocol'
    }
  },
  {
    title: 'Like Our Latest Post',
    description: 'Like our pinned post on X announcing the new corrupted reality features',
    type: 'SNS',
    platform: 'X',
    difficulty: 'EASY',
    reward: {
      tokens: 25,
      points: 50,
      symbol: 'VEIL'
    },
    maxParticipants: 10000,
    participants: 5234,
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    snsConfig: {
      actionType: 'LIKE',
      targetUrl: 'https://x.com/VeilProtocol/status/789012'
    }
  },

  // ONCHAIN Missions
  {
    title: 'Stake SOL in Liquid Pool',
    description: 'Stake minimum 0.1 SOL in our liquid staking protocol for 7 days',
    type: 'ONCHAIN',
    difficulty: 'MEDIUM',
    reward: {
      tokens: 200,
      points: 500,
      symbol: 'VEIL'
    },
    maxParticipants: 1000,
    participants: 456,
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    onchainConfig: {
      chain: 'SOLANA',
      actionType: 'STAKE',
      contractAddress: 'VEiL1LiquidStakePoolxxxxxxxxxxxxxxxxxx',
      minAmount: 0.1,
      tokenSymbol: 'SOL'
    },
    antiCheat: {
      minAccountAge: 30,
      requireVerification: true,
      cooldownPeriod: 168 // 7 days
    }
  },
  {
    title: 'NFT Mint Mission',
    description: 'Mint a Corrupted Reality NFT from our exclusive collection',
    type: 'ONCHAIN',
    difficulty: 'HARD',
    reward: {
      tokens: 500,
      points: 1000,
      symbol: 'VEIL'
    },
    maxParticipants: 500,
    participants: 234,
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    onchainConfig: {
      chain: 'SOLANA',
      actionType: 'MINT',
      contractAddress: 'VEiLNFTCollection1xxxxxxxxxxxxxxxxxx',
      minAmount: 1,
      tokenSymbol: 'NFT'
    },
    antiCheat: {
      minAccountAge: 30,
      requireVerification: true,
      cooldownPeriod: 0
    }
  },
  {
    title: 'Swap Tokens on DEX',
    description: 'Perform a token swap of at least $10 worth on our partnered DEX',
    type: 'ONCHAIN',
    difficulty: 'MEDIUM',
    reward: {
      tokens: 150,
      points: 300,
      symbol: 'VEIL'
    },
    maxParticipants: 2000,
    participants: 987,
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    onchainConfig: {
      chain: 'BSC',
      actionType: 'SWAP',
      contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
      minAmount: 10,
      tokenSymbol: 'USDT'
    }
  },
  {
    title: 'Provide Liquidity',
    description: 'Add liquidity to the VEIL/USDC pool and earn trading fees',
    type: 'ONCHAIN',
    difficulty: 'HARD',
    reward: {
      tokens: 300,
      points: 750,
      symbol: 'VEIL'
    },
    maxParticipants: 500,
    participants: 123,
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    onchainConfig: {
      chain: 'BSC',
      actionType: 'PROVIDE_LIQUIDITY',
      contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      minAmount: 100,
      tokenSymbol: 'USDC'
    },
    antiCheat: {
      minAccountAge: 60,
      requireVerification: true,
      cooldownPeriod: 168
    }
  },

  // QUIZ Missions
  {
    title: 'Web3 Basics Quiz',
    description: 'Test your knowledge of blockchain and Web3 fundamentals',
    type: 'QUIZ',
    difficulty: 'EASY',
    reward: {
      tokens: 80,
      points: 160,
      symbol: 'VEIL'
    },
    maxParticipants: 10000,
    participants: 4567,
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    quizConfig: {
      questions: [
        {
          question: 'What is a smart contract?',
          options: [
            'A legal document',
            'Self-executing code on blockchain',
            'A cryptocurrency',
            'A wallet application'
          ],
          correctAnswer: 1,
          points: 10
        },
        {
          question: 'Which consensus mechanism does Bitcoin use?',
          options: [
            'Proof of Stake',
            'Proof of Work',
            'Delegated Proof of Stake',
            'Proof of Authority'
          ],
          correctAnswer: 1,
          points: 10
        },
        {
          question: 'What does DeFi stand for?',
          options: [
            'Digital Finance',
            'Decentralized Finance',
            'Distributed Finance',
            'Democratic Finance'
          ],
          correctAnswer: 1,
          points: 10
        },
        {
          question: 'What is a wallet in cryptocurrency?',
          options: [
            'A physical wallet',
            'A bank account',
            'A tool to store private keys',
            'A mining device'
          ],
          correctAnswer: 2,
          points: 10
        },
        {
          question: 'What is gas in Ethereum?',
          options: [
            'Fuel for cars',
            'Transaction fee',
            'A cryptocurrency',
            'A type of wallet'
          ],
          correctAnswer: 1,
          points: 10
        }
      ],
      passingScore: 60
    }
  },
  {
    title: 'Advanced DeFi Quiz',
    description: 'Challenge yourself with advanced DeFi protocol questions',
    type: 'QUIZ',
    difficulty: 'HARD',
    reward: {
      tokens: 250,
      points: 500,
      symbol: 'VEIL'
    },
    maxParticipants: 5000,
    participants: 789,
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    quizConfig: {
      questions: [
        {
          question: 'What is impermanent loss in liquidity pools?',
          options: [
            'Loss due to hacking',
            'Loss from price divergence vs holding',
            'Transaction fees',
            'Gas fees'
          ],
          correctAnswer: 1,
          points: 20
        },
        {
          question: 'What is a flash loan?',
          options: [
            'A very fast transaction',
            'An uncollateralized loan repaid in same tx',
            'A type of staking',
            'A quick swap'
          ],
          correctAnswer: 1,
          points: 20
        },
        {
          question: 'What does TVL stand for?',
          options: [
            'Total Value Locked',
            'Transaction Value Limit',
            'Token Value Level',
            'Trading Volume Limit'
          ],
          correctAnswer: 0,
          points: 20
        },
        {
          question: 'What is yield farming?',
          options: [
            'Growing crops',
            'Mining cryptocurrency',
            'Earning rewards by providing liquidity',
            'Buying low selling high'
          ],
          correctAnswer: 2,
          points: 20
        },
        {
          question: 'What is an oracle in blockchain?',
          options: [
            'A prediction tool',
            'A data feed from external sources',
            'A mining pool',
            'A type of wallet'
          ],
          correctAnswer: 1,
          points: 20
        }
      ],
      passingScore: 80
    },
    antiCheat: {
      minAccountAge: 14,
      requireVerification: false,
      cooldownPeriod: 24
    }
  },
  {
    title: 'NFT Knowledge Test',
    description: 'Prove your understanding of NFTs and digital collectibles',
    type: 'QUIZ',
    difficulty: 'MEDIUM',
    reward: {
      tokens: 120,
      points: 240,
      symbol: 'VEIL'
    },
    maxParticipants: 8000,
    participants: 2345,
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    quizConfig: {
      questions: [
        {
          question: 'What does NFT stand for?',
          options: [
            'New Financial Token',
            'Non-Fungible Token',
            'Network File Transfer',
            'Next-Gen Finance Tool'
          ],
          correctAnswer: 1,
          points: 15
        },
        {
          question: 'What makes an NFT unique?',
          options: [
            'Its price',
            'Its metadata and token ID',
            'Its color',
            'Its size'
          ],
          correctAnswer: 1,
          points: 15
        },
        {
          question: 'What is minting an NFT?',
          options: [
            'Selling an NFT',
            'Creating a new NFT on blockchain',
            'Buying an NFT',
            'Transferring an NFT'
          ],
          correctAnswer: 1,
          points: 15
        },
        {
          question: 'Which standard is commonly used for NFTs on Ethereum?',
          options: [
            'ERC-20',
            'ERC-721',
            'BEP-20',
            'TRC-20'
          ],
          correctAnswer: 1,
          points: 15
        }
      ],
      passingScore: 70
    }
  },

  // Additional missions for variety
  {
    title: 'Comment on Our YouTube Video',
    description: 'Watch our latest tutorial video and leave a thoughtful comment',
    type: 'SNS',
    platform: 'YouTube',
    difficulty: 'EASY',
    reward: {
      tokens: 60,
      points: 120,
      symbol: 'VEIL'
    },
    maxParticipants: 3000,
    participants: 1456,
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-06-30'),
    snsConfig: {
      actionType: 'COMMENT',
      targetUrl: 'https://youtube.com/watch?v=example'
    }
  },
  {
    title: 'Transfer VEIL Tokens',
    description: 'Make your first VEIL token transfer to another wallet',
    type: 'ONCHAIN',
    difficulty: 'EASY',
    reward: {
      tokens: 50,
      points: 100,
      symbol: 'VEIL'
    },
    maxParticipants: 5000,
    participants: 2678,
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    onchainConfig: {
      chain: 'BSC',
      actionType: 'TRANSFER',
      contractAddress: '0xVEILTokenAddressxxxxxxxxxxxxxxxxxx',
      minAmount: 10,
      tokenSymbol: 'VEIL'
    }
  },
  {
    title: 'Security Best Practices Quiz',
    description: 'Learn about wallet security and safe trading practices',
    type: 'QUIZ',
    difficulty: 'MEDIUM',
    reward: {
      tokens: 150,
      points: 300,
      symbol: 'VEIL'
    },
    maxParticipants: 10000,
    participants: 3890,
    status: 'ACTIVE',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    quizConfig: {
      questions: [
        {
          question: 'Should you share your private key?',
          options: [
            'Yes, with friends',
            'Only with support team',
            'Never with anyone',
            'Only when selling NFTs'
          ],
          correctAnswer: 2,
          points: 20
        },
        {
          question: 'What is a hardware wallet?',
          options: [
            'A physical device storing keys offline',
            'A computer',
            'A mining rig',
            'A phone app'
          ],
          correctAnswer: 0,
          points: 20
        },
        {
          question: 'What is phishing in crypto?',
          options: [
            'A fishing game',
            'Scam to steal credentials',
            'A trading strategy',
            'Mining technique'
          ],
          correctAnswer: 1,
          points: 20
        }
      ],
      passingScore: 70
    }
  }
];

async function seedMissions() {
  try {
    // Find or create a default admin user for createdBy field
    let adminUser = await User.findOne({ walletAddress: 'ADMIN_WALLET' });

    if (!adminUser) {
      adminUser = await User.create({
        walletAddress: 'ADMIN_WALLET',
        referralCode: 'ADMIN000'
      });
      console.log('✅ Created admin user');
    }

    // Clear existing missions (optional - comment out if you want to keep existing)
    // await Mission.deleteMany({});
    // console.log('🗑️  Cleared existing missions');

    // Add createdBy to all missions
    const missionsWithAdmin = sampleMissions.map(mission => ({
      ...mission,
      createdBy: adminUser._id
    }));

    // Insert missions
    const result = await Mission.insertMany(missionsWithAdmin);

    console.log(`✅ Successfully seeded ${result.length} missions!`);
    console.log('\nMission breakdown:');
    console.log(`- SNS missions: ${result.filter(m => m.type === 'SNS').length}`);
    console.log(`- ONCHAIN missions: ${result.filter(m => m.type === 'ONCHAIN').length}`);
    console.log(`- QUIZ missions: ${result.filter(m => m.type === 'QUIZ').length}`);

  } catch (error) {
    console.error('❌ Error seeding missions:', error);
    throw error;
  }
}

// If running directly
if (require.main === module) {
  const dotenv = require('dotenv');
  const connectDB = require('../config/database');

  dotenv.config();

  connectDB().then(async () => {
    await seedMissions();
    console.log('\n✨ Seeding complete!');
    process.exit(0);
  }).catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
}

module.exports = seedMissions;
