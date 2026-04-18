const app = require('../backend/app');
const connectDB = require('../backend/config/db');

// Vercel Serverless Function entry point
module.exports = async (req, res) => {
  try {
    // Ensure DB connection
    await connectDB();
    
    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error('Vercel Entry Error:', error);
    res.status(500).json({ success: false, message: 'Serverless Entry Error', error: error.message });
  }
};
