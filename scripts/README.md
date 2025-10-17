# VEIL API Scripts

Utility scripts for managing the VEIL Protocol API.

## Available Scripts

### initMissions.js

Initializes the mission database with sample missions.

**What it does:**
- Creates a SYSTEM_ADMIN user if it doesn't exist
- Creates one mission of each type:
  - **SNS Mission**: Follow @VeilProtocol on X/Twitter
  - **ONCHAIN Mission**: Stake 100 VEIL tokens on BSC
  - **QUIZ Mission**: VEIL Protocol knowledge test with 4 questions

**Usage:**

```bash
# Run directly with node
node scripts/initMissions.js

# Or use npm script (recommended)
npm run init:missions
```

**Environment Requirements:**
- `MONGODB_URI` must be set in `.env` file
- MongoDB server must be running and accessible

**Notes:**
- All missions are set to `ACTIVE` status by default
- Missions expire 30 days after creation
- Safe to run multiple times - creates new missions each time
- If you want to clear existing missions first, use MongoDB Compass or CLI

**Example Output:**
```
✅ MongoDB Connected
✅ Found existing SYSTEM_ADMIN user

🎯 Creating Sample Missions...

✅ SNS Mission Created:
   Title: [FOLLOW_VEIL] Connect on X
   Type: SNS
   Platform: X
   Reward: 50 VEIL

✅ ONCHAIN Mission Created:
   Title: [STAKE_VEIL] Stake Your Tokens
   Type: ONCHAIN
   Chain: BSC
   Min Amount: 100 VEIL
   Reward: 150 VEIL

✅ QUIZ Mission Created:
   Title: [KNOWLEDGE_TEST] VEIL Protocol Quiz
   Type: QUIZ
   Questions: 4
   Passing Score: 70%
   Reward: 100 VEIL

🎉 All sample missions created successfully!
```

## Future Scripts

- `clearMissions.js` - Remove all missions from database
- `migrateData.js` - Migrate data between schema versions
- `seedUsers.js` - Create test user accounts
- `exportData.js` - Export mission/user data to JSON
