require('dotenv').config();
const app = require('../backend/app');
const connectDB = require('../backend/config/db');

// Vercel Serverless Function entry point
module.exports = async (req, res) => {
  try {
    // 1. Ensure DB connection
    if (!process.env.MONGO_URI) {
      console.error('❌ CRITICAL: MONGO_URI is missing from Vercel Environment Variables');
      return res.status(500).json({ error: 'Database configuration missing' });
    }
    
    await connectDB();
    
    // 2. Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error('🔥 VERCEL SERVERLESS ERROR:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Serverless Runtime Error', 
      error: error.message 
    });
  }
};
