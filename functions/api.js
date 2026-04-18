const serverless = require('serverless-http');
const app = require('../backend/app');
const connectDB = require('../backend/config/db');

// Bridge Express to Netlify Functions
let isConnected = false;

module.exports.handler = async (event, context) => {
  // Prevent context waiting for DB connection to close
  context.callbackWaitsForEmptyEventLoop = false;

  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log('MongoDB Connected via Netlify Function');
    } catch (err) {
      console.error('DB Connection Error in Netlify Function:', err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Database connection failed" })
      };
    }
  }

  const handler = serverless(app);
  return await handler(event, context);
};
