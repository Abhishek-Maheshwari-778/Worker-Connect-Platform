const app = require('../backend/app');
const connectDB = require('../backend/config/db');

// Vercel Serverless Function entry point
module.exports = async (req, res) => {
  try {
    // Validate existence of critical env vars
    if (!process.env.MONGO_URI) {
      throw new Error('Missing MONGO_URI environment variable');
    }

    // Ensure DB connection
    await connectDB();
    
    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error('CRITICAL VERCEL ERROR:', {
      message: error.message,
      stack: error.stack,
      env: {
        hasMongo: !!process.env.MONGO_URI,
        nodeEnv: process.env.NODE_ENV
      }
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Serverless Entry Error', 
      error: error.message,
      details: error.stack // Temporarily show stack even in production for debugging
    });
  }
};
