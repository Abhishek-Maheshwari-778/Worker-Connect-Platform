const mongoose = require('mongoose');

/**
 * Connect to MongoDB with retry logic and comprehensive logging.
 * Exported and called once from server.js at startup.
 */
const connectDB = async () => {
  const MAX_RETRIES = 5;
  let attempts = 0;

  const connect = async () => {
    try {
      attempts += 1;
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        // Modern Mongoose no longer needs useNewUrlParser / useUnifiedTopology
        // but we can still tune the connection pool
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log(
        `✅  MongoDB Connected: ${conn.connection.host} [${conn.connection.name}]`
      );
    } catch (error) {
      console.error(`❌  MongoDB Connection Error (attempt ${attempts}): ${error.message}`);

      if (attempts < MAX_RETRIES) {
        const delay = attempts * 2000; // incremental back-off
        console.log(`🔄  Retrying in ${delay / 1000}s…`);
        await new Promise((res) => setTimeout(res, delay));
        return connect();
      }

      console.error('💀  Max retries reached. Shutting down.');
      process.exit(1);
    }
  };

  await connect();
};

// ─── Mongoose Global Settings ──────────────────────────────────────────────────
mongoose.set('strictQuery', true); // silence deprecation warning

// ─── Connection Events ─────────────────────────────────────────────────────────
mongoose.connection.on('disconnected', () =>
  console.warn('⚠️  MongoDB disconnected')
);
mongoose.connection.on('reconnected', () =>
  console.info('🔁  MongoDB reconnected')
);
mongoose.connection.on('error', (err) =>
  console.error(`🔴  Mongoose error: ${err}`)
);

module.exports = connectDB;
