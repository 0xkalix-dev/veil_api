# Mission API Documentation

## Overview
The Mission API allows users to participate in various types of missions (SNS, ONCHAIN, QUIZ) and earn rewards.

## Base URL
```
http://localhost:3000/api/missions
```

## Authentication
Most endpoints require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Get Mission Stats (Public)
```http
GET /api/missions/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMissions": 50,
    "activeMissions": 25,
    "totalParticipations": 1000,
    "byType": [
      { "_id": "SNS", "count": 20 },
      { "_id": "ONCHAIN", "count": 15 },
      { "_id": "QUIZ", "count": 15 }
    ],
    "byDifficulty": [
      { "_id": "EASY", "count": 20 },
      { "_id": "MEDIUM", "count": 20 },
      { "_id": "HARD", "count": 10 }
    ]
  }
}
```

---

### 2. Get All Missions
```http
GET /api/missions?type=SNS&difficulty=EASY&status=ACTIVE&page=1&limit=10
```

**Query Parameters:**
- `type` (optional): Filter by mission type (SNS, ONCHAIN, QUIZ)
- `difficulty` (optional): Filter by difficulty (EASY, MEDIUM, HARD)
- `status` (optional): Filter by status (default: ACTIVE)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): asc or desc (default: desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "missions": [
      {
        "_id": "mission_id",
        "title": "Follow @VeilProtocol",
        "description": "Follow our official X account",
        "type": "SNS",
        "platform": "X",
        "difficulty": "EASY",
        "reward": {
          "tokens": 50,
          "points": 100,
          "symbol": "VEIL"
        },
        "maxParticipants": 5000,
        "participants": 1247,
        "status": "ACTIVE",
        "startDate": "2025-01-01T00:00:00Z",
        "endDate": "2025-12-31T23:59:59Z",
        "timeRemaining": "2d 14h",
        "completionPercentage": "24.9"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

### 3. Get Mission by ID
```http
GET /api/missions/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mission": { /* mission object */ },
    "participation": {
      "_id": "participation_id",
      "status": "IN_PROGRESS",
      "progress": 50,
      "startedAt": "2025-01-15T10:00:00Z"
    }
  }
}
```

---

### 4. Start Mission
```http
POST /api/missions/:id/start
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "participation_id",
    "user": "user_id",
    "mission": "mission_id",
    "status": "IN_PROGRESS",
    "progress": 0,
    "startedAt": "2025-01-15T10:00:00Z"
  }
}
```

**Error Responses:**
- `400`: Mission not active, expired, or full
- `404`: Mission or user not found

---

### 5. Submit Mission (SNS/ONCHAIN)
```http
POST /api/missions/:id/submit
```

**Request Body:**
```json
{
  "proof": {
    "type": "URL",
    "value": "https://x.com/username/status/123456",
    "metadata": {
      "platform": "X",
      "actionType": "FOLLOW"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "participation_id",
    "status": "PENDING_VERIFICATION",
    "progress": 100,
    "proof": { /* proof object */ }
  }
}
```

---

### 6. Submit Quiz
```http
POST /api/missions/:id/submit-quiz
```

**Request Body:**
```json
{
  "answers": [
    { "questionIndex": 0, "selectedAnswer": 2 },
    { "questionIndex": 1, "selectedAnswer": 0 },
    { "questionIndex": 2, "selectedAnswer": 1 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 66.67,
    "passed": false,
    "correctAnswers": 2,
    "totalQuestions": 3,
    "participation": { /* participation object */ }
  }
}
```

---

### 7. Claim Rewards
```http
POST /api/missions/:id/claim
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rewards": {
      "tokens": 50,
      "points": 100,
      "symbol": "VEIL"
    },
    "newBalance": 1250
  }
}
```

---

### 8. Get My Missions
```http
GET /api/missions/my?status=COMPLETED&page=1&limit=10
```

**Query Parameters:**
- `status` (optional): Filter by participation status
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "participations": [
      {
        "_id": "participation_id",
        "mission": { /* populated mission object */ },
        "status": "COMPLETED",
        "progress": 100,
        "rewardClaimed": true,
        "startedAt": "2025-01-10T00:00:00Z",
        "completedAt": "2025-01-12T00:00:00Z"
      }
    ],
    "pagination": { /* pagination object */ }
  }
}
```

---

### 9. Create Mission (Admin)
```http
POST /api/missions
```

**Request Body (SNS Mission Example):**
```json
{
  "title": "Follow @VeilProtocol",
  "description": "Follow our official X account and help spread the word",
  "type": "SNS",
  "platform": "X",
  "difficulty": "EASY",
  "reward": {
    "tokens": 50,
    "points": 100,
    "symbol": "VEIL"
  },
  "maxParticipants": 5000,
  "status": "ACTIVE",
  "endDate": "2025-12-31T23:59:59Z",
  "snsConfig": {
    "actionType": "FOLLOW",
    "targetUsername": "VeilProtocol"
  }
}
```

**Request Body (ONCHAIN Mission Example):**
```json
{
  "title": "Stake SOL in Liquid Pool",
  "description": "Stake minimum 0.1 SOL for 7 days",
  "type": "ONCHAIN",
  "difficulty": "MEDIUM",
  "reward": {
    "tokens": 200,
    "points": 500,
    "symbol": "VEIL"
  },
  "maxParticipants": 1000,
  "status": "ACTIVE",
  "endDate": "2025-12-31T23:59:59Z",
  "onchainConfig": {
    "chain": "SOLANA",
    "actionType": "STAKE",
    "contractAddress": "0x123...",
    "minAmount": 0.1,
    "tokenSymbol": "SOL"
  }
}
```

**Request Body (QUIZ Mission Example):**
```json
{
  "title": "Web3 Knowledge Test",
  "description": "Test your Web3 knowledge",
  "type": "QUIZ",
  "difficulty": "MEDIUM",
  "reward": {
    "tokens": 100,
    "points": 200,
    "symbol": "VEIL"
  },
  "maxParticipants": 10000,
  "status": "ACTIVE",
  "endDate": "2025-12-31T23:59:59Z",
  "quizConfig": {
    "questions": [
      {
        "question": "What is a smart contract?",
        "options": [
          "A legal document",
          "Self-executing code on blockchain",
          "A cryptocurrency",
          "A wallet"
        ],
        "correctAnswer": 1,
        "points": 10
      }
    ],
    "passingScore": 70
  }
}
```

---

### 10. Update Mission (Admin)
```http
PUT /api/missions/:id
```

**Request Body:** (same as create, but all fields optional)

---

### 11. Delete Mission (Admin)
```http
DELETE /api/missions/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Mission deleted successfully"
}
```

---

## Mission Types

### SNS Missions
- **Platforms**: X, YouTube, Discord, Instagram, TikTok
- **Actions**: FOLLOW, LIKE, REPOST, COMMENT, SUBSCRIBE
- **Verification**: URL proof of action

### ONCHAIN Missions
- **Chains**: BSC, ETHEREUM, SOLANA, POLYGON
- **Actions**: STAKE, SWAP, MINT, TRANSFER, PROVIDE_LIQUIDITY
- **Verification**: Transaction hash

### QUIZ Missions
- **Format**: Multiple choice questions
- **Verification**: Automatic based on correct answers
- **Passing**: Configurable passing score (default 70%)

---

## Mission Status

- `DRAFT`: Not yet published
- `ACTIVE`: Currently available
- `PAUSED`: Temporarily unavailable
- `COMPLETED`: Finished (max participants reached)
- `EXPIRED`: Past end date

---

## Participation Status

- `IN_PROGRESS`: User started the mission
- `PENDING_VERIFICATION`: Submitted, awaiting verification
- `COMPLETED`: Successfully completed
- `FAILED`: Did not meet requirements
- `REJECTED`: Verification failed

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `400`: Bad request (validation error, mission full, etc.)
- `401`: Unauthorized (missing/invalid token)
- `404`: Resource not found
- `500`: Internal server error
