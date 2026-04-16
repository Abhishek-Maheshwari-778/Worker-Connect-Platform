// const express        = require('express');
// const cors           = require('cors');
// const helmet         = require('helmet');
// const morgan         = require('morgan');
// const rateLimit      = require('express-rate-limit');
// const mongoSanitize  = require('express-mongo-sanitize');
// const cookieParser   = require('cookie-parser');
// const path           = require('path');

// const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// // ── Route imports ──────────────────────────────────────────────────────────────
// const authRoutes           = require('./routes/authRoutes');
// const userRoutes           = require('./routes/userRoutes');
// const jobRoutes            = require('./routes/jobRoutes');
// const ratingRoutes         = require('./routes/ratingRoutes');
// const chatRoutes           = require('./routes/chatRoutes');
// const adminRoutes          = require('./routes/adminRoutes');
// const schemeRoutes         = require('./routes/schemeRoutes');
// const recommendationRoutes = require('./routes/recommendationRoutes');
// const chatbotRoutes        = require('./routes/chatbotRoutes');
// const notificationRoutes   = require('./routes/notificationRoutes');
// const leaderboardRoutes    = require('./routes/leaderboardRoutes');
// const otpRoutes            = require('./routes/otpRoutes');
// const disputeRoutes        = require('./routes/disputeRoutes'); // ✅ added
// const contactRoutes = require('./routes/contactRoutes');

// const app = express();

// /* ══════════════════════════════════════════════════════════════════════════════
//    SECURITY
// ══════════════════════════════════════════════════════════════════════════════ */

// app.use(
//   helmet({
//     crossOriginResourcePolicy: { policy: 'cross-origin' },
//   })
// );

// app.use(mongoSanitize());

// const limiter = rateLimit({
//   windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
//   max:      Number(process.env.RATE_LIMIT_MAX) || 100,
//   message:  { success: false, message: 'Too many requests. Please try again later.' },
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use('/api', limiter);

// /* ══════════════════════════════════════════════════════════════════════════════
//    CORE MIDDLEWARE
// ══════════════════════════════════════════════════════════════════════════════ */

// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || 'http://localhost:3000',
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//   })
// );

// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// app.use(cookieParser());

// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// }

// /* ══════════════════════════════════════════════════════════════════════════════
//    STATIC
// ══════════════════════════════════════════════════════════════════════════════ */

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// /* ══════════════════════════════════════════════════════════════════════════════
//    HEALTH CHECK
// ══════════════════════════════════════════════════════════════════════════════ */

// app.get('/health', (_req, res) => {
//   res.status(200).json({
//     success: true,
//     status: 'OK',
//     service: 'Labour Connect API',
//     version: '1.0.0',
//     timestamp: new Date().toISOString(),
//   });
// });

// /* ══════════════════════════════════════════════════════════════════════════════
//    MODEL PRELOAD (IMPORTANT)
// ══════════════════════════════════════════════════════════════════════════════ */

// require('./models/auditLogModel');
// require('./models/disputeModel');

// /* ══════════════════════════════════════════════════════════════════════════════
//    ROUTES
// ══════════════════════════════════════════════════════════════════════════════ */

// const API = '/api';

// app.use(`${API}/auth`,            authRoutes);
// app.use(`${API}/users`,           userRoutes);
// app.use(`${API}/jobs`,            jobRoutes);
// app.use(`${API}/ratings`,         ratingRoutes);
// app.use(`${API}/chat`,            chatRoutes);
// app.use(`${API}/admin`,           adminRoutes);
// app.use(`${API}/schemes`,         schemeRoutes);
// app.use(`${API}/recommendations`, recommendationRoutes);
// app.use(`${API}/chatbot`,         chatbotRoutes);
// app.use(`${API}/notifications`,   notificationRoutes);
// app.use(`${API}/leaderboard`,     leaderboardRoutes);
// app.use(`${API}/otp`,             otpRoutes);
// app.use(`${API}/disputes`,        disputeRoutes); // ✅ added
// app.use(`${API}/contact`,         contactRoutes);

// /* ══════════════════════════════════════════════════════════════════════════════
//    ERROR HANDLING
// ══════════════════════════════════════════════════════════════════════════════ */

// app.use(notFound);
// app.use(errorHandler);

// module.exports = app;

const express        = require('express');
const cors           = require('cors');
const helmet         = require('helmet');
const morgan         = require('morgan');
const rateLimit      = require('express-rate-limit');
const mongoSanitize  = require('express-mongo-sanitize');
const cookieParser   = require('cookie-parser');
const path           = require('path');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// ── Route imports ──────────────────────────────────────────────────────────────
const authRoutes           = require('./routes/authRoutes');
const userRoutes           = require('./routes/userRoutes');
const jobRoutes            = require('./routes/jobRoutes');
const ratingRoutes         = require('./routes/ratingRoutes');
const chatRoutes           = require('./routes/chatRoutes');
const adminRoutes          = require('./routes/adminRoutes');
const schemeRoutes         = require('./routes/schemeRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const chatbotRoutes        = require('./routes/chatbotRoutes');
const notificationRoutes   = require('./routes/notificationRoutes');
const leaderboardRoutes    = require('./routes/leaderboardRoutes');
const otpRoutes            = require('./routes/otpRoutes');
const contactRoutes        = require('./routes/contactRoutes');
const disputeRoutes        = require('./routes/disputeRoutes');
const { startCronJobs, setIO } = require('./services/cronService');

const app = express();

// ── Security headers ───────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images
  })
);

// ── CORS ───────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin:      process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate limiting ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max:      Number(process.env.RATE_LIMIT_MAX)        || 100,
  message:  { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
});
app.use('/api', limiter);

// ── Body parsers ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── MongoDB query sanitization (prevent NoSQL injection) ───────────────────────
app.use(mongoSanitize());

// ── HTTP request logging ───────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Static files (local uploads fallback) ─────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status:  'OK',
    service: 'Labour Connect API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── API routes ─────────────────────────────────────────────────────────────────
const API = '/api';
app.use(`${API}/auth`,            authRoutes);
app.use(`${API}/users`,           userRoutes);
app.use(`${API}/jobs`,            jobRoutes);
app.use(`${API}/ratings`,         ratingRoutes);
app.use(`${API}/chat`,            chatRoutes);
app.use(`${API}/admin`,           adminRoutes);
app.use(`${API}/schemes`,         schemeRoutes);
app.use(`${API}/recommendations`, recommendationRoutes);
app.use(`${API}/chatbot`,         chatbotRoutes);
app.use(`${API}/notifications`,   notificationRoutes);
app.use(`${API}/leaderboard`,      leaderboardRoutes);
app.use(`${API}/otp`,             otpRoutes);
app.use(`${API}/contact`,         contactRoutes);      // POST /api/contact (public form submit)
app.use(`${API}/admin/contacts`,  contactRoutes);      // GET/PATCH/DELETE /api/admin/contacts (admin panel)
app.use(`${API}/disputes`,        disputeRoutes);
// ── 404 catcher & global error handler ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;