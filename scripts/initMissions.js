const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models and config
const Mission = require('../src/models/Mission');
const User = require('../src/models/User');
const connectDB = require('../src/config/database');

// Sample missions - one of each type
const sampleMissions = [
  // SNS Mission - Follow on X/Twitter
  {
    title: '[FOLLOW_VEIL] Connect on X',
    description: 'Follow @VeilProtocol on X (Twitter) to stay updated with the latest news, features, and announcements. Join our growing community and earn VEIL tokens!',
    type: 'SNS',
    platform: 'X',
    difficulty: 'EASY',
    reward: {
      tokens: 50,
      points: 100,
      symbol: 'VEIL'
    },
    maxParticipants: 10000,
    participants: 0,
    status: 'ACTIVE',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    snsConfig: {
      actionType: 'FOLLOW',
      targetUrl: 'https://x.com/VeilProtocol',
      targetUsername: '@VeilProtocol'
    },
    antiCheat: {
      minAccountAge: 7, // 7 days minimum account age
      requireVerification: true,
      cooldownPeriod: 24 // 24 hours cooldown
    }
  },

  // ONCHAIN Mission - Stake Tokens
  {
    title: '[STAKE_VEIL] Stake Your Tokens',
    description: 'Stake a minimum of 100 VEIL tokens on BSC network to earn passive rewards and help secure the protocol. Your staked tokens will be locked for the mission duration.',
    type: 'ONCHAIN',
    platform: null,
    difficulty: 'MEDIUM',
    reward: {
      tokens: 150,
      points: 300,
      symbol: 'VEIL'
    },
    maxParticipants: 5000,
    participants: 0,
    status: 'ACTIVE',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    onchainConfig: {
      chain: 'BSC',
      actionType: 'STAKE',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      minAmount: 100,
      tokenSymbol: 'VEIL'
    },
    antiCheat: {
      minAccountAge: 0,
      requireVerification: true,
      cooldownPeriod: 48 // 48 hours cooldown
    }
  },

  // QUIZ Mission - VEIL Protocol Knowledge Test
  {
    title: '[KNOWLEDGE_TEST] VEIL Protocol Quiz',
    description: 'Test your knowledge about VEIL Protocol, Web3, and blockchain technology. Score 70% or higher to complete this mission and earn rewards. You can retake the quiz if you don\'t pass on the first attempt.',
    type: 'QUIZ',
    platform: null,
    difficulty: 'EASY',
    reward: {
      tokens: 100,
      points: 200,
      symbol: 'VEIL'
    },
    maxParticipants: 10000,
    participants: 0,
    status: 'ACTIVE',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    quizConfig: {
      questions: [
        {
          question: 'What is the primary purpose of VEIL Protocol?',
          options: [
            'To create a decentralized mission and rewards platform',
            'To mine cryptocurrency',
            'To trade NFTs',
            'To develop smart contracts'
          ],
          correctAnswer: 0,
          points: 25
        },
        {
          question: 'Which blockchain network does VEIL primarily use for staking?',
          options: [
            'Ethereum',
            'Solana',
            'BSC (Binance Smart Chain)',
            'Polygon'
          ],
          correctAnswer: 2,
          points: 25
        },
        {
          question: 'What are the three main types of missions in VEIL Protocol?',
          options: [
            'Buy, Sell, Trade',
            'SNS, ONCHAIN, QUIZ',
            'Easy, Medium, Hard',
            'Daily, Weekly, Monthly'
          ],
          correctAnswer: 1,
          points: 25
        },
        {
          question: 'What is the native token symbol of VEIL Protocol?',
          options: [
            'VIL',
            'VEIL',
            'VEL',
            'VPT'
          ],
          correctAnswer: 1,
          points: 25
        }
      ],
      passingScore: 70
    },
    antiCheat: {
      minAccountAge: 0,
      requireVerification: false,
      cooldownPeriod: 1 // 1 hour cooldown between attempts
    }
  }
];

async function initMissions() {
  try {
    console.log('🎯 Initializing Sample Missions...\n');

    // Find or create admin user for createdBy field
    let adminUser = await User.findOne({ walletAddress: 'ADMIN_WALLET' });

    if (!adminUser) {
      console.log('📝 Creating ADMIN_WALLET user...');
      adminUser = await User.create({
        walletAddress: 'ADMIN_WALLET',
        referralCode: 'ADMIN000'
      });
      console.log('✅ ADMIN_WALLET user created');
    } else {
      console.log('✅ Found existing ADMIN_WALLET user');
    }

    // Add createdBy to all missions
    const missionsWithAdmin = sampleMissions.map(mission => ({
      ...mission,
      createdBy: adminUser._id
    }));

    // Insert missions
    const result = await Mission.insertMany(missionsWithAdmin);

    console.log(`\n✅ Successfully created ${result.length} missions!`);
    console.log('\n📊 Mission breakdown:');
    console.log(`   SNS missions: ${result.filter(m => m.type === 'SNS').length}`);
    console.log(`   ONCHAIN missions: ${result.filter(m => m.type === 'ONCHAIN').length}`);
    console.log(`   QUIZ missions: ${result.filter(m => m.type === 'QUIZ').length}`);
    console.log(`   All missions set to ACTIVE status\n`);

  } catch (error) {
    console.error('❌ Error initializing missions:', error);
    throw error;
  }
}

// Run the script
connectDB()
  .then(async () => {
    await initMissions();
    console.log('✨ Mission initialization completed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection error:', err);
    process.exit(1);
  });
