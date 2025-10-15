const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS with whitelist
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

console.log('🔒 CORS Configuration:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   Allowed Origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    console.log('📡 Request from origin:', origin);

    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      console.log('   ✅ Allowed (no origin)');
      return callback(null, true);
    }

    // In development, allow localhost variants
    if (process.env.NODE_ENV === 'development') {
      const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
      if (isLocalhost) {
        console.log('   ✅ Allowed (development localhost)');
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      console.log('   ✅ Allowed (whitelist)');
      callback(null, true);
    } else {
      console.log('   ❌ Blocked - not in whitelist');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
const authRoutes = require('./routes/auth');
const referralRoutes = require('./routes/referral');
const missionRoutes = require('./routes/mission');
app.use('/api/auth', authRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/missions', missionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Veil API server running on port ${PORT}`);
});
