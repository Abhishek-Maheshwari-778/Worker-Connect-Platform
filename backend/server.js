/**
 * Labour Connect – Backend Entry Point
 */

require('dotenv').config();

const http      = require('http');
const app       = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const cronService   = require('./services/cronService');

const PORT = process.env.PORT || 5000;

const start = async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Create HTTP server
  const server = http.createServer(app);

  // 3. Set server timeout (5 minutes)
  server.timeout         = 300000; // 5 min
  server.keepAliveTimeout = 65000; // 65 sec

  // 4. Attach Socket.io
  const io = initSocket(server);
  app.locals.io = io;

  // 5. Start cron jobs (weekly/monthly resets, weekly winner)
  cronService.setIO(io);
  cronService.startCronJobs();

  // 6. Start listening
  server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   🚀  Labour Connect API                     ║');
    console.log(`║   📡  Server  : http://localhost:${PORT}         ║`);
    console.log(`║   🌱  Env     : ${process.env.NODE_ENV || 'development'}                  ║`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
  });

  // ── Handle connection errors on individual sockets ──────────────────────
  server.on('connection', (socket) => {
    socket.on('error', (err) => {
      if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET' || err.code === 'EPIPE') {
        // Client disconnected mid-request — not a server error, ignore silently
        return;
      }
      console.error('🔴  Socket error:', err.message);
    });
  });

  // ── Graceful shutdown ────────────────────────────────────────────────────
  const shutdown = (signal) => {
    console.log(`\n📴  ${signal} received – shutting down gracefully…`);
    server.close(() => {
      console.log('💤  HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
};

// ── Unhandled promise rejections ─────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  // Ignore connection aborted errors
  if (reason?.code === 'ECONNABORTED' || reason?.code === 'ECONNRESET') return;
  console.error('💥  Unhandled Rejection:', reason);
});

// ── Uncaught exceptions ───────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  // Ignore aborted connection errors
  if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET' || err.code === 'EPIPE') {
    console.warn('⚠️  Connection aborted by client (ignored)');
    return;
  }
  console.error('💥  Uncaught Exception:', err.message);
  process.exit(1);
});

start();