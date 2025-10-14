# Veil API

Web3 wallet-based authentication API server using Express, MongoDB, and JWT.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally on port 27017)

## Setup

```bash
npm install
```

## Configuration

Create a `.env` file or update the existing one with:

```env
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
DB_NAME=veil_db

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_change_this_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## Run

```bash
# Production mode
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

## API Endpoints

### Public Endpoints

#### Health Check
- `GET /health` - Server health check

#### Authentication
- `POST /api/auth/login` - Login or auto-register with wallet address
  ```json
  {
    "walletAddress": "0x..."
  }
  ```
  Response:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "...",
      "refreshToken": "...",
      "walletAddress": "0x...",
      "isNewUser": false
    }
  }
  ```

- `POST /api/auth/logout` - Logout and clear refresh token
  ```json
  {
    "walletAddress": "0x..."
  }
  ```

- `POST /api/auth/refresh` - Refresh access token
  ```json
  {
    "refreshToken": "..."
  }
  ```

### Protected Endpoints

These endpoints require an `Authorization: Bearer <accessToken>` header.

- `GET /api/auth/me` - Get current user information

## Frontend Integration Guide

### 1. Wallet Connection (Login)
When user connects wallet or wallet address changes:
```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ walletAddress: '0x...' })
});

const { data } = await response.json();
// Store tokens in localStorage or state management
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);
```

### 2. API Calls with Authentication
Include access token in Authorization header:
```javascript
const response = await fetch('http://localhost:3000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
```

### 3. Token Refresh
When access token expires (401 error):
```javascript
const response = await fetch('http://localhost:3000/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refreshToken')
  })
});

const { data } = await response.json();
localStorage.setItem('accessToken', data.accessToken);
```

### 4. Wallet Disconnect (Logout)
When user disconnects wallet:
```javascript
await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ walletAddress: '0x...' })
});

// Clear stored tokens
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection URI
- `DB_NAME` - Database name (default: veil_db)
- `JWT_SECRET` - Secret key for access token signing
- `JWT_REFRESH_SECRET` - Secret key for refresh token signing
- `JWT_EXPIRES_IN` - Access token expiration time (default: 15m)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration time (default: 7d)

## Features

- 🔐 Wallet address-based authentication
- ✨ Auto-registration on first login
- 🎫 JWT access token (15 minutes)
- 🔄 Refresh token (7 days)
- 🛡️ Protected routes with middleware
- 📦 MongoDB user storage
